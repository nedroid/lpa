'use strict';

angular.module('protocols').controller('ProtocolsController', ['$scope', '$stateParams', 'Protocols', 'Graph', 'Actions', '$analytics',
  function($scope, $stateParams, Protocols, Graph, Actions, $analytics) {

    $scope.selected = {
      index: 0
    };

    $scope.actions = Actions;
    
    $scope.$watch(function() {
      return Actions.nodeSettings;
    }, function() {
      $scope.nodeSettings = Actions.nodeSettings;
    }, true);

    $scope.$watch(function() {
      return Actions.linkSettings;
    }, function() {
      $scope.linkSettings = Actions.linkSettings;
    }, true);

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