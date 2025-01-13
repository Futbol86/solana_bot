import Sequelize from'sequelize';

import { TrackingWalletModel } from "./TrackingWallet.js";
import { RaydiumTokenListModel } from "./RaydiumTokenList.js";
import { BotConfigModel } from "./BotConfig.js";

var username = "root";
var password = "Kem@18072024";
// var password = "root@123";
var database = "solana_bot";
var host     = "localhost";
var dialect  = "mysql";

var sequelize = new Sequelize(database, username, password, {
    host: host,
	dialect: dialect,
	pool: {
	    max: 10,
	    min: 0,
	    acquire: 30000,
	    idle: 10000
  	},
  	logging: false
});

const TrackingWallet 			= TrackingWalletModel(sequelize, Sequelize);
const RaydiumTokenList 			= RaydiumTokenListModel(sequelize, Sequelize);
const BotConfig 				= BotConfigModel(sequelize, Sequelize);

// sequelize.sync({ force: false })
//   .then(() => {
//     console.log(`Database & tables created!`)
// })

export { TrackingWallet, RaydiumTokenList, BotConfig }