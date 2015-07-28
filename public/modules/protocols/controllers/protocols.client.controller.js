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
      if($scope.nodeSettings.node && $scope.nodeSettings.node.rebuild) {
        $scope.nodeSettings.node.rebuild();
      }
    }, true);

    $scope.$watch(function() {
      return Actions.linkSettings;
    }, function() {
      $scope.linkSettings = Actions.linkSettings;
      if($scope.linkSettings.link && $scope.linkSettings.link.rebuild) {
        $scope.linkSettings.link.rebuild();
      }
    }, true);
    
    $scope.create = function() {
      Graph.destroy();
      $scope.graphs = Graph.instances;

      angular.forEach(Graph.LINK_TYPE, function(value, key) {
        if(key !== 'UNKNOWN') {
          this.push({
           id: key,
           text: value 
          });
        }
      }, $scope.linkTypes = []);

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

    $scope.analyze = function(protocol) {
      $scope.alerts = [];

      $scope.alerts.push({ 
        type: 'danger', 
        msg: 'Not implement yet!' 
      });

      if(protocol) {
        $scope.alerts.push({ 
          type: 'success', 
          msg: 'Protocol: ' + protocol.title 
        });
      } else {
        $scope.alerts.push({ 
          type: 'warning', 
          msg: 'No protocol defined.' 
        });
      }

    };

  }
]);