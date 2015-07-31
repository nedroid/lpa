'use strict';

angular.module('protocols').directive('protocol', [ 
  function() {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'modules/protocols/directives/views/protocol.client.directive.view.html'
    };
  }
]);