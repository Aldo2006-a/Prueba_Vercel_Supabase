import { DataTypes } from 'sequelize';
import sequelize from '../../configs/database.js';

const Store = sequelize.define('Store', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    commercial_name: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    campus_location: {
        type: DataTypes.STRING(100),
    },
    logo_url: {
        type: DataTypes.STRING(150),
    },
    operative_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
}, {
    tableName: 'stores',
    timestamps: false,
});

export default Store;
