const bcryptjs = require('bcryptjs');
const _ = require('lodash');

module.exports = {
  createError: (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  },
  hashPassword: async (password) => {
    try {
      const hash = await bcryptjs.hash(password, 10);
      return hash;
    } catch (error) {
      console.log('Error: Hash password');
      throw error;
    }
  },
  isPasswordMatch: async (password, hash) => {
    try {
      return await bcryptjs.compare(password, hash);
    } catch (error) {
      console.log('Error: Compare password');
      throw error;
    }
  },
  destruct: (exclusiveProps, obj) => {
    return _.omit(obj, exclusiveProps);
  },
};