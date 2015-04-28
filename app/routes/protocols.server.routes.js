'use strict';

var users = require('../../app/controllers/users.server.controller'),
  protocols = require('../../app/controllers/protocols.server.controller');

module.exports = function(app) {
  
  app.route('/protocols')
    .get(protocols.list)
    .post(users.requiresLogin, protocols.create);

  app.route('/protocols/:protocolId')
    .get(protocols.read)
    .put(users.requiresLogin, protocols.hasAuthorization, protocols.update)
    .delete(users.requiresLogin, protocols.hasAuthorization, protocols.delete);

  app.param('protocolId', protocols.protocolByID);
};
