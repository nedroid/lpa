'use strict';

angular.module('protocols').factory('Links', ['$resource',
	function($resource) {
		return $resource('links/:linkId', {
			linkId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);