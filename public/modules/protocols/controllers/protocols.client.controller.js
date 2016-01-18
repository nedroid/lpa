'use strict';

angular.module('protocols').controller('ProtocolsController', ['$scope', '$stateParams', '$location', '$timeout', '$filter', '$modal', 'Authentication', 'Protocols', 'Graph', 'Actions', 'Messenger', '$analytics',
  function($scope, $stateParams, $location, $timeout, $filter, $modal, Authentication, Protocols, Graph, Actions, Messenger, $analytics) {

    $scope.authentication = Authentication;

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
    
    $scope.import = function(fileInput) {   
      var 
      file = fileInput.files && fileInput.files.length > 0 && fileInput.files[0],
      callback = function(protocol) {
        var errors = 0;
        
        if (protocol.finalstatemachines === undefined) {
          Messenger.post('IMPORT_ERR_FSM', 'error');
          errors += 1;
        }

        if (protocol.processes === undefined) {
          Messenger.post('IMPORT_ERR_PROCESSES', 'error');
          errors += 1;
        }

        if (errors > 0) {
          return false;
        }
        $scope.graphs = [];
        Graph.destroy();
        $scope.$apply();

        $scope.protocol = protocol;
        $scope.graphs = protocol.finalstatemachines || [];
        $scope.graphs.unshift(protocol.processes);

        $scope.$apply();

        $timeout(function() {
          $scope.graphs = Graph.instances;  
        }, 0);

        return true;
      };

      if (file && file.type === 'application/json') {
        Messenger.post('IMPORT_FILE_SUCCESS', 'success', file.name);
        var readFile = new FileReader();
        readFile.onload = function(e) { 
          try {
            if (callback(JSON.parse(e.target.result))) {
              Messenger.post('IMPORT_FILE_PARSE_SUCCESS', 'success', file.name);
            }
          } catch (error) {
            Messenger.post('IMPORT_FILE_PARSE_ERROR', 'error', error.toLocaleString());
          }
        };
        readFile.readAsText(file);
      } else {
        Messenger.post('IMPORT_FILE_ERROR', 'error', file && file.name);
      }

      angular.element(fileInput).val('');
    };

    $scope.export = function($event) {
      var protocol = {
        title: $scope.protocol.title,
        processes: {},
        finalstatemachines: [],
      };

      Graph.instances.forEach(function(instance) {
        var graph = instance.data();
        if (graph.type === Graph.TYPE.PROCESSES) {
          protocol.processes = graph;
        } else {
          protocol.finalstatemachines.push(graph);  
        }
      });

      angular.element($event.target)
        .attr('download', protocol.title + '.json')
        .attr('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(protocol)));
    };

    $scope.exportSvg = function($event) {
      var url, source,
      svg = angular.element.find('svg:visible');

      svg = angular.element(svg).clone();

      // za analizo
      if(angular.element(svg).find('rect.overlay').remove().length > 0) {
        var minX = 0, maxX = 0, maxY = 0;
        angular.element(svg).find('g.node').each(function (i, node) { 
          var tmp = angular.element(node).attr('transform').split(/[^\-0-9.]{1,}/);
          tmp[1] = parseFloat(tmp[1]);
          tmp[2] = parseFloat(tmp[2]);
          if (tmp[1] < minX) {
            minX = tmp[1];
          }
          if (tmp[1] > maxX) {
            maxX = tmp[1];
          }
          if (tmp[2] > maxY) {
            maxY = tmp[2];
          }
        });
        angular.element(svg)
          .attr('width', maxX - minX + 300)
          .attr('height', maxY + 200)
          .children('g')
          .attr('transform', 'translate(' + (minX * -1 + 150) + ', 50)')
          .children('g')
          .attr('transform', '');
      }

      source = new XMLSerializer().serializeToString(svg[0]);

      if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
      
      url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

      angular.element($event.target)
        .attr('download', $scope.protocol.title + '.svg')
        .attr('href', url);
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

    $scope.delete = function(protocolId) {
      $scope.protocol = Protocols.delete({
        protocolId: protocolId || $stateParams.protocolId
      }, function (protocol) {
        var index;
        $scope.protocols.forEach(function (protocol_, index_) {
          if (protocol._id === protocol_._id) {
            index = index_;
          }
        });
        $scope.protocols.splice(index, 1);
      }, function (error) {
        Messenger.post(error.data.message, 'error');
      });
      $analytics.eventTrack('lpa.protocols.view', { category: 'protocols', label: 'Delete' });
    };

    $scope.view = function() {
      Graph.destroy();

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