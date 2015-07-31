'use strict';

angular.module('protocols').factory('Analysis', ['d3', 'Messenger',
  function(d3, Messenger) {

    var 

    graph = {
      svg: null,
      tree: null,
      root: null,
      diagonal: null,
      nodesSize: 0
    },

    node = {
      procNum: 0,
      size: 30
    },
    
    duration = 500;

    function createNode(d3node, node_) {

      node_.grid = {};
      node_.grid.temp = {};
      node_.grid.data = [];
      node_.grid.item = {};
      node_.grid.item.size = node.size;
      node_.grid.item.startX = -1 * (node.procNum * node_.grid.item.size) / 2;
      node_.grid.item.startY = 0; //-1 * node.procNum * node_.grid.item.size;
      node_.grid.item.step = node.size;
      node_.grid.item.posX = node_.grid.item.startX;
      node_.grid.item.posY = node_.grid.item.startY;

      for (var i = 0; i < node.procNum * node.procNum; i++) {
        /*
        if (i % node.procNum) {
          node_.grid.temp.value = node_.queue && node_.queue.in && node_.queue.in.values && node_.queue.in.values.join(',') || '';
        } else if (j > i) {
          node_.grid.temp.value = node_.queue && node_.queue.out && node_.queue.out.values && node_.queue.out.values.join(',') || '';
        } else {
          node_.grid.temp.value = node_.label;
        }
          */
        node_.grid.data.push({ 
          time: i, 
          value: node_.grid.temp.value || '?',
          width: node_.grid.item.size,
          height: node_.grid.item.size,
          x: node_.grid.item.posX,
          y: node_.grid.item.posY,
          count: i + 1
        });

        node_.grid.item.posX += node_.grid.item.step;
        if((i + 1) % node.procNum === 0) {
          node_.grid.item.posX = node_.grid.item.startX;
          node_.grid.item.posY += node_.grid.item.step;
        }
      }

      node_.d3 = d3node.selectAll('g')
        .data(node_.grid.data)
        .enter().append('svg:g');

      node_.d3
        .append('svg:rect')
        .attr('class', 'cell')
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; })
        .attr('width', function(d) { return d.width; })
        .attr('height', function(d) { return d.height; })
        .on('mouseover', function() {
          d3.select(this).style('fill', '#0F0');
        })
        .on('mouseout', function() {
          d3.select(this).style('fill', '#FFF');
        })
        .on('click', function() {
          console.log(d3.select(this));
        })
        .style('fill', '#FFF')
        .style('stroke', '#555');

      node_.d3
        .append('svg:text')           
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; })
        .attr('dy', '20px')
        .attr('dx', '12px')
        .text(function(d) { return d.value || '?'; });

      node_.children = [{ 
        article: 'asd_1',
        depth: node_.depth + 1,
        isLeft: true
      }, {
        article: 'asd_2',
        depth: node_.depth + 1,
        isLeft: false
      }];

    }

    function addNode(node_) {
      
      node_.children = [
        { 
          article: 'asd_1',
          depth: node_.depth + 1,
          isLeft: true
        },
        {
          article: 'asd_2',
          depth: node_.depth + 1,
          isLeft: false
        }
      ];
    

      draw(node_);
    }

    function draw(source) {

      var 
      nodes = graph.tree.nodes(graph.root).reverse(),
      links = graph.tree.links(nodes);

      nodes.forEach(function(d) { d.y = d.depth * 150; });

      var 
      node_ = graph.svg.selectAll('g.node')
        .data(nodes, function(d) { return d.id || (d.id = ++graph.nodesSize); });

      var 
      nodeEnter = node_.enter().append('g')
        .attr('class', 'node')
        .attr('width', function() { return node.procNum * node.size; })
        .attr('height', function() { return node.procNum * node.size; })
        .attr('transform', function(d) { return 'translate(' + source.x0 + ',' + source.y0 + ')'; })
        .on('click', click);

      createNode(nodeEnter, node_);
  
      node_
        .transition()
        .duration(duration)
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'; 
        });

      node_
        .exit()
        .transition()
        .duration(duration)
        .attr('transform', function(d) {
            return 'translate(' + source.x + ',' + source.y+ ')'; 
        })
        .remove();

      
      var 
      link = graph.svg.selectAll('path.tree-link')
        .data(links, function(d) { return d.target.id; });

      link.enter().insert('path', 'g')
        .attr('class', 'tree-link')
        .attr('d', function(d) {
          var o = {
            x: source.x0, 
            y: source.y0
          };
          return graph.diagonal({
            source: o, 
            target: o
          });
        });

      link
        .transition()
        .duration(duration)
        .attr('d', graph.diagonal);

      link
        .exit()
        .transition()
        .duration(duration)
        .attr('d', function(d) {
          var o = {
            x: source.x,
            y: source.y
          };
          return graph.diagonal({
            source: o, 
            target: o
          });
        })
        .remove();

      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function click(node_) {

      if (node_.children) {    /* Collapse children */
        node_._children = node_.children;
        node_.children = null;
        draw(node_);
      } else if(node_._children) {    /* Expand children */
        node_.children = node_._children;
        node_._children = null;  
        draw(node_);
      }  else { 
        addNode(node_);
      }

    }

    function drawGraph(protocol) {      
      
      if(!protocol) {
        Messenger.post('NO_PROTOCOL_TO_ANALYZE', 'error');
        return;
      }
      if(protocol.processes && protocol.processes.nodes && protocol.processes.nodes.length) {
        node.procNum = protocol.processes.nodes.length;
      } else {
        Messenger.post('PROTOCOL_HAS_NO_PROCESSES', 'error');
        return;
      }


      //set graph.root node pos
      graph.root = {
        article: 'article',
        depth: 0,
        isLeft: true
      };
      graph.root.x0 = (1500-60) / 2;
      graph.root.y0 = 0;
    
      addNode(graph.root);
    }

    function init(element) {
      var 
      margin = {
        top: 60,
        right: 0,
        bottom: 0,
        left: 0
      },
      width =  1024 - margin.right - margin.left,
      height = 1500 - margin.top - margin.bottom;

      graph.tree = d3.layout.tree()
        .size([width, height]);

      graph.diagonal = d3.svg.diagonal()
        .source(function(d) { return { x: d.source.x, y: ( d.source.y + node.procNum * node.size )}; })            
        .target(function(d) { return { x: d.target.x, y: d.target.y }; })
        .projection(function(d) { return [d.x, d.y]; });

      graph.svg = d3.select(element).append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('id', 'svg')
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    }

    return {
      init: init,
      drawTree: drawGraph
    };
  }
]);
