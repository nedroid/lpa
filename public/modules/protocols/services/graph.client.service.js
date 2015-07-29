'use strict';

angular.module('protocols').factory('Graph', ['$filter', 'd3', 'Messenger', 'Actions',
  function($filter, d3, Messenger, Actions) {

    var 
    graphs = [],
    graphsCount = 0,

    radius = d3.scale.sqrt().range([0, 6]),
    
    LINKDISTANCE = 250,
    
    SETTINGS_MARGIN = 10,

    PROC_LABEL_TRANSLATOR = 'PABC'.split(''),
    FSM_LABEL_TRANSLATOR = 'xyz'.split(''),
    LABEL_TRANSLATOR = 'abcdefghijklmn'.split(''),

    GRAPH = {
      TYPE: {
        PROCESSES: 'PROCESSES',
        FINAL_STATE_MACHINE: 'FINAL_STATE_MACHINE'
      },
      NODES: {
        PROCESSES: 'PROCESS',
        FINAL_STATE_MACHINE: 'ACCEPT_STATE'
      }
    },

    LINKS = {
      TYPE: {
        UNKNOWN: '_',
        RECEIVE: '+',
        SEND: '-',
        LOCAL: '#'
      }
    },

    NODES = {
      TYPE: {
        PROCESS: 'PROCESS',
        START_STATE: 'START_STATE',
        ACCEPT_STATE: 'ACCEPT_STATE'
      },
      SIZE: {
        PROCESS: 14,
        START_STATE: 12,
        ACCEPT_STATE: 12
      },
      COLOR: {
        PROCESS: '#DDD',
        START_STATE: '#DDD',
        ACCEPT_STATE: '#DDD'
      },
      STROKE_WIDTH: {
        PROCESS: 1,
        START_STATE: 2,
        ACCEPT_STATE: 1,
        SELECTED: 3
      },
      STROKE: {
        PROCESS: '#000',
        START_STATE: '#F00',
        ACCEPT_STATE: '#000',
        SELECTED: '#337ab7',
      }
    };

    function nodeData(node) {
      return node[0][0].parentNode.__data__;
    }

    function random(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    function label(i, type) {
      var label_ = '';
      if(angular.isNumber(i)) {
        angular.forEach(i.toString().split(''), function(value) {
          value = parseInt(value);
          if(type === GRAPH.TYPE.PROCESSES) {
            label_ += PROC_LABEL_TRANSLATOR[value % PROC_LABEL_TRANSLATOR.length];
          } else if(type === GRAPH.TYPE.FINAL_STATE_MACHINE) {
            label_ += FSM_LABEL_TRANSLATOR[value % FSM_LABEL_TRANSLATOR.length];
          } else {
            label_ += LABEL_TRANSLATOR[value % LABEL_TRANSLATOR.length];
          }
        });
      } else {
        label_ = i;
      }
      return label_;
    }
  
    function uid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }   

    function Graph() {
      this.values = {

        type: null,
        title: null,

        force: null,
        
        svg: {
          nodes: [],
          links: [],
          selected: {
            node: null,
            link: null
          },
          start: {
            node: null
          }
        },
        data: {
          nodes: [],
          links: [],
          start: {
            node: null
          }
        }
      };
      if(graphsCount > graphs.length) {
        graphs[graphs.length - 1] = this;
      } else {
        graphs.push(this);  
        graphsCount++;
      }
      
    }
    
    Graph.prototype.data = function() {
      return {
        title: this.values.title,
        type: this.values.type,
        nodes: this.values.data.nodes,
        links: this.values.data.links
      };
    };

    Graph.prototype.build = function() {

      var this_ = this,
      
      nodeClicked = function(node) {
        if (this_.values.svg.selected.node) {
          this_.values.svg.selected.node
            //.style('filter', '');
            .style('stroke-width', function(d) { return NODES.STROKE_WIDTH[d.type]; })
            .style('stroke', function(d) { return NODES.STROKE[d.type]; });
        }
        
        this_.values.svg.selected.node = d3.select(this)
         .select('circle')
         .style('stroke-width', function(d) { return NODES.STROKE_WIDTH.SELECTED; })
         .style('stroke', function(d) { return NODES.STROKE.SELECTED; });
         //.style('filter', 'url(#selected-element)');
      },

      nodeDblClicked = function(node) {
        Actions.showNodeSettings({
          style: {
            //top: node.y + node.size + SETTINGS_MARGIN,
            //left: node.x + node.size + SETTINGS_MARGIN
            top: 80,
            left:100
          },
          node: node,
          graph: this_.data()
        });

        this_.temp = this_.temp || {};
        this_.temp.currentNode = d3.select(this);
      },

      linkClicked = function(link) {
        if (this_.values.svg.selected.link) {
          this_.values.svg.selected.link.style('filter', '');
        }

        this_.values.svg.selected.link = d3.select(this)
          .select('line')
          .style('filter', 'url(#selected-element)');
      },

      labelClick = function (link) {
        Actions.showLinkSettings({
          style: {
            top: this.offsetTop + SETTINGS_MARGIN,
            left: this.offsetLeft + SETTINGS_MARGIN
          },
          link: link,
          graph: this_.data()
        });
        this_.temp = this_.temp || {};
        this_.temp.currentLink = d3.select(this);
      };

      //NODES
      this_.values.svg.nodes = this_.values.svg.nodes
        .data(this_.values.force.nodes(), function(d) { 
          return d.nodeId; 
        });

      this_.values.svg.nodes.enter().append('svg:g').attr('class', 'node').each(function(d) {

        d3.select(this)
          .append('svg:circle')
          .attr('class', function(d) { return 'node ' + d.nodeId; })
          .attr('r', function(d) { return radius(NODES.SIZE[d.type]); })
          .style('stroke-width', function(d) { return NODES.STROKE_WIDTH[d.type]; })
          .style('stroke', function(d) { return NODES.STROKE[d.type]; })
          .style('fill', function(d) { return NODES.COLOR[d.type]; });

        d3.select(this)
          .append('svg:text')
          .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .text(function(d, i) { return d.label || i; }); 
      
        d3.select(this)
          .on('click', nodeClicked)
          .on('dblclick', nodeDblClicked);

        d3.select(this)
          .call(this_.values.force.drag);
      });

      this_.values.svg.nodes.exit()
        .remove();

       // LINKS
      this_.values.svg.links = this_.values.svg.links
        .data(this_.values.force.links(), function(d) { 
          return d.source.nodeId + '-' + d.target.nodeId + '-' + (d.linkNum || 1); 
        });

      this_.values.svg.links.enter().insert('svg:g',':first-child').attr('class', 'link').each(function(d) {
        
        d3.select(this)
          .append('svg:path')
          .attr('class', 'link')
          .attr('id', function(d) { return 'link-' + d.source.nodeId + '-' + d.target.nodeId + '-' + (d.linkNum || 1); })
          .attr('marker-end', this_.values.type === GRAPH.TYPE.PROCESSES ? '' : 'url(#end)');

        d3.select(this)
          .append('svg:text')
          .attr('class', 'linklabel')
          .attr('dx', LINKDISTANCE / 2)
          .attr('dy', '-10')
          .attr('text-anchor', 'middle')
          .append('svg:textPath')
            .on('dblclick', labelClick)
            .attr('xlink:href', function(d) { return '#link-' + d.source.nodeId + '-' + d.target.nodeId + '-' + (d.linkNum || 1); })
            .text(function(d) { return d.label(); });       
      });

      this_.values.svg.links.exit()
        .remove();

      // START  
      this_.values.force.start();
    };

    Graph.prototype.nodeLinks = function(nodeId_) {
      var links = [];
      this.values.data.links.forEach(function(link) {
        if (link.source.nodeId === nodeId_ || link.target.nodeId === nodeId_) {
          links.push(link);
        }
      });
      return links;
    };
    
    Graph.prototype.addLink = function (options) {
      options = options || {};

      var
      this_ = this,

      addLink = function(source, target, options) {
        options = options || {};
        var linkNum = 1;

        this_.values.data.links.forEach(function(link) {
          if(link.source === source && link.target === target) {
            linkNum += 1;
          }
        });
        if(source === target) {
          linkNum = linkNum * -1;
        }
        this_.values.data.links.push({
          source: source, 
          target: target,
          type: {
           id: options.typeId || 'UNKNOWN',
           text: LINKS.TYPE.UNKNOWN
          },
          linkNum: linkNum,
          name: options.name || label(linkNum),
          process: {
            id: options.processId || null
          },
          queue: this_.values.type === GRAPH.TYPE.FINAL_STATE_MACHINE ? undefined : {
            in: {
              length: options.queueInLength || 1
            },
            out: {
              length: options.queueOutLength || 1
            }
          },
          label: function() {
            var label_ = '';
            if(this.queue) {
              label_ = this.queue.in.length + '/' + this.queue.out.length;  
            } else {
              label_ = LINKS.TYPE[this.type.id] + this.name + '(' + processTitleById(this.process.id) + ')';  
            }
            return label_;
          },
          rebuild: function() {
            this_.temp = this_.temp || {};
            this_.temp.currentLink
              .text(function(d) { return d.label(); });
          }
        });
        this_.build();
      };
      
      this_.temp = this_.temp || {};

      if(!this_.values.svg.selected.node && !options.targetNode) {
        Messenger.post('Select source node and click add link.', 'info');
        return;
      } else if(this_.temp.sourceNode || options.sourceNode) {
        if(options.targetNode) {
          addLink(options.sourceNode, options.targetNode, options);
        } else {
          addLink(nodeData(this_.temp.sourceNode), nodeData(this_.values.svg.selected.node));  
          Messenger.post('Link added.', 'success');
        }
        this_.temp.sourceNode = null;
      } else {
        this_.temp.sourceNode = this_.values.svg.selected.node;
        Messenger.post('Select target node and click add link.', 'info');
      }
    };

    Graph.prototype.addNode = function (type, options) {
      if (!type) {
        Messenger.post('No type selected!', 'error');
        return;
      }
      
      options = options || {};

      var
      this_ = this,

      nodeLabel = label(this_.values.data.nodes.length + 1, this_.values.type),

      node = {
        nodeId: options.nodeId || uid(),
        label: options.label || nodeLabel,
        size: options.size || NODES.SIZE[type],
        type: options.type || NODES.TYPE[type],
        isStart: (options.type || NODES.TYPE[type]) === NODES.TYPE.START_STATE,
        rebuild: function() {
          this_.temp = this_.temp || {};
          this_.temp.currentNode
            .select('text')
            .text(function(d, i) { return d.label || i; }); 
        }
      };

      if(this_.values.type === GRAPH.TYPE.PROCESSES && !options.type) {
        createNewGraph({
          type: GRAPH.TYPE.FINAL_STATE_MACHINE,
          title: nodeLabel
        });  
      } else if(this_.values.type === GRAPH.TYPE.FINAL_STATE_MACHINE) {
        node.setStartState = function() {
          if(this_.values.svg.start.node && this_.values.data.start.node) {
            this_.values.svg.start.node
              .style('stroke-width', function(d) { return NODES.STROKE_WIDTH.ACCEPT_STATE; })
              .style('stroke', function(d) { return NODES.STROKE.ACCEPT_STATE; });
            this_.values.data.start.node.type = NODES.TYPE.ACCEPT_STATE;
            this_.values.data.start.node.isStart = false;
          }
          this_.values.svg.start.node = this_.values.svg.selected.node;
          this_.values.data.start.node = node;
          
          if(!node.isStart) {
            this_.values.svg.start.node
              .style('stroke-width', function(d) { return NODES.STROKE_WIDTH.START_STATE; })
              .style('stroke', function(d) { return NODES.STROKE.START_STATE; });
            this_.values.data.start.node.type = NODES.TYPE.START_STATE;
          }
        };
      }
      
      this_.values.data.nodes.push(node);

      if(this_.values.svg.selected.node) {  
        node.x = nodeData(this_.values.svg.selected.node).x + random(-15, 15);
        node.y = nodeData(this_.values.svg.selected.node).y + random(-15, 15);
        this_.addLink({
          sourceNode: nodeData(this_.values.svg.selected.node),
          targetNode: node
        });
      } else {
        this_.build();
      }
    };

    Graph.prototype.removeNode = function () {
      var this_ = this;
      if (!this_.values.svg.selected.node) {
        Messenger.post('NO_SELECTED_NODE', 'error');
        return;
      }
      var 
      nodeId_ = nodeData(this_.values.svg.selected.node).nodeId,
      nodeIndex,
      nodeLinksIndexes = [];
      this_.values.data.nodes.forEach(function(node, index) {
        if(node.nodeId === nodeId_) {
          nodeIndex = index;
        }
      });

      this_.values.data.nodes.splice(nodeIndex, 1);
      
      this_.values.data.links.forEach(function(link, index) { 
        this_.nodeLinks(nodeId_).forEach(function(nodeLink) {  
          if(nodeLink === link) {
            nodeLinksIndexes.push(index);
          }
        });
      });
      nodeLinksIndexes
        .sort(function(a, b) { return b - a; })
        .forEach(function(linkIndex) {
          this_.values.data.links.splice(linkIndex, 1);
        });

      removeGraph(nodeIndex + 1);
      this_.values.svg.selected.node = null;
      this_.build();
    };
    
    Graph.prototype.init = function(element, options) {
      options = options || {};
      
      var 
      this_ = this,
      
      svg = d3.select(element).append('svg')
        .attr('width', '100%')
        .attr('height', '100%'),
      
      defs = svg.append('svg:defs'),

      filter, 
      feMerge,

      tick = function () {
        this_.values.svg.nodes.attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'; 
        });

        this_.values.svg.links.selectAll('path').attr('d', function(d) {
          var
          sx = d.source.x,
          sy = d.source.y,
          tx = d.target.x,
          ty = d.target.y,
          dx = tx - sx,
          dy = ty - sy,
          dr = Math.sqrt(dx * dx + dy * dy),
          drx = dr,
          dry = dr,
          xRotation = 0,
          largeArc = 0,
          sweep = 1;

          if(d.linkNum < 0) {
            xRotation = 0;
            largeArc = 1;
            drx = 30 + (d.linkNum * -10);
            dry = 30 + (d.linkNum * -10);
            tx = tx + 1;
            ty = ty + 1;
          }
          
          drx = drx / (d.linkNum || 1);
          dry = dry / (d.linkNum || 1);
            
          var 
          scx = sx,
          scy = sy + 100,
          tcx = tx,
          tcy = ty + 100;
          return 'M' + 
            sx + ',' + sy + 
            'A' + drx + ',' + dry + ' ' + xRotation + ',' + largeArc + ',' + sweep + ' ' +
            //'C' + scx + ',' + scy + ' ' + tcx + ',' + tcy + ' ' +
            tx + ',' + ty;
        });
      },

      resize = function () {
        this_.values.force
          .size([element.offsetWidth, element.offsetHeight])
          .resume();
      };
      
      filter = defs.append('svg:filter')
        .attr('id', 'selected-element');
      filter.append('svg:feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 3)
        .attr('result', 'blur');
      filter.append('svg:feOffset')
        .attr('in', 'blur')
        .attr('result', 'offsetBlur');
      feMerge = filter.append('svg:feMerge');
      feMerge.append('svg:feMergeNode')
        .attr('in', 'offsetBlur');
      feMerge.append('svg:feMergeNode')
        .attr('in', 'SourceGraphic');

      defs.selectAll('marker')
        .data(['end'])
        .enter().append('svg:marker')
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

      this_.values.data.nodes = [];
      this_.values.data.links = [];

      this_.values.force = d3.layout.force()
        .nodes(this_.values.data.nodes)
        .links(this_.values.data.links)
        .charge(-400)
        .linkDistance(LINKDISTANCE)
        .on('tick', tick);
        
      resize();
      d3.select(window).on('resize.' + options._id || uid(), resize);

      this_.values.svg.nodes = svg.selectAll('g.node');
      this_.values.svg.links = svg.selectAll('g.link');

      this_.values.type = options.type;
      this_.values.title = options.title;

      options.nodes = options.nodes || [];
      options.nodes.forEach(function(node) {
        this_.addNode(node.type, {
          nodeId: node._id,
          label: node.label,
          size: node.size,
          type: node.type
        });
      });
      
      options.links = options.links || [];
      options.links.forEach(function(link, sourceNode, targetNode) {
        sourceNode = null;
        targetNode = null;
        this_.values.data.nodes.forEach(function(node) {
          if(node.nodeId === link.source) {
            sourceNode = node;
          }
          if(node.nodeId === link.target) {
            targetNode = node;  
          }
        });
        this_.addLink({
          sourceNode: sourceNode,
          targetNode: targetNode,
          typeId: link.typeId,
          name: link.name,
          processId: link.processId,
          queueInLength: link.queueInLength,
          queueOutLength: link.queueOutLength
        });
      });
    };
    
    function createNewGraph(options) {
      graphsCount += 2;
      graphs.push(options);
    }

    function removeGraph(graphIndex) {
      graphs.splice(graphIndex, 1);
      graphsCount--;
    }

    function destroy() {
      graphs.splice(0, graphs.length);
      graphsCount = 0;
    }

    function processTitleById(id) {
      var processTitle = '_';
      for (var i = 0; i < graphs.length; i++) {
        if(graphs[i].values && graphs[i].values.type === GRAPH.TYPE.PROCESSES) {
          for (var j = graphs[i].values.data.nodes.length - 1; j >= 0; j--) {
            if(graphs[i].values.data.nodes[j].nodeId === id) {
              processTitle = graphs[i].values.data.nodes[j].label;
              break;
            }
          }
        }
      }
      return processTitle;
    }

    return {
      instance: Graph,
      instances: graphs,
      destroy: destroy,
      empty: createNewGraph,
      NODES: NODES,
      TYPE: GRAPH.TYPE,
      NODE_TYPE: GRAPH.NODES,
      LINK_TYPE: LINKS.TYPE
    };
  }
]);
