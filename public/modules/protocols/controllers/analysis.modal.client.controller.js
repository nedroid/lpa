'use strict';

angular.module('protocols').controller('AnalysisModalController', ['$scope', '$filter', '$uibModalInstance', 'protocol', 'graphs',

  function($scope, $filter, $uibModalInstance, protocol, graphs) {

    $scope.protocol = protocol || {};
    $scope.protocol.isPriority = false;
    $scope.processes = $filter('graphProcesses')(graphs);
    $scope.processes = $scope.processes || $filter('processes')($scope.protocol.processes.nodes);

    $scope.analyze = function () {
      $scope.protocol.priorityProcesses = $scope.processes;
      $uibModalInstance.close($scope.protocol);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

  }

]);