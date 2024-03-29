const { Op } = require('sequelize');
const catchAsync = require('../../utils/catchAsync');
const helper = require('../../utils/helper');
const models = require('./../../models');
const adminUtils = require('./admin.utils');
const errorUtils = require('../../utils/error');
const authConstants = require('./admin.constants');

module.exports = {
  checkIsAdmin: catchAsync(async (req, res, next) => {
    const { adminUserId } = req.query;
    let currentUser = await models.user.findByPk(+adminUserId, {
      include: [
        {
          model: models.role,
        },
      ],
    });
    if (!currentUser) {
      throw errorUtils.createNotFoundError(authConstants.ERROR_NOT_FOUND_USER);
    }
    currentUser = currentUser.toJSON();
    if (currentUser.role.roleName !== authConstants.ADMIN_ROLE) {
      throw errorUtils.createForbiddenError(authConstants.ERROR_NOT_ALLOW);
    }
    return next();
  }),
  getAllUsers: catchAsync(async (req, res, next) => {
    const { adminUserId } = req.query;
    const allUsers = await models.user.findAll({
      where: {
        id: {
          [Op.ne]: +adminUserId,
        },
      },
      attributes: {
        exclude: ['password', 'photoSource', 'imgType'],
      },
      order: [['id', 'DESC']],
      include: [
        {
          model: models.role,
        },
        {
          model: models.post,
        },
        {
          model: models.rank,
          attributes: ['rankName', 'rankLogoUrl']
        },
      ],
    });
    return res.status(200).json({
      status: 'OK',
      message: 'Handle request successfully',
      value: adminUtils.buildAllUsersResponse(allUsers),
    });
  }),
  deleteUser: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const count = await models.user.destroy({
      where: {
        id: +userId,
      },
    });
    if (!count) {
      throw errorUtils.createNotFoundError(authConstants.ERROR_NOT_FOUND_USER);
    }
    return res.status(204).send();
  }),
  getAllRoles: catchAsync(async (req, res, next) => {
    const allRoles = await models.role.findAll({
      include: [
        {
          model: models.user,
          attributes: ['id', 'firstName', 'lastName', 'fullName', 'profilePhotoUrl', 'rankId'],
        },
      ],
    });
    return res.status(200).json({
      status: 'Success',
      value: adminUtils.buildAllRolesResponse(allRoles),
    });
  }),
  createNewUser: catchAsync(async (req, res, next) => {
    const { username, password, firstName, lastName, roleId } = req.body;
    const [checkExist, checkRole] = await Promise.all([
      models.user.findAll({
        where: {
          username: {
            [Op.iLike]: username,
          },
        },
      }),
      models.role.findByPk(+roleId),
    ]);
    if (checkExist && checkExist.length) {
      throw errorUtils.createBadRequestError(authConstants.ERROR_USER_WAS_EXISTED);
    }
    if (!checkRole) {
      throw errorUtils.createForbiddenError(authConstants.ERROR_ROLE_NOT_FOUND);
    }
    await models.user.create({
      username,
      password,
      firstName,
      lastName,
      roleId,
    });
    return res.status(201).json({
      status: 'Success',
      message: 'Create user successfully',
    });
  }),
  getAllReactions: catchAsync(async (req, res, next) => {
    const reactions = await models.reaction.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: models.postReaction,
        },
      ],
    });
    return res.status(200).json({
      status: 'Success',
      value: adminUtils.buildAllReactionResponse(reactions),
    });
  }),
  getAllCategories: catchAsync(async (req, res, next) => {
    const categories = await models.category.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: models.postCategory,
        },
      ],
    });
    return res.status(200).json({
      status: 'Success',
      value: adminUtils.buildAllCategoriesResponse(categories),
    });
  }),
  getAllHashTags: catchAsync(async (req, res, next) => {
    const hashtags = await models.tag.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: models.postTag,
        },
      ],
    });
    return res.status(200).json({
      status: 'Success',
      value: adminUtils.buildAllHashTagsResponse(hashtags),
    });
  }),
  getAllRolesForManagement: catchAsync(async (req, res, next) => {
    const roles = await models.role.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: models.user,
        },
      ],
    });
    return res.status(200).json({
      status: 'Success',
      value: adminUtils.buildAllRolesResponse(roles),
    });
  }),
  createNewTag: catchAsync(async (req, res, next) => {
    const { tagName } = req.body;
    const checkTag = await models.tag.findAll({
      raw: true,
      where: {
        tagName: {
          [Op.iLike]: tagName,
        },
      },
    });
    if (checkTag && checkTag.length) {
      throw helper.createError(400, 'The hashtag was exist');
    }
    await models.tag.create({
      tagName,
    });
    return res.status(201).json({
      status: 'Success',
      message: 'Create successfully',
    });
  }),
  deleteTag: catchAsync(async (req, res, next) => {
    const { tagId } = req.params;
    const tag = await models.tag.findByPk(+tagId);
    if (!tag) {
      throw helper.createError(404, 'Not found tag');
    }
    await tag.destroy();
    return res.status(204).send();
  }),
};
