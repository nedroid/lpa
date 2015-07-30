'use strict';

module.exports = {
	app: {
		title: 'LPA - Logical Protocol Analyzer',
		description: 'Logical Protocol Analyzer',
		keywords: 'protocol, analyzer, pgss, test, fsm, final state machines'
	},
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	// The secret should be set to a non-guessable string that
	// is used to compute a session hash
	sessionSecret: 'MEAN',
	// The name of the MongoDB collection to store sessions in
	sessionCollection: 'sessions',
	// The session cookie settings
	sessionCookie: {
		path: '/',
		httpOnly: true,
		// If secure is set to true then it will cause the cookie to be set
		// only when SSL-enabled (HTTPS) is used, and otherwise it won't
		// set a cookie. 'true' is recommended yet it requires the above
		// mentioned pre-requisite.
		secure: false,
		// Only set the maxAge to null if the cookie shouldn't be expired
		// at all. The cookie will expunge when the browser is closed.
		maxAge: null,
		// To set the cookie in a specific domain uncomment the following
		// setting:
		// domain: 'yourdomain.com'
	},
	// The session cookie name
	sessionName: 'connect.sid',
	log: {
		// Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
		format: 'combined',
		// Stream defaults to process.stdout
		// Uncomment to enable logging to a log on the file system
		options: {
			stream: 'access.log'
		}
	},
	assets: {
		lib: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.css',
				//'public/lib/bootstrap/dist/css/bootstrap-theme.css',
				'public/lib/fontawesome/css/font-awesome.min.css',
				'public/lib/angular-ui-select/dist/select.min.css',
				'public/lib/messenger/build/css/messenger.css',
				'public/lib/messenger/build/css/messenger-theme-future.css'
			],
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/angular/angular.js',
				'public/lib/angular-resource/angular-resource.js',
				'public/lib/angular-animate/angular-animate.js',
				'public/lib/angular-sanitize/angular-sanitize.min.js',
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				//
				'public/lib/angular-ui-scroll/dist/ui-scroll.min.js',
				'public/lib/angular-ui-scrollpoint/dist/scrollpoint.min.js',
				'public/lib/angular-ui-event/dist/event.min.js',
				'public/lib/angular-ui-mask/dist/mask.min.js',
				'public/lib/angular-ui-validate/dist/validate.min.js',
				'public/lib/angular-ui-indeterminate/dist/indeterminate.min.js',
				'public/lib/angular-ui-uploader/dist/uploader.min.js',
				'public/lib/angular-ui-utils/index.js',
				//'public/lib/angular-ui-utils/ui-utils.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/angular-translate/angular-translate.min.js',
				'public/lib/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
				'public/lib/angular-ui-select/dist/select.min.js',
				'public/lib/angulartics/dist/angulartics.min.js',
				'public/lib/angulartics/dist/angulartics-ga.min.js',
				'public/lib/d3/d3.min.js',
				'public/lib/messenger/build/js/messenger.min.js',
				'public/lib/messenger/build/js/messenger-theme-future.js'
			]
		},
		css: [
			'public/modules/**/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/*/*.js',
			'public/modules/*/*[!tests]*/*.js'
		],
		tests: [
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/*/tests/*.js'
		]
	}
};
