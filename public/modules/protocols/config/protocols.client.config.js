'use strict';

angular.module('protocols').run(['Menus',
  function(Menus) {
    Menus.addMenuItem('topbar', 'PROTOCOLS_LIST', 'protocols', 'listProtocols');
    Menus.addMenuItem('topbar', 'PROTOCOLS_NEW', 'protocols/create', 'createProtocol', false);
  }
]);