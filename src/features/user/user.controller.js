const catchAsync = require('./../../utils/catchAsync');
const helper = require('./../../utils/helper');
const models = require('./../../models');
const _ = require('lodash');
const path = require('path');
const errorUtils = require('./../../utils/error');
const userConstants = require('./user.constants');
const stringUtils = require('./../../utils/string');
const { Op } = require('sequelize');
const dateUtils = require('./../../utils/date');

module.exports = {
  getAvatar: catchAsync(async (req, res) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(userId, {
      raw: true,
      attributes: {
        include: ['imgType', 'photoSource'],
      },
    });
    if (!user) {
      throw helper.createError(404, 'No users found');
    }
    if (!user.imgType && !user.photoSource) {
      return res
        .status(200)
        .sendFile(path.resolve(__dirname, 'src', 'public', 'images', 'avatar.png'));
    }
    return res.header('Content-Type', user.imgType).status(200).send(user.photoSource);
  }),

  updateUser: catchAsync(async (req, res, next) => {
    const UPDATE_TYPE = {
      avatar: 'file',
      coverImage: 'file',
      bio: 'text',
      firstName: 'text',
      lastName: 'text',
      phone: 'text',
      email: 'text',
      password: 'password',
      description: 'text',
      roleId: 'number',
    };
    const { userId } = req.params;
    let newInfo = {};
    for (const field in req.body) {
      const value = req.body[field];
      const updateType = UPDATE_TYPE[field];
      switch (updateType) {
        case 'password': {
          newInfo[field] = await helper.hashPassword(value);
          break;
        }
        case 'text': {
          newInfo[field] = value;
          break;
        }
        case 'number': {
          newInfo[field] = +value;
          break;
        }
        case 'file': {
          let imageImageInfo = {};
          const file = req.file;
          if (_.isNil(file)) {
            throw helper.createError(400, `The ${field} need to a upload file to continue`);
          }
          if (field === 'avatar') {
            imageImageInfo = {
              photoSource: file.buffer,
              profilePhotoUrl: `${process.env.BACKEND_URL}/users/avatar/${userId}`,
              imgType: file.mimetype,
            };
          }
          if (field === 'coverImage') {
            imageImageInfo = {
              coverImageSrc: file.buffer,
              coverImageUrl: `${process.env.BACKEND_URL}/users/coverImage/${userId}`,
              coverImageType: file.mimetype,
            };
          }
          newInfo = {
            ...newInfo,
            ...imageImageInfo,
          };
          break;
        }
        default: {
          throw errorUtils.createBadRequestError(`The ${field} is not a invalid property of user`);
        }
      }
    }
    const user = await models.user.findByPk(+userId);
    if (!user) {
      throw helper.createError(404, 'Not found users');
    }
    user.set(newInfo);
    await user.save();
    return res.status(200).json({
      status: 'Success',
      message: 'Update user successfully',
    });
  }),

  getProfileOfUser: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    let user = await models.user.findByPk(+userId, {
      attributes: {
        exclude: ['password', 'coverImageSrc', 'photoSource'],
      },
      include: [
        {
          model: models.post,
          attributes: {
            exclude: ['mediaSource'],
          },
          include: [
            {
              model: models.comment,
            },
            {
              model: models.reaction,
            },
            {
              model: models.bookmark,
            },
          ],
        },
        {
          model: models.rank,
          attributes: ['rankName', 'rankLogoUrl'],
        },
      ],
    });
    const { rank, ...rest } = user.toJSON();
    return res.status(200).json({
      status: 'Success',
      value: {
        ...rest,
        ...rank,
      },
    });
  }),

  getCoverImage: catchAsync(async (req, res) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(userId, {
      raw: true,
      attributes: {
        include: ['coverImageType', 'coverImageSrc'],
      },
    });
    if (!user) {
      throw helper.createError(404, 'No users found');
    }
    return res.header('Content-Type', user.coverImageType).status(200).send(user.coverImageSrc);
  }),

  getReactedPostOfUser: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(+userId);
    if (_.isNil(user)) {
      throw errorUtils.createNotFoundError(userConstants.ERROR_NOT_FOUND_USER);
    }
    const postReacted = await models.postReaction.findAll({
      where: {
        userId: +userId,
      },
      include: [
        {
          model: models.reaction,
          attributes: ['reactionType'],
        },
      ],
    });
    const responseValues = _.map(postReacted, (postReactedInstance) => {
      const { reaction, ...rest } = postReactedInstance.toJSON();
      return {
        postReactionId: rest.id,
        postId: rest.postId,
        reactionType: reaction.reactionType,
      };
    });
    return res.status(200).json({
      status: '200: OK',
      message: 'Get reacted post successfully',
      value: responseValues,
    });
  }),

  getBookmarkedPostOfUser: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(+userId);
    if (_.isNil(user)) {
      throw errorUtils.createNotFoundError(userConstants.ERROR_NOT_FOUND_USER);
    }
    const bookmarkedPosts = await models.post.findAll({
      attributes: {
        exclude: ['mediaSource', 'updatedAt'],
      },
      order: [['createdAt', 'desc']],
      include: [
        {
          model: models.bookmark,
          where: {
            userId: +userId,
          },
        },
        {
          model: models.user,
          attributes: ['id', 'firstName', 'lastName', 'profilePhotoUrl'],
        },
      ],
    });
    const resValues = _.map(bookmarkedPosts, (post) => {
      const { bookmarks, user, createdAt, ...rest } = post.toJSON();
      return {
        ...rest,
        createdAt: dateUtils.toLocaleString(createdAt),
        fullName: stringUtils.getFullName(user),
        profilePhotoUrl: user.profilePhotoUrl,
        bookmarkId: bookmarks[0].id,
        isBookmarked: true,
      };
    });
    return res.status(200).json({
      status: '200: OK',
      message: 'Get bookmarked post successfully',
      value: resValues,
    });
  }),

  getFollowingUsers: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(+userId);
    if (_.isNil(user)) {
      throw errorUtils.createNotFoundError(userConstants.ERROR_NOT_FOUND_USER);
    }
    const followingUsers = await models.follower.findAll({
      where: {
        userId: +userId,
      },
    });
    return res.status(200).json({
      status: '200: OK',
      message: 'Getting following users successfully',
      value: followingUsers,
    });
  }),

  getFollowers: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(+userId);
    if (_.isNil(user)) {
      throw errorUtils.createNotFoundError(userConstants.ERROR_NOT_FOUND_USER);
    }
    const [results] = await models.sequelize.query(
      `SELECT 
        u.id as "userId", 
        u."firstName", 
        u."lastName", 
        u."profilePhotoUrl", 
        r."rankName", 
        r."rankLogoUrl" 
      FROM 
        followers f 
      JOIN 
        users u 
      ON 
        u.id = f."userId" 
      JOIN
        ranks r
      ON u."rankId" = r.id 
      WHERE 
        f."followerId" = ${userId}`,
    );
    const responseValues = _.map(results, (data) => {
      const { firstName, lastName, ...rest } = data;
      return {
        ...rest,
        fullName: stringUtils.getFullName(data),
      };
    });
    return res.status(200).json({
      status: '200: OK',
      message: 'Getting followers successfully',
      value: responseValues,
    });
  }),

  getMyImages: catchAsync(async (req, res) => {
    const { userId } = req.params;
    const posts = await models.post.findAll({
      attributes: ['id', 'type', 'imageUrl', 'views', 'createdAt'],
      order: [
        ['views', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      where: {
        userId: +userId,
      },
      include: [
        {
          model: models.user,
          attributes: ['id', 'firstName', 'lastName', 'profilePhotoUrl'],
        },
        {
          model: models.tag,
        },
        {
          model: models.category,
        },
      ],
    });
    return res.status(200).json({
      status: '200: OK',
      message: 'Get my images successfully',
      value: posts,
    });
  }),

  searchUsers: catchAsync(async (req, res) => {
    const { name } = req.query;
    if (!name.trim()) {
      return res.status().json({
        status: '200',
        message: 'Handling search users successfully',
        value: [],
      });
    }
    const users = await models.user.findAll({
      attributes: ['id', 'firstName', 'lastName', 'profilePhotoUrl', 'description'],
      where: models.Sequelize.where(
        models.Sequelize.fn(
          'concat',
          models.Sequelize.col('firstName'),
          ' ',
          models.Sequelize.col('lastName'),
        ),
        Op.iLike,
        `%${name}%`,
      ),
      include: [
        {
          model: models.post,
          attributes: ['id'],
        },
      ],
    });
    const results = _.map(users, (ins) => {
      const { posts } = ins.toJSON();
      return {
        userId: ins.id,
        profilePhotoUrl: ins.profilePhotoUrl,
        fullName: ins.fullName,
        totalPost: posts.length,
        description: ins.description,
      };
    });
    return res.status(200).json({
      status: '200: OK',
      message: 'Handling search users successfully',
      value: results,
    });
  }),

  getFollowerCount: catchAsync(async (req, res) => {
    const userId = +req.params.userId;
    const user = await models.user.findByPk(userId);
    if (!user) {
      throw errorUtils.createNotFoundError(404, 'Not found user');
    }
    const followerCount = await models.follower.count({
      where: {
        followerId: userId,
      },
    });
    return res.status(200).json({
      status: '200: Ok',
      message: 'Handling get follower count successfully',
      value: {
        followerCount,
      },
    });
  }),

  getFollowings: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(+userId);
    if (_.isNil(user)) {
      throw errorUtils.createNotFoundError(userConstants.ERROR_NOT_FOUND_USER);
    }
    const [results] = await models.sequelize.query(
      `SELECT 
      u.id as "userId", 
      u."firstName", 
      u."lastName", 
      u."profilePhotoUrl", 
      r."rankName", 
      r."rankLogoUrl" 
    FROM 
      followers f 
    JOIN 
      users u 
    ON 
      u.id = f."userId" 
    JOIN
      ranks r
    ON u."rankId" = r.id 
    WHERE 
      f."userId" = ${userId}`,
    );
    const responseValues = _.map(results, (data) => {
      const { firstName, lastName, ...rest } = data;
      return {
        ...rest,
        fullName: stringUtils.getFullName(data),
      };
    });
    return res.status(200).json({
      status: '200: OK',
      message: 'Getting followers successfully',
      value: responseValues,
    });
  }),
};
