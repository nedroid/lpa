'use strict';

var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	async = require('async'),
	ProtocolModel = mongoose.model('Protocol'),
	NodeModel = mongoose.model('Node'),
	LinkModel = mongoose.model('Link'),
	StateMachineModel = mongoose.model('StateMachine'),
	_ = require('lodash');

exports.create = function(req, res) {

	var protocol_ = req.body,
		fsmsSaveFunctions = [];
	
	protocol_.fsms = protocol_.fsms || [];
	protocol_.fsms.forEach(function(fsm) {

		fsmsSaveFunctions.push(function(callback) {
		
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
							if (link.source === node.name) {
								link.source = node;
								isSource = true;	
							}
							if (link.target === node.name) {
								link.target = node;
								isTarget = true;
							}	
						});
						if(isSource && isTarget) {
							link.user = req.user;
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
					new StateMachineModel({
						title: fsm.title || 'hardcoded fsm title',
						links: links,
						nodes: nodes,
						user: req.user
					}).save(callback_);
				}

			], callback);
		});
	});

	async.parallel(fsmsSaveFunctions, function(err, results) {
		if(err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			var fsms = [];
			results.forEach(function(result) {
				fsms.push(result[0]);
			});
			new ProtocolModel({
				title: 'Prvi protokol',
				fsms: fsms,
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
	ProtocolModel.find().sort('-created').populate('user', 'displayName').exec(function(err, protocols) {
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
		.deepPopulate('fsms.nodes fsms.links')//fsms.links.source fsms.links.target
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
