import Role from './role.js';
import User from './user.js';

// roles 1 --- N users
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

export { Role, User };
