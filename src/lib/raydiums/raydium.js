import { Keypair, PublicKey } from "@solana/web3.js"
import { Raydium, parseTokenAccountResp, PoolFetchType } from "@raydium-io/raydium-sdk-v2"
import { SolanaUtils } from "../solanas/solana-utils.js"
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"

class RaydiumUtil {
    constructor(connection) {
        this.connection = connection
        this.solanaUtils = new SolanaUtils(connection)
    }

    initialize = async() => {
        const connection = this.connection
        const keypair = this.solanaUtils.getKeyPair()

        this.raydium = await Raydium.load({
            connection,
            keypair
        })

        // console.log("raydium", this.raydium)
    }

    getTokenAccountData = async() => {
        const keypair = this.solanaUtils.getKeyPair()
        const solAccountResp = await this.connection.getAccountInfo(keypair.publicKey)
        const tokenAccountResp = await this.connection.getTokenAccountsByOwner(keypair.publicKey, {programId: TOKEN_PROGRAM_ID})
        const tokenAccount2022Resp = await this.connection.getTokenAccountsByOwner(keypair.publicKey, {programId: TOKEN_2022_PROGRAM_ID})
        const tokenAccountData = parseTokenAccountResp({
            owner: keypair.publicKey,
            solAccountResp,
            tokenAccountResp: {
                context: tokenAccountResp.context,
                value: [...tokenAccountResp.value, ...tokenAccount2022Resp.value]
            }
        })

        return tokenAccountData
    }

    getTokenAccountDataByPublicKey = async(publicKey) => {
        const pubKey = new PublicKey(publicKey)
        const solAccountResp = await this.connection.getAccountInfo(pubKey)
        const tokenAccountResp = await this.connection.getTokenAccountsByOwner(pubKey, {programId: TOKEN_PROGRAM_ID})
       // const tokenAccount2022Resp = await this.connection.getTokenAccountsByOwner(pubKey, {programId: TOKEN_2022_PROGRAM_ID})
        const tokenAccountData = parseTokenAccountResp({
            owner: pubKey,
            solAccountResp,
            tokenAccountResp: {
                context: tokenAccountResp.context,
               //value: [...tokenAccountResp.value, ...tokenAccount2022Resp.value]
                value: [...tokenAccountResp.value]
            }
        })

        return tokenAccountData
    }

    getTokenList = async() => {
        const data = await this.raydium.api.getTokenList()
        return data
    }

    getTokenInfo = async(tokenAddresses) => {
        const data = await this.raydium.api.getTokenInfo(tokenAddresses)
        return data
    }

    getPoolList = async () => {
        const data = await this.raydium.api.getPoolList({ type: PoolFetchType.Standard })
        console.log("get pool list", data)
        return data
    }

    getPoolById = async() => {
        const data = await this.raydium.api.fetchPoolById({
            ids: "61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht",
        })
        return data
    }

    // getXXX = async() => {
    //     const data = this.raydium.api.
    // }
}

export { RaydiumUtil }