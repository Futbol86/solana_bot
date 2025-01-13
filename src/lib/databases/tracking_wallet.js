import { TrackingWallet } from "../../models/index.js"
import lodash from "lodash"
import { Op } from "sequelize"

class TrackingWalletDb {
    constructor() {
        // this.db = db;
    }

    add_data = async(wallet) => {
        const findExistedWallet = await TrackingWallet.findOne({ 
            where: { 
                "wallet": wallet
            } 
        });

        if(lodash.isNil(findExistedWallet)) {
            var newData = TrackingWallet.build({ 
                wallet,
                created_at: new Date() 
            });
            await newData.save();

            return true
        }

        return false
    }

    delete_data = async(idOrWallet) => {
        var firstData = await TrackingWallet.findOne({ 
            where: {                   
                [Op.or]: [
                    {
                        id: idOrWallet
                    },
                    {
                        wallet: idOrWallet
                    },
                ]
            } 
        });

        if(firstData !== null && firstData !== undefined) {
            await firstData.destroy({ force: true });

            return true
        }

        return false
    }

    get_data_list = async() => {
        var findDatas = await TrackingWallet.findAll({ 
            where: {},
            order: [
                ['id', 'ASC']
            ],
        });

        return findDatas
    }
}

export { TrackingWalletDb }