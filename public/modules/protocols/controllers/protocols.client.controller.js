'use strict';

angular.module('protocols').controller('ProtocolsController', ['$scope', '$stateParams', '$location', '$timeout', '$filter', '$modal', 'Protocols', 'Graph', 'Actions', 'Messenger', '$analytics',
  function($scope, $stateParams, $location, $timeout, $filter, $modal, Protocols, Graph, Actions, Messenger, $analytics) {

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
    
    $scope.openSettings = function() {

      var modalInstance = $modal.open({
        templateUrl: 'modules/protocols/views/modals/create-protocol.client.modal.html',
        controller: 'ProtocolsModalController',
        resolve: {
          protocol: function () {
            return $scope.protocol;
          }
        }
      });
      
      modalInstance.result.then(function (protocol) {
        $scope.protocol = protocol;
      }, function () {
        if(!$scope.protocol || !$scope.protocol.title) {
          Messenger.post('NO_PROTOCOL_TITLE', 'error');
        }
      });

    };

    $scope.saveProtocol = function() {

      if(!$scope.protocol || !$scope.protocol.title) {
        Messenger.post('NO_PROTOCOL_TITLE', 'error');
        return;
      }

      var protocol = new Protocols({
        title: $scope.protocol.title,
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

    $scope.exportSvg = function($event) {
      var 
      url,
      svg = angular.element.find('svg:visible')[0],
      source = new XMLSerializer().serializeToString(svg);

      if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
      
      url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

      angular.element($event.target).attr('href', url);
    };
    
    $scope.print = function() {
      window.print();
    };

    $scope.create = function() {
      
      $scope.openSettings();

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
        title: $filter('translate')('PROCESS_LIST'),
      });

      $analytics.eventTrack('lpa.protocols.create', { category: 'protocols', label: 'Create' });
    };

    $scope.view = function() {
      $scope.protocol = Protocols.get({
        protocolId: $stateParams.protocolId
      });
      $analytics.eventTrack('lpa.protocols.view', { category: 'protocols', label: 'View' });
    };

    $scope.edit = function() {
      
      Graph.destroy();

      Protocols.get({
        protocolId: $stateParams.protocolId
      }, function(protocol) {
        $scope.protocol = protocol;
        $scope.graphs = protocol.finalstatemachines || [];
        $scope.graphs.unshift(protocol.processes);
        $timeout(function() {
          $scope.graphs = Graph.instances;  
        }, 0);
      });
      
      angular.forEach(Graph.LINK_TYPE, function(value, key) {
        if(key !== 'UNKNOWN') {
          this.push({
           id: key,
           text: value 
          });
        }
      }, $scope.linkTypes = []);

      $analytics.eventTrack('lpa.protocols.edit', { category: 'protocols', label: 'Edit' });
    };

    $scope.list = function() {
      $scope.protocols = Protocols.query();
      $analytics.eventTrack('lpa.protocols.list', { category: 'protocols', label: 'List' });
    };

    $scope.analyze = function(protocol) {
      $scope.alerts = [];
      
      if (!protocol) {
        $scope.alerts.push({ 
          type: 'danger', 
          msg: 'No protocol defined.' 
        });
      } else if (!protocol.title) {
        $scope.alerts.push({ 
          type: 'danger', 
          msg: 'No protocol title defined.' 
        });
      } else if (!protocol.processes || !protocol.finalstatemachines ){
        protocol.processes = {};
        protocol.finalstatemachines = [];

        Graph.instances.forEach(function(instance) {
          var graph = instance.data();
          if (graph.type === Graph.TYPE.PROCESSES) {
            protocol.processes = graph;
          } else {
            protocol.finalstatemachines.push(graph);  
          }
        });
      }
      $scope.p = protocol;

      $scope.startAnalyze = ($scope.startAnalyze && ++$scope.startAnalyze) || 1;
    };

  }
]);