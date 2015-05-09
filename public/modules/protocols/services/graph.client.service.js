'use strict';

angular.module('protocols').service('Graph', ['$filter', 'Messenger',
  function($filter, Messenger) {

    var 
    graphs = [],
    graphsCount = 0,

    radius = d3.scale.sqrt().range([0, 6]),
    
    LINKDISTANCE = 250,
    
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
          .style('font-size', '13px')
          .attr('x', LINKDISTANCE / 2)
          .attr('y', '-20')
          .attr('text-anchor', 'middle')
          .style('fill','#000')
          .append('textPath')
          .attr('xlink:href', function(d) { return '#link-' + d.source.node_id + '-' + d.target.node_id + '-' + (d.linkNum || 1); })
          .text(function(d) { return d.label || 'no label'; });       
   
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
        if (link.source.node_id === nodeId || link.target.node_id === nodeId) {
          links.push(link);
        }
      });
      return links;
    };
    
    Graph.prototype.addLink = function () {

      var
      this_ = this,

      addLink = function(source, target) {
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
          linkNum: linkNum
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
      node = {
        node_id: uid(),
        label: label(this_.values.data.nodes.length + 1),
        size: NODES.SIZE[type],
        type: NODES.TYPE[type]
      };

      if(this_.values.svg.selected.node) {  
        node.x = nodeData(this_.values.svg.selected.node).x + random(-15, 15);
        node.y = nodeData(this_.values.svg.selected.node).y + random(-15, 15);

        this_.values.data.links.push({
          source: nodeData(this_.values.svg.selected.node), 
          target: node
        });
      }

      this_.values.data.nodes.push(node);

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
      TYPE: GRAPH.TYPE
    };
  }
]);
