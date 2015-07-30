'use strict';

var ApplicationConfiguration = (function() {

	var 
	applicationModuleName = 'lpa',
	applicationModuleVendorDependencies = [
		'ngResource', 
		'ngAnimate', 
		'ngSanitize', 
		'ui.router', 
		'ui.bootstrap', 
		'ui.utils',
		'pascalprecht.translate',
		'ui.select',
		'angulartics',
		'angulartics.google.analytics'
	],

	registerModule = function(moduleName, dependencies) {

		angular.module(moduleName, dependencies || []);

		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
	
})();