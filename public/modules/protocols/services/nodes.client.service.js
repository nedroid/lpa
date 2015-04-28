'use strict';

angular.module('protocols').factory('Nodes', ['$resource',
	function($resource) {
		return $resource('nodes/:nodeId', {
			nodeId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);