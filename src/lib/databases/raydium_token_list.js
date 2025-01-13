import { RaydiumTokenList } from "../../models/index.js"
import lodash from "lodash"
import { Op } from "sequelize"

class RaydiumTokenListDb {
    constructor() {
        // this.db = db;
    }

    add_data = async(payload) => {
        const firstData = await RaydiumTokenList.findOne({ 
            where: { 
                "address": payload.address
            } 
        });

        if(lodash.isNil(firstData)) {
            var newData = RaydiumTokenList.build(payload);
            await newData.save();

            return true
        }

        return false
    }

    // delete_data = async(idOrWallet) => {
    //     var findOneData = await RaydiumTokenList.findOne({ 
    //         where: {                   
    //             [Op.or]: [
    //                 {
    //                     id: idOrWallet
    //                 },
    //                 {
    //                     wallet: idOrWallet
    //                 },
    //             ]
    //         } 
    //     });

    //     if(findOneData !== null && findOneData !== undefined) {
    //         await findOneData.destroy({ force: true });

    //         return true
    //     }

    //     return false
    // }

    get_all_data = async() => {
        var allDatas = await RaydiumTokenList.findAll({ 
            where: {},
            order: [
                ['id', 'ASC']
            ],
        });

        return allDatas
    }
}

export { RaydiumTokenListDb }