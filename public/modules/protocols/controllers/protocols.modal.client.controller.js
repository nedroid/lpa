'use strict';

angular.module('protocols').controller('ProtocolsModalController', function($scope, $uibModalInstance, protocol) {

  $scope.protocol = protocol;
  
  $scope.save = function () {
    if($scope.protocol && $scope.protocol.title && $scope.protocol.title.length > 3) {
      $uibModalInstance.close($scope.protocol);
    } else {
      $scope.error = 'PROTOCOL_TITLE_ERR';
    }
    
  };

  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };

});