
import cron from "node-cron"
import { RaydiumUtil } from "../raydiums/raydium.js"
import { RaydiumTokenListDb } from "../databases/raydium_token_list.js"

class CronJob {
    constructor(connection) {
        this.connection = connection
        this.raydiumTokenListDb = new RaydiumTokenListDb()
    }

    async updateRaydiumTokenList() {
        cron.schedule("*/2 * * * *", async() => {
            console.log("start cron job every 2 minutes")
            let raydiumUtil = new RaydiumUtil(this.connection);
            await raydiumUtil.initialize()

            let totalAddSuccess = 0
            let response = await raydiumUtil.getTokenList()
            //console.log(" get token list", response)

            if(response.mintList.length > 0) {
                response.mintList.map(async(item) => {
                    const isAdd = await this.raydiumTokenListDb.add_data(item);
                    // console.log("--- item", item, isAdd)
                    totalAddSuccess += isAdd ? 1 : 0
                })

                console.log(`Update Raydium token list success: ${totalAddSuccess}`)
            }
        })
    }
}

export { CronJob }