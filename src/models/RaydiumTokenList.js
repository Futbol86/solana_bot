const RaydiumTokenListModel = (sequelize, type) => {
	return sequelize.define("raydium_token_list", {
		id: {
			type: type.BIGINT,
			primaryKey: true,
			autoIncrement: true
		},
		address: {
            allowNull: false,
			type: type.TEXT
		},
        programId: {
			type: type.TEXT
		},
        logoURI: {
			type: type.TEXT
		},
        symbol: {
			type: type.TEXT
		},
        name: {
			type: type.TEXT
		},
        decimals: {
			type: type.INTEGER
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

export { RaydiumTokenListModel }