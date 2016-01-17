'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	User = require('mongoose').model('User');

module.exports = function() {
	// Use local strategy
	passport.use(new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password'
		},
		function(username, password, done) {
			User.findOne({
				username: username,
				deleted: false
			}, function(err, user) {
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false, {
						message: 'UNKOWN_USER_OR_INVALID_PWD'
					});
				}
				if (!user.authenticate(password)) {
					return done(null, false, {
						message: 'UNKOWN_USER_OR_INVALID_PWD'
					});
				}

				return done(null, user);
			});
		}
	));
};
