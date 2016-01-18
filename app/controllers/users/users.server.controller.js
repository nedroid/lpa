'use strict';

var _ = require('lodash'),
  errorHandler = require('../errors.server.controller'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  async = require('async'),
  User = mongoose.model('User');

exports.create = function(req, res) {

  delete req.body.roles;

  var user = new User(req.body);
  var message = null;

  user.provider = 'local';
  user.displayName = user.firstName + ' ' + user.lastName;
  user.password = user.username;

  user.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      user.password = undefined;
      user.salt = undefined;
      res.json(user);
    }
  });
};

exports.read = function(req, res) {
  res.json(req.lpaUser);
};

exports.list = function(req, res) {
  User
    .find()
    .where('deleted').equals(false)
    .where('provider').ne('google')
    .select('displayName username')
    .sort('displayName')
    .exec(function(err, users) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(users);
      }
    });
};

exports.updateByAdmin = function(req, res) {
  async.waterfall([

    function (callback) {
      User.findById(req.lpaUser.id).exec(callback);
    },

    function (user, callback) {
      user = _.extend(user, {
        roles: req.body.roles || ['user']
      });
      user.save(callback);
    }

  ], function(err, user) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      user.password = undefined;
      user.salt = undefined;
      res.json(user);
    }
  });

};

exports.delete = function(req, res) {
  var user = req.lpaUser;
  if (req.user.id === req.lpaUser.id) {
    return res.status(400).send({
      message: 'You can not delete yourself!'
    });
  } else {
    user.deleted = true;
    user.save(function(err, user) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        user.password = undefined;
        user.salt = undefined;
        res.json(user);
      }
    });
  }
};

exports.lpaUserByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id)
    .where('deleted').equals(false)
    .select('displayName username roles')
    .exec(function(err, user) {
      if (err) return next(err);
      if (!user) {
        return res.status(404).send({
          message: 'User not found'
        });
      }
      req.lpaUser = user;
      next();
    });
};

