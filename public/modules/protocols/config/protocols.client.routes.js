'use strict';

angular.module('protocols').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.
    state('listProtocols', {
      url: '/protocols',
      templateUrl: 'modules/protocols/views/list-protocols.client.view.html'
    }).
    state('createProtocol', {
      url: '/protocols/create',
      templateUrl: 'modules/protocols/views/create-protocol.client.view.html'
    }).
    state('viewProtocol', {
      url: '/protocols/:protocolId',
      templateUrl: 'modules/protocols/views/view-protocol.client.view.html'
    }).
    state('forkProtocol', {
      url: '/protocols/:protocolId/fork',
      templateUrl: 'modules/protocols/views/edit-protocol.client.view.html'
    });
  }
]);