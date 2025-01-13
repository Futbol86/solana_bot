import { 
    Connection, clusterApiUrl, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import {
    createMint, getMint, createAssociatedTokenAccount, getAccount, mintToChecked, transferChecked
} from "@solana/spl-token"
import BN from "bn.js"
import { RaydiumTokenListDb } from "../databases/raydium_token_list.js"
import { BotConfigDb } from "../databases/bot_config.js"
import { RaydiumUtil } from "../raydiums/raydium.js"
import { DexScreener } from "../dexscreener/index.js"
import { FormatNumbers } from "../utils/format-number.js"
const chatId = 1001360561;
var botConfig = {};
var subscriptionIdList = []

class SolanaBot {
    constructor(connection, telegramBot) {
        this.connection = connection
        this.telegramBot = telegramBot
        this.raydiumTokenListDb = new RaydiumTokenListDb()
        this.botConfigDb = new BotConfigDb()
        this.raydiumUtil = new RaydiumUtil(connection);
            
        this.dexScreener = new DexScreener();
        this.formatNumber = new FormatNumbers()
    }

    async initialize() {
        await this.raydiumUtil.initialize()
        botConfig = await this.botConfigDb.get_first_data()
    }

    async update() {
        botConfig = await this.botConfigDb.get_first_data()
    }

    async stopWatchingTransaction() {
        console.log("---- STOP WATCHING TRANSACTION", subscriptionIdList)
        subscriptionIdList && subscriptionIdList.map(id => {
            this.connection.removeOnLogsListener(id)
        })
        subscriptionIdList = []
    }

    startWatchingTransaction(pubKey) {
        const publicKey = new PublicKey(pubKey);
        const subscriptionId = this.connection.onLogs(
            publicKey, 
            async(logs, ctx) => {
                //console.log('--- logs', logs)
                const transactionSignature = logs.signature
                console.log('--- transactionsignature', pubKey + ":" + transactionSignature)
                this.parsedTransactionAndSaveDb(transactionSignature)
            }
        )
        console.log('---------- START WATCHING TRANSACTION --------------------')
        console.log(publicKey)
        // console.log(subscriptionId)
        subscriptionIdList.push(subscriptionId)
    }

    async getParsedTransaction(transactionSignature) {
        try {
            const transactionDetails = await this.connection.getParsedTransactions([transactionSignature], {
                maxSupportedTransactionVersion: 0
            })
            return transactionDetails;
        } catch(error) {
            console.log("Get Parsed Transaction error", error)
            return
        }
    }

    async parsedTransactionAndSaveDb(transactionSignature){
        const allRaydiumTokenListDb = await this.raydiumTokenListDb.get_all_data();
    
        let response = await this.getParsedTransaction(transactionSignature)
        const instructions = response[0]?.transaction?.message?.instructions
    
        const newRaydiumTokenListDb = new Map()
        const transferInfo = {}
        let transferType = 0
    
        if(instructions && instructions.length > 0) {
            instructions.map(async(instruction, idx) => {
                const program = instruction?.program
                if(program !== "spl-token") return
    
                if(instruction?.parsed) {
                    const type = instruction?.parsed?.type
    
                    transferType = (type === "transfer") ? 1 : (type === "transferChecked" ? 2 : 0);
                    return;
                }
            })
    
            if(transferType === 2) {
                // Bước 1: lưu ngay thông tin vào MintInfo
                instructions.map(async(instruction, idx) => {
                    if(instruction?.parsed) {
                        const type = instruction?.parsed?.type
    
                        if(type === "transferChecked") {
                            const mintAddress = instruction?.parsed?.info?.mint
                            const amount = instruction?.parsed?.info?.tokenAmount?.uiAmount
                            const decimals = instruction?.parsed?.info?.tokenAmount?.decimals
    
                            if(!transferInfo[mintAddress]) {
                                transferInfo[mintAddress] = {
                                    "type": "transferChecked",
                                    "amount": amount,
                                    decimals
                                }
                            } else {
                                transferInfo[mintAddress]["amount"] += amount
                            }
                        }
                    }
                })
                
            } else if(transferType === 1) {
                let sourceToMintMap = new Map()
    
                // Bước 1: lập mối quan hệ giữa Authority Mint và Mint Account
                instructions.map(async(instruction, idx) => {
                    if(instruction?.parsed) {
                        const sourceAddress = instruction?.parsed?.info?.source
                        const mintAddress = instruction?.parsed?.info?.mint
    
                        if(sourceAddress && mintAddress) {
                            sourceToMintMap.set(sourceAddress, mintAddress)
                        }
                    }
                })
    
                // Bước 2: Từ Authority sẽ truy ra Mint Account của instruction "transfer"
                instructions.map(async(instruction, idx) => {
                    if(instruction?.parsed) {
                        const type = instruction?.parsed?.type
                        const authorityAddress = instruction?.parsed?.info?.authority
    
                        if(type === "transfer" && authorityAddress) {
                            const mintAddress = sourceToMintMap.get(authorityAddress)
                            const amount = instruction?.parsed?.info?.amount
                            const amountBN = new BN(amount)
    
                            if(!transferInfo[mintAddress]) {
                                transferInfo[mintAddress] = {
                                    "type": "transfer",
                                    "amount": amountBN
                                }
                            } else {
                                transferInfo[mintAddress]["amount"] = transferInfo[mintAddress]["amount"].add(amountBN)
                            }
                        }
                    }
                })
            }
        }
    
        // Bước cuối cùng, kiểm tra trong database có mintAccount này nằm trong Raydium không, nếu có thì lấy data, còn nếu không thì thêm vào
        const raydiumTokenInfoPromises = []
    
        const getRaydiumTokenInfo = async(key) => {
            const firstRaydiumToken = allRaydiumTokenListDb.find(aRTLDoc => aRTLDoc.address === key);
    
            // nếu ko tìm thấy mint address trong database hiện tại
            if(!firstRaydiumToken) {
                // kiểm tra tiếp bằng api của raydiumUtil
                const response = await this.raydiumUtil.getTokenInfo([ key ])
                if(response[0]) {
                    const { symbol, name, decimals } = response[0] || {}
    
                    transferInfo[key] = { 
                        ...transferInfo[key],
                        symbol, name, decimals
                    }
    
                    if(!newRaydiumTokenListDb.has(key)) {
                        newRaydiumTokenListDb.set(key, response[0])
                    }
                }
            }
            // nếu tìm thấy address trong database hiện tại thì in ra 
            else {
                const { symbol, name, decimals } = firstRaydiumToken || {}
    
                transferInfo[key] = { 
                    ...transferInfo[key],
                    symbol, name, decimals 
                }
            }
        }
    
        Object.keys(transferInfo).map(async(key) => {
            raydiumTokenInfoPromises.push(getRaydiumTokenInfo(key))
        })
    
        await Promise.all(raydiumTokenInfoPromises)
    
        // Thêm vào RaydiumTokenList nếu token phát hiện là token mới
        if(newRaydiumTokenListDb.size > 0) {
            newRaydiumTokenListDb.forEach((value, key) => {
                this.raydiumTokenListDb.add_data(value)
            })
        }
    
        // Xử lý intructions là "transfer" thì chúng ta chia cho decimal để ra số đúng
        Object.keys(transferInfo).map(key => {
            if(transferInfo[key]["type"] === "transfer") {
                const amount = transferInfo[key]["amount"]
                const decimals = transferInfo[key]["decimals"] 
                if(amount && decimals) {
                    const parsedAmount = amount.toNumber()/ (10 ** decimals)
                    transferInfo[key]["amount"] = parsedAmount
                }
            }
        })
    
        // Lấy thông tin MarketCap và Liquidity của Token
        const dexScreenerTokenInfoPromises = []
        
        const getDexScreenerTokenInfo = async(key) => {
            let response = await this.dexScreener.getTokenInfo(key)
            if(response.pairs[0]) {
                const { priceUsd, liquidity, marketCap } = response.pairs[0] || {}
                // console.log("---- priceUsd, liquidity, marketCap", priceUsd, liquidity, marketCap)
                transferInfo[key] = {
                    ...transferInfo[key],
                    amountPriceUsd: transferInfo[key]["amount"] * parseFloat(priceUsd),
                    priceUsd,
                    liquidity: this.formatNumber.format(liquidity?.usd),
                    marketCap: this.formatNumber.format(marketCap),
                }
    
            }
        }
    
        Object.keys(transferInfo).map(async(key) => {
            dexScreenerTokenInfoPromises.push(getDexScreenerTokenInfo(key))
        })
    
        await Promise.all(dexScreenerTokenInfoPromises)

        //console.log("---- Transfer Info", transferInfo)

        Object.keys(transferInfo).map(key => {
            const { type, amount, symbol, name, decimals, priceUsd, amountPriceUsd, liquidity, marketCap } = transferInfo[key]
            console.log("---- amountPriceUsd", amountPriceUsd, botConfig.buy_over_limit)
            if(amountPriceUsd && amountPriceUsd >= botConfig.buy_over_limit) {
                let message = `🌞Solana Bot!🌞\n\n🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢\n\n` +
                    `Token ${symbol} (Market Cap: $${marketCap})\n` +
                    `Liquidity: ${liquidity}\n` +
                    `Price💵: ${priceUsd}\n` +
                    `Amount💳: ${this.formatNumber.format(amount || 0)}\n` +
                    `AmountPrice💵: ${this.formatNumber.format(amountPriceUsd || 0)}\n\n` +
                    `Contract Address: \n` +
                    `${key}`

                console.log("--------------------- MESSAGE 456 ---------------------------")
                console.log(message)
                this.telegramBot.sendMessage(chatId, message, {parse_mode: "HTML"})
            }
        })
    }
}

export { SolanaBot }