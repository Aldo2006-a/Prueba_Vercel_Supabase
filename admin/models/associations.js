import Role from './role.js';
import User from './user.js';
import Store from './store.js';
import Category from './category.js';
import Product from './product.js';

// roles 1 --- N users
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// users 1 --- 1 stores
User.hasOne(Store, { foreignKey: 'user_id', as: 'store' });
Store.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// stores 1 --- N categories
Store.hasMany(Category, { foreignKey: 'store_id', as: 'categories' });
Category.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

// stores 1 --- N products
Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });
Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

// categories 1 --- N products
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

export { Role, User, Store, Category, Product };
