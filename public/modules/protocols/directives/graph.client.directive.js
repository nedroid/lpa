'use strict';

angular.module('protocols').directive('graph', [
  
  function() {
    return {
      restrict: 'EA',
      scope: {
        graphData: '=',
        edit: '='
      },
      templateUrl: 'modules/protocols/directives/views/graph.client.directive.view.html',
      controller: ['$scope', 'Graph', function($scope, Graph) {
        
        $scope.graph = new Graph.instance();

        $scope.nodeType = Graph.NODE_TYPE[$scope.graphData.type];

      }],
      link: function($scope, elm, attrs) {
        if($scope.graphData && $scope.graphData.$promise) {
          $scope.graphData.$promise.then(function(graphData) {
            if(graphData) {
              $scope.graph.init(elm[0].querySelector('.graph-content'), graphData.processes);
            }
          });  
        } else {
          $scope.graph.init(elm[0].querySelector('.graph-content'), $scope.graphData);
        }
      }
    };
  }
]);