'use strict';

angular.module('core').directive('lpaTitle', [

	function() {
		return {
			restrict: 'E',
			transclude : true,
			scope: {
				code: '@',
			},
			templateUrl: 'modules/core/directives/views/title.client.view.html'
		};
	}

]);