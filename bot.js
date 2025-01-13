import TelegramBot from"node-telegram-bot-api"
import DateFormat from "date-format"
import lodash from "lodash"
import { SolanaUtils } from "./src/lib/solanas/solana-utils.js"
import { SolanaBot } from "./src/lib/solanas/solana-bot.js"
import { TrackingWalletDb } from "./src/lib/databases/tracking_wallet.js"
import { BotConfigDb } from "./src/lib/databases/bot_config.js"
import { RaydiumUtil } from "./src/lib/raydiums/raydium.js"
const token = "7779846248:AAGD3azl2_KmZC2lwEFv5F_jyIda-xn3OhU"
const chatId = 1001360561;
const COMMANDS = {
    "/aw": {
        name: "add wallet", description: "add tracking wallet by single or multiple (use ',' to join)"
    },
    "/dw": {
        name: "delete wallet", description: "delete tracking wallet by address or index"
    },
    "/lw": {
        name: "list wallet", description: "view list tracking wallets"
    },
    "/bol": {
        name: "buy over limit", description: "setting buy over limit, if KOL wallet buy over, bot will send message"
    },
    "/start": {
        name: "bot start", description: "bot begin tracking wallets"
    },
    "/stop": {
        name: "bot stop", description: "bot stop tracking wallets"
    },
    "/show_command": {
        name: "show command", description: "show all commands to control bot"
    },
}

class Bot {
    constructor(connection) {
        //const bot = new TelegramBot(token, {polling: true})
        this.bot = new TelegramBot(token, {polling: true})
        this.connection = connection
        this.solanaUtils = new SolanaUtils(this.connection)
        this.raydiumUtil = new RaydiumUtil(connection)
        this.solanaBot = new SolanaBot(this.connection, this.bot)
        this.trackingWalletDb = new TrackingWalletDb()
        this.botConfigDb = new BotConfigDb()
    }

    initialize = async() => {       
        this.bot.onText(/\/start/, async(msg) => {
            this.bot.sendMessage(msg.chat.id, `⭐⭐⭐ Bot start!`)
            this.startBot()
        })

        this.bot.onText(/\/stop/, async(msg) => {
            this.bot.sendMessage(msg.chat.id, `⭐⭐⭐ Bot stop!`)
            this.solanaBot.stopWatchingTransaction()
        })

        this.bot.onText(/\/aw/, async(msg) => {
            const inputArrays = msg.text.split(/\s/)
            for(let i = 1; i < inputArrays.length; i++) {
                // check xem có nằm trên onCurve không?
                const isOnCurve = this.solanaUtils.getWalletIsOnCurve(inputArrays[i].trim())
                if(isOnCurve) {
                    // tiếp theo check xem có token trên sàn Raydium không?
                    const response = await this.raydiumUtil.getTokenAccountDataByPublicKey(inputArrays[i].trim())
                    if(response?.tokenAccountRawInfos?.length === 0) {
                        this.bot.sendMessage(msg.chat.id, `Wallet cannot have token on Raydium: ${inputArrays[i].trim()}`)
                    } else {
                        const response2 = await this.trackingWalletDb.add_data(inputArrays[i].trim())
                        if(response2)
                            this.bot.sendMessage(msg.chat.id, `Add wallet success: ${inputArrays[i].trim()}`)
                        else
                            this.bot.sendMessage(msg.chat.id, `Wallet is existed in database: ${inputArrays[i].trim()}`)
                    }
                } else {
                    this.bot.sendMessage(msg.chat.id, `Add wallet failed: ${inputArrays[i].trim()}`)
                }
            }

            this.restartBot()
        })

        this.bot.onText(/\/dw/, async(msg) => {
            const inputArrays = msg.text.split(/\s/)
            for(let i = 1; i < inputArrays.length; i++) {
                const response = await this.trackingWalletDb.delete_data(inputArrays[i].trim())
                if(response)
                    this.bot.sendMessage(msg.chat.id, `Delete wallet success: ${inputArrays[i].trim()}`)
                else 
                    this.bot.sendMessage(msg.chat.id, `Delete wallet failed: ${inputArrays[i].trim()}`)
            }

            this.restartBot()
        })

        this.bot.onText(/\/lw/, async(msg) => {
            const response = await this.trackingWalletDb.get_data_list()
            if(response) {
                this.bot.sendMessage(msg.chat.id, JSON.stringify(response))
            }
        })

        this.bot.onText(/\/bol/, async(msg) => {
            const inputArrays = msg.text.split(/\s/)
            if(lodash.isInteger(parseInt(inputArrays[1]))) {
                const response = await this.botConfigDb.create_or_update_data({ buy_over_limit: parseInt(inputArrays[1]) })
                if(response) {
                    const response2 = await this.botConfigDb.get_first_data()
                    this.bot.sendMessage(msg.chat.id, JSON.stringify(response2))
                    this.solanaBot.update()
                }
            }

            this.restartBot()
        })

        this.bot.onText(/\/show_command/, async(msg) => {
            let message = ""
            Object.keys(COMMANDS).map(key => {
                const { name, description } = COMMANDS[key]
                message += `<b>${key} (${name})</b>: ${description}\n\n`
            })
            this.bot.sendMessage(msg.chat.id, message, {parse_mode: "HTML"})
        })

        this.bot.onText(/\/config/, async(msg) => {
            const response = await this.botConfigDb.get_first_data()
            if(response) {
                this.bot.sendMessage(msg.chat.id, JSON.stringify(response))
            }
        })

        // initialize
        await this.solanaBot.initialize()
    }

    restartBot = () => {
        console.log("---- restartBot")
        this.solanaBot.stopWatchingTransaction()
        this.startBot()
    }

    startBot = async() => {
        //this.solanaBot.startWatchingTransaction("DfMxre4cKmvogbLrPigxmibVTTQDuzjdXojWzjCXXhzj")
        const trackingWallets = await this.trackingWalletDb.get_data_list()
        if(trackingWallets && trackingWallets.length > 0) {
            trackingWallets.map(item => {
                this.solanaBot.startWatchingTransaction(item.wallet)
            })
        }
    }
}

export { Bot }