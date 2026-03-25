const User = require('../models/userModel');
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);
exports.deleteAllUsers = factory.deleteAll(User);
exports.getUserById = factory.getById(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
