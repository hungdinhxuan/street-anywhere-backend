const { body, param, query } = require('express-validator');

module.exports = {
  validateNewCommentPayload: () => [
    body('postId')
      .exists()
      .withMessage('Please provide the post id you wanna comment')
      .trim()
      .notEmpty()
      .withMessage('The post id is not empty')
      .isInt()
      .withMessage('Invalid post id. It should be a integer'),
    body('userId')
      .exists()
      .withMessage('Please provide the user id')
      .trim()
      .notEmpty()
      .withMessage('The user id is not empty')
      .isInt()
      .withMessage('Invalid user id. It should be a integer'),
    body('content')
      .exists()
      .withMessage('Please provide the content of comment')
      .trim()
      .notEmpty()
      .withMessage('The comment is not empty')
      .isLength({ max: 300 })
      .withMessage('The content of comment can not be more than 300 characters'),
  ],
  validatePostId: () => [param('postId').isInt().withMessage('Please provide a valid post id. It should be a integer')],
  validateCommentId: () => [
    param('commentId').isInt().withMessage('Please provide a valid comment id. It should be a integer'),
  ],
  validateContent: () => [
    body('content')
      .exists()
      .withMessage('Please provide your content of comment to continue')
      .trim()
      .notEmpty()
      .withMessage('The comment does not empty')
      .isLength({ max: 300 })
      .withMessage('The comment can not be more than 300 characters'),
  ],
  validatePageNumber: () => [
    query('page')
      .optional()
      .isInt()
      .withMessage('The page is invalid')
      .isLength({ min: 1 })
      .withMessage('The page should be greater than or equal 1'),
  ],
};
