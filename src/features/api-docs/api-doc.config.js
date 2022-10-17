const { AuthDocs } = require('./../auth');

const env = process.env.NODE_ENV || 'development';
const protocol = env === 'production' ? 'https' : 'http';

module.exports = {
  swagger: '2.0',
  info: {
    version: '1.0.0',
    title: 'UIT Thesis',
    description: 'UIT Thesis',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  host: process.env.HOST,
  basePath: process.env.BASE_PATH,
  tags: [AuthDocs.tag],
  schemes: [protocol],
  consumes: ['application/json'],
  produces: ['application/json'],
  paths: {
    ...AuthDocs.paths,
  },
};
