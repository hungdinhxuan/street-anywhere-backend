const catchAsync = require('../../utils/catchAsync');
const {
  user: User,
  post: Post,
  bookmark: Bookmark,
  tag: Tag,
  category: Category,
  comment: Comment,
  reaction: Reaction,
} = require('./../../models');
const _ = require('lodash');
const helpers = require('./../../utils/helper');
const BookmarkUtils = require('./bookmark.utils');

module.exports = {
  addBookmark: catchAsync(async (req, res, next) => {
    const { userId, postId } = req.body;
    const [checkUser, checkPost] = await Promise.all([
      User.findByPk(+userId),
      Post.findByPk(+postId),
    ]);
    if (_.isNil(checkUser)) {
      throw helpers.createError(400, 'The user does not exist');
    }
    if (_.isNil(checkPost)) {
      throw helpers.createError(400, 'The post does not exist');
    }
    const newBookmark = await Bookmark.create(req.body);
    const { id, ...rest } = newBookmark.toJSON();
    const responseValue = {
      bookmarkId: id,
      ...rest,
    };
    return res.status(201).json({
      status: 'Success',
      message: 'Add bookmark successfully',
      value: responseValue,
    });
  }),
  getBookmarkByUserId: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const allBookmarks = await Bookmark.findAndCountAll({
      where: {
        userId: +userId,
      },
      attributes: {
        exclude: ['userId', 'postId'],
      },
      include: [
        {
          model: Post,
          attributes: {
            exclude: ['mediaSource', 'userId', 'createdAt', 'updatedAt'],
          },
          include: [
            {
              model: Tag,
            },
            {
              model: Category,
            },
            {
              model: Reaction,
            },
            {
              model: Bookmark,
            },
            {
              model: Comment,
            },
          ],
        },
      ],
    });
    return res.status(200).json({
      status: 'Success',
      value: BookmarkUtils.constructResponseForGetStoredPost(allBookmarks),
    });
  }),
  deleteBookmark: catchAsync(async (req, res, next) => {
    const { bookmarkId } = req.params;
    const deletedCount = await Bookmark.destroy({
      where: {
        id: +bookmarkId,
      },
    });
    if (!deletedCount) {
      throw helpers.createError(404, 'No bookmarks found');
    }
    return res.status(204).send();
  }),
  getBookmarkDetailsByPostId: catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const checkExist = await Post.findByPk(+postId);
    if (!checkExist) {
      throw helpers.createError(404, 'Not found post');
    }
    const bookmarkDetails = await Bookmark.findAll({
      where: {
        postId,
      },
    });
    return res.status(200).json({
      status: 'Success',
      value: BookmarkUtils.constructResponseForGettingBookmarkDetails(bookmarkDetails),
    });
  }),
  getBookmarkedPosts: catchAsync(async (req, res) => {
    const { userId } = req.params;
    const bookmarkedPosts = await Bookmark.findAll({
      raw: true,
      where: {
        userId: +userId,
      },
    });
    const resValues = _.map(bookmarkedPosts, (data) => {
      const { id, ...rest } = data;
      return {
        bookmarkId: id,
        ...rest,
      };
    });
    return res.status(200).json({
      status: '200: Ok',
      message: 'Handling get bookmarked post successfully',
      value: resValues,
    });
  }),
};
