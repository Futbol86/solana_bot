import { BotConfig } from "../../models/index.js"
import lodash from "lodash"
import { Op } from "sequelize"

class BotConfigDb {
    constructor() {
    }

    create_or_update_data = async(payload) => {
        const firstData = await BotConfig.findOne({});

        if(lodash.isNil(firstData)) {
            var newData = BotConfig.build(payload);
            await newData.save();

            return true
        } else {
            await firstData.update(payload);

            return true
        }

        return false
    }

    get_first_data = async() => {
        const firstData = await BotConfig.findOne({});
        return firstData
    }
}

export { BotConfigDb }