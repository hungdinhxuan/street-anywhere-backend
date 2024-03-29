'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class post extends Model {
    static associate(models) {
      this.belongsTo(models.user);
      this.belongsToMany(models.tag, {
        through: models.postTag,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.belongsToMany(models.category, {
        through: models.postCategory,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.comment, { onUpdate: 'CASCADE', onDelete: 'CASCADE' });
      this.belongsToMany(models.reaction, {
        through: models.postReaction,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.bookmark, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    }
  }
  post.init(
    {
      title: DataTypes.STRING,
      location: DataTypes.STRING,
      longitude: DataTypes.STRING,
      latitude: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      type: DataTypes.STRING,
      size: DataTypes.FLOAT,
      mediaSource: DataTypes.BLOB,
      shortTitle: DataTypes.STRING,
      description: DataTypes.STRING,
      videoYtbUrl: DataTypes.STRING,
      views: DataTypes.INTEGER,
      imageUrl: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'post',
    },
  );
  return post;
};
