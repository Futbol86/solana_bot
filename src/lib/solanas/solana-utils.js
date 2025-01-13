import { PublicKey, Keypair } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import * as bs58 from "bs58"
import axios from "axios"
import dotev from "dotenv"
dotev.config()
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

class SolanaUtils {
    constructor(connection) {
        this.connection = connection
    }

    getWalletIsOnCurve(wallet) {
        try {
            const publicKey = new PublicKey(wallet)
            return PublicKey.isOnCurve(publicKey.toBytes())
        }
        catch(err) {
            console.error(err)
            return false
        }
    }

    getKeyPair() {
        const keypairBytes = bs58.default.decode(process.env.WALLET_PK)
        const keypair = Keypair.fromSecretKey(keypairBytes)
        return keypair
    }

    getAssociatedTokenAddress(walletAddress, tokenMintAddress) {
        return PublicKey.findProgramAddressSync(
            [
                walletAddress.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                tokenMintAddress.toBuffer()
            ],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )[0]
    }

    async getSOLBalance() {
        const keypair = this.getKeyPair()
        const SOLBalance = await this.connection.getBalance(keypair.publicKey)
        return SOLBalance
    }

    async getSolPriceGecko() {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
            const data = await response.data

            const solanaPrice = data.solana.usd
            console.log("solanaPrice", solanaPrice)
            return solanaPrice
        } catch(error) {
            console.error("get SOL Price error:", error)
        }
    }

    async getTokenBalance(tokenAddress) {
        try {
            const tokenAccount = new PublicKey(tokenAddress);
            const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccount)
            return tokenBalance
        } catch(error) {
            console.error("get Token balance error:", error)
        }
    }
}

export { SolanaUtils }