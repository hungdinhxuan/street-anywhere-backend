const { AdminDocs } = require('../admin');
const { BookmarkDocs } = require('../bookmark');
const { CategoryDocs } = require('../category');
const { CommentDocs } = require('../comment');
const { PostDocs } = require('../post');
const { ReactionDocs } = require('../reaction');
const { TagDocs } = require('../tag');
const { AuthDocs } = require('./../auth');

const env = process.env.NODE_ENV || 'development';
const protocol = env === 'production' ? 'https' : 'http';

module.exports = {
  swagger: '2.0',
  info: {
    version: '1.0.0',
    title: 'Street AnyWhere API',
    description: 'Street AnyWhere API',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  host: process.env.HOST,
  basePath: process.env.BASE_PATH,
  tags: [
    AuthDocs.tag,
    AdminDocs.tag,
    BookmarkDocs.tag,
    CategoryDocs.tag,
    CommentDocs.tag,
    PostDocs.tag,
    ReactionDocs.tag,
    TagDocs.tag,
  ],
  schemes: [protocol],
  consumes: ['application/json'],
  produces: ['application/json'],
  paths: {
    ...AuthDocs.paths,
    ...AdminDocs.paths,
    ...BookmarkDocs.paths,
    ...CategoryDocs.paths,
    ...CommentDocs.paths,
    ...PostDocs.paths,
    ...ReactionDocs.paths,
    ...TagDocs.paths,
  },
};
