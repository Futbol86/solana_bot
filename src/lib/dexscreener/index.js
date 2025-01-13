import axios from "axios"

class DexScreener {
    constructor() {

    }

    getTokenInfo = async(tokenAddress) => {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${tokenAddress}`)
        //console.log("---- DATA", response.data)
        return response.data
    }
}

export {DexScreener}