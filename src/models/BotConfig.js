const BotConfigModel = (sequelize, type) => {
	return sequelize.define("bot_config", {
		id: {
			type: type.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		buy_over_limit: {
            allowNull: false,
			type: type.FLOAT
		},
        sell_over_limit: {
			type: type.TEXT
		},
        created_at: { 
            type: type.DATE,
			defaultValue: new Date()
        },
		updated_at: { 
            type: type.DATE 
        },
	}, {
		charset: "utf8mb4",                                  
      	collate: "utf8mb4_general_ci",
		freezeTableName: true,
		timestamps: false,
	})
}

export { BotConfigModel }