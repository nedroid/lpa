'use strict';

angular.module('protocols').controller('ProtocolsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Messenger', 'Protocols', 'Graph', '$analytics',
  function($scope, $stateParams, $location, Authentication, Messenger, Protocols, Graph, $analytics) {
    $scope.authentication = Authentication;

    $scope.selected = {
      index: 0
    };

    $scope.create = function() {
      Graph.destroy();
      $scope.graphs = Graph.instances;
      Graph.empty({
        type: Graph.TYPE.PROCESSES,
        title: 'Protokol title'
      });
      $analytics.eventTrack('lpa.protocols.create', { category: 'protocols', label: 'Create' });
    };

    $scope.view = function() {
      $scope.protocol = Protocols.get({
        protocolId: $stateParams.protocolId
      });
      $analytics.eventTrack('lpa.protocols.view', { category: 'protocols', label: 'View' });
    };

    $scope.list = function() {
      $scope.protocols = Protocols.query();
      $analytics.eventTrack('lpa.protocols.list', { category: 'protocols', label: 'List' });
    };

  }
]);