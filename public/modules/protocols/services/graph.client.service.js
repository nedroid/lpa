'use strict';

angular.module('protocols').service('Graph', ['$filter', 'Messenger',
  function($filter, Messenger) {

    var 
    graphs = [],
    graphsCount = 0,

    radius = d3.scale.sqrt().range([0, 6]),
    
    LINKDISTANCE = 150,
    
    GRAPH = {
      TYPE: {
        PROCESSES: 'PROCESSES',
        FINAL_STATE_MACHNE: 'FINAL_STATE_MACHNE'
      }
    },

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
          }
        },
        data: {
          nodes: [],
          links: []
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
      var 
      this_ = this,
      statemachine = {
        title: 'StateMachine as',
        nodes: [],
        links: []
      };
        
      this_.values.data.nodes.forEach(function(node) {
        statemachine.nodes.push({
          label: node.label,
            //TODO remove default value
          type: node.type || 'PROCESS',
          x: node.x,
          y: node.y,
          size: node.size,
          id: node.index
        });
      });

      this_.values.data.links.forEach(function(link) {
        statemachine.links.push({
            //TODO remove default value
          label: link.label || 'TEST',
          source: link.source.index,
          target: link.target.index,          
        });
      });

      return statemachine;
    };

    Graph.prototype.build = function() {

      var this_ = this,
      
      nodeClicked = function(node) {
        if (this_.values.svg.selected.node) {
          this_.values.svg.selected.node.style('filter', '');
        }

        this_.values.svg.selected.node = d3.select(this)
         .select('circle')
         .style('filter', 'url(#selected-element)');
      },

      linkClicked = function(link) {
        if (this_.values.svg.selected.link) {
          this_.values.svg.selected.link.style('filter', '');
        }
        
        this_.values.svg.selected.link = d3.select(this)
          .select('line')
          .style('filter', 'url(#selected-element)');
      };
      
      // LINKS
      this_.values.svg.links = this_.values.svg.links
        .data(this_.values.force.links(), function(d) { 
          return d.source._id + '-' + d.target._id; 
        });

      this_.values.svg.links.enter().append('svg:g').attr('class', 'link').each(function(d) {
        
        d3.select(this)
          .append('svg:path')
          .attr('class', 'link')
          .attr('id', function(d) { return 'link-' + d.source._id + '-' + d.target._id; })
          .attr('marker-end', 'url(#end)');

        d3.select(this)
          .append('svg:text')
          .attr('class', 'linklabel')
          .style('font-size', '13px')
          .attr('x', LINKDISTANCE / 2)
          .attr('y', '-20')
          .attr('text-anchor', 'middle')
          .style('fill','#000')
          .append('textPath')
          .attr('xlink:href', function(d) { return '#link-' + d.source._id + '-' + d.target._id; })
          .text(function(d) { return d.label || 'no label'; });       
   
      });

      this_.values.svg.links.exit().remove();

      //NODES
      this_.values.svg.nodes = this_.values.svg.nodes
        .data(this_.values.force.nodes(), function(d) { return d._id; });

      this_.values.svg.nodes.enter()
        .append('svg:g')
        .attr('class', 'node')
        .each(function(d) {

          d3.select(this)
            .append('svg:circle')
            .attr('class', function(d) { return 'node ' + d._id; })
            .attr('r', function(d) { return radius(d.size); });

          d3.select(this)
            .append('svg:text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .text(function(d, i) { return d.label || i; }); 
        
          d3.select(this)
            .on('click', nodeClicked);

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
        if (link.source._id === nodeId || link.target._id === nodeId) {
          links.push(link);
        }
      });
      return links;
    };
    
    Graph.prototype.addNode = function (type) {
      var this_ = this;
      if (!type) {
        Messenger.post('No type selected!', 'error');
        return;
      } else if(this_.values.svg.selected.node) {  
        this_.values.data.nodes.push({
          _id: uid(),
          label: label(this_.values.data.nodes.length + 1),
          size: NODES.SIZE[type],
          type: NODES.TYPE[type],
          x: nodeData(this_.values.svg.selected.node).x + random(-15, 15),
          y: nodeData(this_.values.svg.selected.node).y + random(-15, 15),
        });
      
        this_.values.data.links.push({
          source: nodeData(this_.values.svg.selected.node), 
          target: this_.values.data.nodes[this_.values.data.nodes.length - 1],
          label: 'unknown'
        });
      } else {
        this_.values.data.nodes.push({
          _id: uid(),
          label: label(this_.values.data.nodes.length + 1),
          size: NODES.SIZE[type],
          type: NODES.TYPE[type]
        });
      }

      if(this_.values.type === GRAPH.TYPE.PROCESSES) {
        createNewGraph({
          type: GRAPH.TYPE.FINAL_STATE_MACHNE,
          title: label(graphs.length)
        });  
      }
      
      this_.build();
    };

    Graph.prototype.removeNode = function () {
      var this_ = this;
      if (!this_.values.svg.selected.node) {
        Messenger.post('NO_SELECTED_NODE', 'error');
        return;
      }
      var 
      nodeId = nodeData(this_.values.svg.selected.node)._id,
      nodeIndex,
      nodeLinksIndexes = [];
      this_.values.data.nodes.forEach(function(node, index) {
        if(node._id === nodeId) {
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
      
      width = 960,
      height = 500,

      svg = d3.select(element).append('svg')
        .attr('width', '100%')
        .attr('height', '100%'),
      
      defs = svg.append('svg:defs'),

      filter, 
      feMerge,

      tick = function() {
        this_.values.svg.nodes.attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'; 
        });

        this_.values.svg.links.selectAll('path').attr('d', function(d) {
          var
          dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
          return 'M' + d.source.x + ',' +  d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
        });
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
        .size([width, height])
        .on('tick', tick);

      this_.values.svg.nodes = svg.selectAll('g.node');
      this_.values.svg.links = svg.selectAll('g.link');


      this_.values.type = options.type;
      this_.values.title = options.title;

      options.nodes = options.nodes || [];
      options.nodes.forEach(function(node) {
        this_.values.data.nodes.push({
          _id: node._id,
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
          if(node._id === link.source) {
            sourceNode = node;
          }
          if(node._id === link.target) {
            targetNode = node;  
          }
        });       
        this_.values.data.links.push({
          label: link.label,
          source: sourceNode,
          target: targetNode
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

    return {
      instance: Graph,
      instances: graphs,
      empty: createNewGraph,
      NODES: NODES,
      TYPE: GRAPH.TYPE
    };
  }
]);
