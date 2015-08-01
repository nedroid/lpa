'use strict';

var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  async = require('async'),
  ProtocolModel = mongoose.model('Protocol'),
  NodeModel = mongoose.model('Node'),
  LinkModel = mongoose.model('Link'),
  GraphModel = mongoose.model('Graph'),
  _ = require('lodash');

exports.create = function(req, res) {

  var protocol_ = req.body,
    graphsSaveFunctions = [];
  
  graphsSaveFunctions.push(function(callback) {
    async.waterfall([

      function(callback_) {
        var nodes = [];
        protocol_.processes.nodes = protocol_.processes.nodes || [];
        protocol_.processes.nodes.forEach(function(node) {
          node.user = req.user;
          nodes.push(node);
        });
        NodeModel.create(nodes, function(err) {
          nodes = [];
          for (var i = 1; i < arguments.length; ++i) {
            nodes.push(arguments[i]);
          }
          callback_(err, nodes);
        });
      },

      function(nodes, callback_) {
        var 
        links = [],
        isTarget = false,
        isSource = false;

        protocol_.processes.links = protocol_.processes.links || [];
        protocol_.processes.links.forEach(function(link) {
          isTarget = false;
          isSource = false;
          nodes.forEach(function(node) {
            if (link.source.nodeId === node.nodeId) {
              link.source = node;
              isSource = true;  
            }
            if (link.target.nodeId === node.nodeId) {
              link.target = node;
              isTarget = true;
            } 
          });
          if(isSource && isTarget) {
            link.user = req.user;
            if(link.queue){
              link.queueInLength = link.queue.in && link.queue.in.length;
              link.queueOutLength = link.queue.out && link.queue.out.length;  
            }
            links.push(link);
          } else {
            callback_(new Error('Link do not have source or target node from node list'));
          } 
        });
        LinkModel.create(links, function(err) {
          links = [];
          for (var i = 1; i < arguments.length; ++i) {
            links.push(arguments[i]);
          }
          callback_(err, nodes, links);
        });
      },

      function(nodes, links, callback_) {
        new GraphModel({
          title: protocol_.processes.title || 'protocol_.processes.title',
          type: protocol_.processes.type || 'protocol_.processes.type',
          links: links,
          nodes: nodes,
          user: req.user
        }).save(callback_);
      }

    ], callback);
  });

  protocol_.finalstatemachines = protocol_.finalstatemachines || [];
  protocol_.finalstatemachines.forEach(function(fsm) {

    graphsSaveFunctions.push(function(callback) {
    
      async.waterfall([

        function(callback_) {
          var nodes = [];
          fsm.nodes = fsm.nodes || [];
          fsm.nodes.forEach(function(node) {
            node.user = req.user;
            nodes.push(node);
          });
          NodeModel.create(nodes, function(err) {
            nodes = [];
            for (var i = 1; i < arguments.length; ++i) {
              nodes.push(arguments[i]);
            }
            callback_(err, nodes);
          });
        },

        function(nodes, callback_) {
          var 
          links = [],
          isTarget = false,
          isSource = false;

          fsm.links = fsm.links || [];
          fsm.links.forEach(function(link) {
            isTarget = false;
            isSource = false;
            nodes.forEach(function(node) {
              if (link.source.nodeId === node.nodeId) {
                link.source = node;
                isSource = true;  
              }
              if (link.target.nodeId === node.nodeId) {
                link.target = node;
                isTarget = true;
              } 
            });
            if(isSource && isTarget) {
              link.user = req.user;
              links.push(link);
            } else {
              callback_(new Error('Link has no source or target node from node list'));
            } 
          });
          LinkModel.create(links, function(err) {
            links = [];
            for (var i = 1; i < arguments.length; ++i) {
              links.push(arguments[i]);
            }
            callback_(err, nodes, links);
          });
        },

        function(nodes, links, callback_) {
          new GraphModel({
            title: fsm.title || 'fsm.title',
            type: fsm.type || 'fsm.type', 
            parentNodeId: fsm.parentNodeId,
            links: links,
            nodes: nodes,
            user: req.user
          }).save(callback_);
        }

      ], callback);
    });
  });

  async.parallel(graphsSaveFunctions, function(err, results) {
    if(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      var
      finalstatemachines = [],
      processes = {};
      results.forEach(function(result, index) {
        if(index === 0) {
          processes = result[0];
        } else {
          finalstatemachines.push(result[0]);  
        }
      });
      new ProtocolModel({
        title: protocol_.title || 'Protocol title HC',
        processes: processes,
        finalstatemachines: finalstatemachines,
        user: req.user
      }).save(function(err, protocol) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.json(protocol);
        }
      });
    }
  });
  
};

exports.read = function(req, res) {
  res.json(req.lpaProtocol);
};

exports.update = function(req, res) {
  var protocol = req.protocol;

  protocol = _.extend(protocol, req.body);

  protocol.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(protocol);
    }
  });
};

exports.delete = function(req, res) {
  var protocol = req.protocol;

  protocol.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(protocol);
    }
  });
};

exports.list = function(req, res) {
  ProtocolModel.find().sort('-created')
  //.deepPopulate('processes.nodes processes.links user')
  .deepPopulate('processes.nodes processes.links.source processes.links.target user')
  .exec(function(err, protocols) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(protocols);
    }
  });
};

exports.protocolByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Protocol is invalid'
    });
  }

  ProtocolModel.findById(id)
    //.deepPopulate('processes.nodes processes.links finalstatemachines.nodes finalstatemachines.links')
    //.deepPopulate('processes.nodes processes.links finalstatemachines.nodes finalstatemachines.links.source finalstatemachines.links.target')
    .deepPopulate('processes.nodes processes.links.source processes.links.target finalstatemachines.nodes finalstatemachines.links.source finalstatemachines.links.target')
    .exec(function(err, protocol) {
      if (err) return next(err);
      if (!protocol) {
        return res.status(404).send({
          message: 'Protocol not found'
        });
      }
      req.lpaProtocol = protocol;
      next();
    });
};

exports.hasAuthorization = function(req, res, next) {
  if (req.protocol.user.id !== req.user.id) {
    return res.status(403).send({
      message: 'User is not authorized'
    });
  }
  next();
};
