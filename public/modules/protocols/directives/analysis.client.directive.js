'use strict';

angular.module('protocols').directive('analysis', function() {
  return {
    restrict: 'E',
    scope: {
      protocol: '=',
      analyze: '='
    },
    templateUrl: 'modules/protocols/directives/views/analysis.client.directive.view.html',
    controller: ['$scope', 'Analysis', function($scope, Analysis) {
      
      $scope.analysis = Analysis;

      $scope.$watch(function() {
        return $scope.analyze;
      }, function(analyze) {
        if(analyze) {
          $scope.analysis.drawTree($scope.protocol);
        }
      });
      
    }],
    link: function($scope, elm, attrs) {
      $scope.analysis.init(elm[0].querySelector('.tree-content'));
    }
  };
});