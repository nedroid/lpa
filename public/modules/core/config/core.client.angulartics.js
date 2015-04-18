'use strict';

angular.module('core').config(['$analyticsProvider',
	function ($analyticsProvider) {
  		// turn off automatic tracking
  		$analyticsProvider.virtualPageviews(false);
	}
]);