'use strict';

angular.module('core').config(['$translateProvider', function($translateProvider) {
	$translateProvider.useStaticFilesLoader({
		prefix: 'i18n/locale-',
		suffix: '.json'
	});
	$translateProvider.preferredLanguage('si_SL');
}]);
