'use strict';

angular.module('protocols').factory('StateMachines', ['$resource',
	function($resource) {
		return $resource('fsms/:fsmId', {
			fsmId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);