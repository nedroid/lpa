'use strict';

angular.module('protocols').directive('graph', [
  
  function() {
    return {
      restrict: 'EA',
      scope: {
        graphData: '=graphData'
      },
      templateUrl: 'modules/protocols/directives/views/graph.client.directive.view.html',
      controller: ['$scope', '$stateParams', '$location', 'Graph', 'Protocols', function($scope, $stateParams, $location, Graph, Protocols) {
        
        $scope.graph = new Graph.instance();

        $scope.save = function() {
          var protocol = new Protocols({
            title: 'TESTTT',
            processes: {},
            finalstatemachines: [],
          });

          Graph.instances.forEach(function(graph) {
            protocol.finalstatemachines.push(graph.data());
          });
          
          protocol.$save(function(response) {
            $location.path('protocols/' + response._id);
          }, function(errorResponse) {
            Messenger.post(errorResponse.data.message, 'error');
          });
        };

      }],
      link: function($scope, elm, attrs) {
        $scope.graph.init(elm[0].querySelector('.graph-content'), $scope.graphData);
      }
    };
  }
]);