'use strict';

angular.module('protocols').factory('Protocols', ['$resource',
  function($resource) {
    return $resource('protocols/:protocolId', {
      protocolId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);