const models = require('./../../models');
const catchAsync = require('./../../utils/catchAsync');
const helper = require('./../../utils/helper');
const _ = require('lodash');
const { Op } = require('sequelize');

module.exports = {
  addFollower: catchAsync(async (req, res, next) => {
    const { userId, followerId } = req.body;
    const [user, follower] = await Promise.all([models.user.findByPk(+userId), models.user.findByPk(+followerId)]);
    if (_.isNil(user)) {
      throw helper.createError(404, 'Not found user');
    }
    if (_.isNil(follower)) {
      throw helper.createError(404, 'Not found follower');
    }
    await models.follower.create({
      userId: +userId,
      followerId: +followerId,
    });
    return res.status(201).json({
      status: 'Success',
      message: 'Follow user successfully',
    });
  }),
  deleteFollower: catchAsync(async (req, res, next) => {
    const { userId, followerId } = req.body;
    const [user, follower] = await Promise.all([models.user.findByPk(+userId), models.user.findByPk(+followerId)]);
    if (_.isNil(user)) {
      throw helper.createError(404, 'Not found user');
    }
    if (_.isNil(follower)) {
      throw helper.createError(404, 'Not found follower');
    }
    const count = await models.follower.destroy({
      where: {
        userId: +userId,
        followerId: +followerId,
      },
    });
    if (!count) {
      throw helper.createError(400, 'Delete failed. Please check userId, followerId again!');
    }
    return res.status(204).send();
  }),
  getFollowerByUserId: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await models.user.findByPk(+userId);
    if (_.isNil(user)) {
      throw helper.createError(404, 'Not found user');
    }
    const followers = await models.follower.findAll({
      where: {
        followerId: +userId,
      },
    });
    return res.status(200).send({
      status: 'Success',
      value: followers,
    });
  }),
};