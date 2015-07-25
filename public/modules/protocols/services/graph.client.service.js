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
        FINAL_STATE_MACHNE: 'FINAL_STATE_MACHNE'
      },
      NODES: {
        PROCESSES: 'PROCESS',
        FINAL_STATE_MACHNE: 'ACCEPT_STATE'
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
          } else if(type === GRAPH.TYPE.FINAL_STATE_MACHNE) {
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
      };

      // LINKS
      this_.values.svg.links = this_.values.svg.links
        .data(this_.values.force.links(), function(d) { 
          return d.source.node_id + '-' + d.target.node_id + '-' + (d.linkNum || 1); 
        });

      this_.values.svg.links.enter().append('svg:g').attr('class', 'link').each(function(d) {
        
        d3.select(this)
          .append('svg:path')
          .attr('class', 'link')
          .attr('id', function(d) { return 'link-' + d.source.node_id + '-' + d.target.node_id + '-' + (d.linkNum || 1); })
          .attr('marker-end', 'url(#end)');

        d3.select(this)
          .append('svg:text')
          .attr('class', 'linklabel')
          .attr('dx', LINKDISTANCE / 2)
          .attr('dy', '-10')
          .attr('text-anchor', 'middle')
          .append('svg:textPath')
            .on('dblclick', labelClick)
            .attr('xlink:href', function(d) { return '#link-' + d.source.node_id + '-' + d.target.node_id + '-' + (d.linkNum || 1); })
            .text(function(d) { return d.label(); });       
      });

      this_.values.svg.links.exit()
        .remove();

      //NODES
      this_.values.svg.nodes = this_.values.svg.nodes
        .data(this_.values.force.nodes(), function(d) { return d.node_id; });

      this_.values.svg.nodes.enter()
        .append('svg:g')
        .attr('class', 'node')
        .each(function(d) {

          d3.select(this)
            .append('svg:circle')
            .attr('class', function(d) { return 'node ' + d.node_id; })
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

      this_.values.force.start();

    };

    Graph.prototype.nodeLinks = function(nodeId) {
      var links = [];
      this.values.data.links.forEach(function(link) {
        if (link.source.node_id === nodeId || link.target.node_id === nodeId) {
          links.push(link);
        }
      });
      return links;
    };
    
    Graph.prototype.addLink = function () {

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
          linkNum: linkNum,
          type: options.type || LINKS.TYPE.UNKNOWN,
          name: options.name || label(linkNum),
          process: options.process || '_',
          queue: this_.values.type === GRAPH.TYPE.FINAL_STATE_MACHNE ? undefined : {
            in: {
              length: 1
            },
            out: {
              length: 1
            }
          },
          label: function() {
            var label_ = '';
            if(this.queue) {
              label_ = this.queue.in.length + '/' + this.queue.out.length;  
            } else {
              label_ = this.type + this.name + '(' + this.process + ')';  
            }
            return label_;
          }
        });

        this_.build();
      };
      
      this_.temp = this_.temp || {};

      if(!this_.values.svg.selected.node) {
        Messenger.post('Select source node and click add link.', 'info');
        return;
      } else if(this_.temp.sourceNode) {
        addLink(nodeData(this_.temp.sourceNode), nodeData(this_.values.svg.selected.node));
        this_.temp.sourceNode = null;
        Messenger.post('Link added.', 'success');
      } else {
        this_.temp.sourceNode = this_.values.svg.selected.node;
        Messenger.post('Select target node and click add link.', 'info');
      }
    };

    Graph.prototype.addNode = function (type) {
      if (!type) {
        Messenger.post('No type selected!', 'error');
        return;
      } 
      var
      this_ = this,

      nodeLabel = label(this_.values.data.nodes.length + 1, this_.values.type),

      node = {
        node_id: uid(),
        label: nodeLabel,
        size: NODES.SIZE[type],
        type: NODES.TYPE[type],
        isStart: NODES.TYPE[type] === NODES.TYPE.START_STATE
      };

      if(this_.values.type === GRAPH.TYPE.PROCESSES) {
        createNewGraph({
          type: GRAPH.TYPE.FINAL_STATE_MACHNE,
          title: nodeLabel
        });  
      } else if(this_.values.type === GRAPH.TYPE.FINAL_STATE_MACHNE) {
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
      
      // TOOD - remove this
      if(this_.values.svg.selected.node) {  
        node.x = nodeData(this_.values.svg.selected.node).x + random(-15, 15);
        node.y = nodeData(this_.values.svg.selected.node).y + random(-15, 15);

        this_.values.data.links.push({
          source: nodeData(this_.values.svg.selected.node), 
          target: node,
          type: LINKS.TYPE.UNKNOWN,
          name: label(1),
          process: '_',
          queue: this_.values.type === GRAPH.TYPE.FINAL_STATE_MACHNE ? undefined : {
            in: {
              length: 1
            },
            out: {
              length: 1
            }
          },
          label: function() {
            var label_ = '';
            if(this.queue) {
              label_ = this.queue.in.length + '/' + this.queue.out.length;  
            } else {
              label_ = this.type + this.name + '(' + this.process + ')';  
            }
            return label_;
          }
        });
      }

      this_.values.data.nodes.push(node);
      
      this_.build();
    };

    Graph.prototype.removeNode = function () {
      var this_ = this;
      if (!this_.values.svg.selected.node) {
        Messenger.post('NO_SELECTED_NODE', 'error');
        return;
      }
      var 
      nodeId = nodeData(this_.values.svg.selected.node).node_id,
      nodeIndex,
      nodeLinksIndexes = [];
      this_.values.data.nodes.forEach(function(node, index) {
        if(node.node_id === nodeId) {
          nodeIndex = index;
        }
      });

      this_.values.data.nodes.splice(nodeIndex, 1);
      
      this_.values.data.links.forEach(function(link, index) { 
        this_.nodeLinks(nodeId).forEach(function(nodeLink) {  
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
        this_.values.data.nodes.push({
          _id: node._id,
          node_id: node._id,
          label: node.label,
          size: node.size,
          type: node.type,
          x: node.x,
          y: node.y
        });
      });
      
      options.links = options.links || [];
      options.links.forEach(function(link, sourceNode, targetNode) {
        sourceNode = null;
        targetNode = null;
        this_.values.data.nodes.forEach(function(node) {
          if(node.node_id === link.source) {
            sourceNode = node;
          }
          if(node.node_id === link.target) {
            targetNode = node;  
          }
        });       
        this_.values.data.links.push({
          source: sourceNode,
          target: targetNode,
          linkNum: 1,
          type:  LINKS.TYPE.UNKNOWN,
          name:  label(1),
          process: '_',
          queue: {
            in: {
              length: 1
            },
            out: {
              length: 1
            }
          },
          label: function() {
            var label_ = '';
            if(this.queue) {
              label_ = this.queue.in.length + '/' + this.queue.out.length;  
            } else {
              label_ = this.type + this.name + '(' + this.process + ')';  
            }
            return label_;
          }
        });
      });

      this_.build();
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

    return {
      instance: Graph,
      instances: graphs,
      destroy: destroy,
      empty: createNewGraph,
      NODES: NODES,
      TYPE: GRAPH.TYPE,
      NODE_TYPE: GRAPH.NODES
    };
  }
]);
