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
      controller: ['$scope', '$stateParams', '$location', 'Graph', 'Protocols', 'Messenger', 
        function($scope, $stateParams, $location, Graph, Protocols, Messenger) {
        
          $scope.graph = new Graph.instance();

          $scope.save = function() {
            var protocol = new Protocols({
              title: 'TESTTT',
              processes: {},
              finalstatemachines: [],
            });

            Graph.instances.forEach(function(instance) {
              var graph = instance.data();
              if (graph.type === Graph.TYPE.PROCESSES) {
                protocol.processes = graph;
              } else {
                protocol.finalstatemachines.push(graph);  
              }
            });
            protocol.$save(function(response) {
              $location.path('protocols/' + response._id);
            }, function(errorResponse) {
              Messenger.post(errorResponse.data.message, 'error');
            });
          };
        }
      ],
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