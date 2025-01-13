const TrackingWalletModel = (sequelize, type) => {
	return sequelize.define("tracking_wallets", {
		id: {
			type: type.BIGINT,
			primaryKey: true,
			autoIncrement: true
		},
		wallet: {
            allowNull: false,
			type: type.TEXT
		},
        created_at: { 
            type: type.DATE 
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

export { TrackingWalletModel }