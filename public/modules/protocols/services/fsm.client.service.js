'use strict';

angular.module('protocols').service('StateMachine', ['$filter', 'Messenger', 'StateMachines', 'Nodes', 'Links',
	function($filter, Messenger, StateMachines, Nodes, Links) {

		var 
		finalStateMachines = [],
	
		radius = d3.scale.sqrt().range([0, 6]),

		NODES = {
			TYPE: {
				PROCESS: 'PROCESS',
				START_STATE: 'START_STATE',
				ACCEPT_STATE: 'ACCEPT_STATE'
			},
			SIZE: {
				PROCESS: 12,
				START_STATE: 12,
				ACCEPT_STATE: 12
			},
			COLOR: {
				PROCESS: '#FF0000',
				START_STATE: '#00FF00',
				ACCEPT_STATE: '#0000FF'
			}
		};

		function nodeData(node) {
	 		return node[0][0].parentNode.__data__;
	 	}

  	function random(min, max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		}
		
		function label(i) {
			return i;
		}
	
		function uid() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		}			

		function FinalStateMachine() {
			this.FSM = {
				force: null,
				
				svg: {
					nodes: [],
					links: [],
					selected: {
						node: null,
						link: null
					}
				},
				data: {
					nodes: [],
					links: []
				}
			};
			finalStateMachines.push(this);
		}
		
		FinalStateMachine.prototype.data = function() {
			var 
			this_ = this,
			statemachine = new StateMachines({
	  		title: 'StateMachine as',
				nodes: [],
				links: []
	  	});
				
			this_.FSM.data.nodes.forEach(function(node) {
				statemachine.nodes.push(new Nodes({
	  			label: node.label,
	  				//TODO remove default value
					type: node.type || 'PROCESS',
					x: node.x,
					y: node.y,
					size: node.size,
					id: node.index
		  	}));
			});

			this_.FSM.data.links.forEach(function(link) {
				statemachine.links.push(new Links({
	  				//TODO remove default value
		  		label: link.label || 'TEST',
		  		source: link.source.index,
					target: link.target.index,					
		  	}));
			});

			return statemachine;
		};

		FinalStateMachine.prototype.build = function() {

			var this_ = this,
			
			nodeClicked = function(node) {
				if (this_.FSM.svg.selected.node) {
					this_.FSM.svg.selected.node.style('filter', '');
				}

 				this_.FSM.svg.selected.node = d3.select(this)
 				 .select('circle')
	    	 .style('filter', 'url(#selected-element)');
			},

			linkClicked = function(link) {
 				if (this_.FSM.svg.selected.link) {
 					this_.FSM.svg.selected.link.style('filter', '');
 				}
 				
 				this_.FSM.svg.selected.link = d3.select(this)
					.select('line')
					.style('filter', 'url(#selected-element)');
			};
			
			// LINKS
			this_.FSM.svg.links = this_.FSM.svg.links
				.data(this_.FSM.force.links(), function(d) { 
					return d.source._id + '-' + d.target._id; 
				});

			this_.FSM.svg.links.enter().append('svg:g').attr('class', 'link').each(function(d) {
				
				d3.select(this)
					.append('svg:path')
					.attr('class', 'link')
					.attr('id', function(d) { return 'link-' + d.source._id; })
  				.attr('marker-end', 'url(#end)');

  			d3.select(this)
					.append('svg:text')
 					.attr('class', 'linklabel')
					.style('font-size', '13px')
 					.attr('x', '50')
					.attr('y', '-20')
 					.attr('text-anchor', 'middle')
 					.style('fill','#000')
					.append('textPath')
					.attr('xlink:href', function(d) { return '#link-' + d.source._id; })
 					.text(function(d) { return d.label || 'no label'; });				
   
    	});

			this_.FSM.svg.links.exit().remove();

			//NODES
			this_.FSM.svg.nodes = this_.FSM.svg.nodes
				.data(this_.FSM.force.nodes(), function(d) { return d._id; });

			this_.FSM.svg.nodes.enter()
				.append('svg:g')
    		.attr('class', 'node')
    		.each(function(d) {

					d3.select(this)
						.append('svg:circle')
						.attr('class', function(d) { return 'node ' + d._id; })
						.attr('r', 20);

					d3.select(this)
						.append('svg:text')
    				.attr('dy', '.35em')
    				.attr('text-anchor', 'middle')
    				.text(function(d, i) { return d.label || i; });	
				
					d3.select(this)
						.on('click', nodeClicked);

    			d3.select(this)
    				.call(this_.FSM.force.drag);
				});

			this_.FSM.svg.nodes.exit()
				.remove();

			this_.FSM.force.start();

		};

		FinalStateMachine.prototype.nodeLinks = function(nodeId) {
	  	var links = [];
	  	this.FSM.data.links.forEach(function(link) {
				if (link.source._id === nodeId || link.target._id === nodeId) {
					links.push(link);
				}
	  	});
  		return links;
		};
		
	  FinalStateMachine.prototype.addNode = function (type) {
	  	var this_ = this;
			if (!type) {
				Messenger.post('No type selected!', 'error');
				return;
			} else if(this_.FSM.svg.selected.node) {	
				this_.FSM.data.nodes.push({
					_id: uid(),
					label: label(this_.FSM.data.nodes.length + 1),
					size: NODES.SIZE[type],
					type: NODES.TYPE[type],
					x: nodeData(this_.FSM.svg.selected.node).x + random(-15, 15),
					y: nodeData(this_.FSM.svg.selected.node).y + random(-15, 15),
  			});
		  
				this_.FSM.data.links.push({
					source: nodeData(this_.FSM.svg.selected.node), 
					target: this_.FSM.data.nodes[this_.FSM.data.nodes.length - 1],
					label: 'unknown'
				});
			} else {
  			this_.FSM.data.nodes.push({
					_id: uid(),
					label: label(this_.FSM.data.nodes.length + 1),
					size: NODES.SIZE[type],
					type: NODES.TYPE[type]
  			});
			}
			this_.build();
		};

		FinalStateMachine.prototype.removeNode = function () {
			var this_ = this;
	  	if (!this_.FSM.svg.selected.node) {
	  		Messenger.post('NO_SELECTED_NODE', 'error');
				return;
			}
			var 
			nodeId = nodeData(this_.FSM.svg.selected.node)._id,
			nodeIndex,
			nodeLinksIndexes = [];
			this_.FSM.data.nodes.forEach(function(node, index) {
				if(node._id === nodeId) {
					nodeIndex = index;
				}
			});

			this_.FSM.data.nodes.splice(nodeIndex, 1);
			
			this_.FSM.data.links.forEach(function(link, index) { 
				this_.nodeLinks(nodeId).forEach(function(nodeLink) {	
					if(nodeLink === link) {
						nodeLinksIndexes.push(index);
					}
				});
			});
			nodeLinksIndexes
				.sort(function(a, b) { return b - a; })
				.forEach(function(linkIndex) {
					this_.FSM.data.links.splice(linkIndex, 1);
				});

			this_.FSM.svg.selected.node = null;
			this_.build();
	  };

		FinalStateMachine.prototype.init = function(element, fsmData) {
			fsmData = fsmData || {};
			
			var 
			this_ = this,
			
			width = 960,
  		height = 500,

			svg = d3.select(element).append('svg')
				.attr('width', '100%')
				.attr('height', '100%'),
			
			defs = svg.append('svg:defs'),

			filter, 
			feMerge,

			tick = function() {
  			this_.FSM.svg.nodes.attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')'; 
				});

  			this_.FSM.svg.links.selectAll('path').attr('d', function(d) {
  				var
  				dx = d.target.x - d.source.x,
    			dy = d.target.y - d.source.y,
      		dr = Math.sqrt(dx * dx + dy * dy);
  				return 'M' + d.source.x + ',' +  d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
				});
			};

			filter = defs.append('filter')
    		.attr('id', 'selected-element')
    		.attr('height', '130%');
 
			filter.append('feGaussianBlur')
    		.attr('in', 'SourceAlpha')
    		.attr('stdDeviation', 5)
    		.attr('result', 'blur');
 
			filter.append('feOffset')
    		.attr('in', 'blur')
    		.attr('dx', 5)
    		.attr('dy', 5)
    		.attr('result', 'offsetBlur');
 
			feMerge = filter.append('feMerge');
 
			feMerge.append('feMergeNode')
    		.attr('in', 'offsetBlur');
			
			feMerge.append('feMergeNode')
    		.attr('in', 'SourceGraphic');

    	defs.selectAll('marker')
    		.data(['end'])
  			.enter().append('svg:marker')
    		.attr('id', String)
    		.attr('viewBox', '0 -5 10 10')
    		.attr('refX', 15)
    		.attr('refY', -1.5)
    		.attr('markerWidth', 6)
    		.attr('markerHeight', 6)
    		.attr('orient', 'auto')
  			.append('svg:path')
    		.attr('d', 'M0,-5L10,0L0,5');

			this_.FSM.data.nodes = [];
    	this_.FSM.data.links = [];

			this_.FSM.force = d3.layout.force()
  			.nodes(this_.FSM.data.nodes)
  			.links(this_.FSM.data.links)
  			.charge(-400)
  			.linkDistance(120)
  			.size([width, height])
  			.on('tick', tick);

			this_.FSM.svg.nodes = svg.selectAll('g.node');
    	this_.FSM.svg.links = svg.selectAll('g.link');

			fsmData.nodes = fsmData.nodes || [];
			fsmData.nodes.forEach(function(node) {
				this_.FSM.data.nodes.push({
					_id: node._id,
					label: node.label,
					size: node.size,
					type: node.type,
					x: node.x,
					y: node.y
				});
			});
			
			fsmData.links = fsmData.links || [];
			fsmData.links.forEach(function(link, sourceNode, targetNode) {
				sourceNode = null;
				targetNode = null;
				this_.FSM.data.nodes.forEach(function(node) {
					if(node._id === link.source) {
						sourceNode = node;
					}
					if(node._id === link.target) {
						targetNode = node;	
					}
				});				
				this_.FSM.data.links.push({
					label: link.label,
					source: sourceNode,
					target: targetNode
				});
			});

  		this_.build();
		};

		return {
			instance: FinalStateMachine,
			instances: finalStateMachines,
			nodes: NODES
		};
  }
]);
