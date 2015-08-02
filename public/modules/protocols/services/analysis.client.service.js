'use strict';

angular.module('protocols').factory('Analysis', ['d3', 'Graph', 'Messenger',
  function(d3, Graph, Messenger) {

    var 

    graph = {
      svg: null,
      tree: null,
      protocol: null,
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

      node_.grid = {
        data: [],
        item: {
          size: node.size,
          startX: node.procNum * node.size / -2,
          startY: 0,
          step: node.size
        }
      };
      node_.grid.item.posX = node_.grid.item.startX;
      node_.grid.item.posY = node_.grid.item.startY;

      for (var i = 0; i < node.procNum * node.procNum; i++) {

        if (Math.floor(i / node.procNum) === i % node.procNum) {
          node_.value = node_.processes[i % node.procNum].currrentFsmNode.label;
        } else if (Math.floor(i / node.procNum) < i % node.procNum) {
          node_.value = getInQueue(node_.processes[i % node.procNum].nodeId).join(', ');
        } else {
          node_.value = getOutQueue(node_.processes[i % node.procNum].nodeId).join(', ');
        }

        node_.grid.data.push({ 
          time: i, 
          value: node_.value,
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
        .text(function(d) { return d.value || ''; });

    }

    function addChildNode(nodeParent, nodeChild) {
      nodeParent.children = nodeParent.children || [];
      var child = {
        nodeId: nodeChild.nodeId,
        label: nodeChild.label
      };

      nodeParent.children.push(nodeChild);
      
      draw(nodeChild);

      return nodeChild;
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

      createNode(nodeEnter, source);
  
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
      if (node_.children) {
        /* Collapse children */
        node_._children = node_.children;
        node_.children = null;
      } else if(node_._children) {
        /* Expand children */
        node_.children = node_._children;
        node_._children = null;   
      }
      draw(node_);
    }

    function getProcessFsmNodes(process) {
      var fsmNodes = [];
      graph.protocol.processes.nodes.forEach(function(process) {
        graph.protocol.finalstatemachines.forEach(function(fsm) {
          if (process.nodeId === fsm.parentNodeId) {
            fsmNodes = fsm.nodes;
          }
        });
      });
      return fsmNodes;
    }
    
    function getProcessFsmLinks(process) {
      var fsmLinks = [];
      graph.protocol.finalstatemachines.forEach(function(fsm) {
        if (process.nodeId === fsm.parentNodeId) {
          fsmLinks = fsm.links;
        }
      });
      return fsmLinks;
    }

    function getInQueue(processId) {
      var queue = [];
      graph.protocol.processes.links.forEach(function(processLink) {
        if (processLink.target.nodeId === processId) {
          queue = processLink.queue.in.values;
        }
      });
      return queue;
    }
    
    function addToInQueue(processId, msg) {
      var isAdded = false;
      graph.protocol.processes.links.forEach(function(processLink) {
        if (processLink.source.nodeId === processId) {
          if (processLink.queue.in.values.length < processLink.queue.in.length) {
            processLink.queue.in.values.push(msg);
            isAdded = true;
          }
        }
      });
      return isAdded;
    }

    function removeFromInQueue(processId, msg) {
      var isRemoved = false;
      graph.protocol.processes.links.forEach(function(processLink) {
        if (processLink.source.nodeId === processId) {
          var index = processLink.queue.in.values.indexOf(msg);
          if (index >= 0) {
            processLink.queue.in.values.slice(index);
            isRemoved = true;
          }
        }
      });
      return isRemoved;
    }

    function getOutQueue(processId) {
      var queue = [];
      graph.protocol.processes.links.forEach(function(processLink) {
        if (processLink.source.nodeId === processId) {
          queue = processLink.queue.out.values;
        }
      });
      return queue;
    }

    function addToOutQueue(processId, msg) {
      var isAdded = false;
      graph.protocol.processes.links.forEach(function(processLink) {
        if (processLink.source.nodeId === processId) {
          if (processLink.queue.out.values.length < processLink.queue.out.length) {
            processLink.queue.out.values.push(msg);
            isAdded = true;
          }
        }
      });
      return isAdded;
    }

    function removeFromOutQueue(processId, msg) {
      var isRemoved = false;
      graph.protocol.processes.links.forEach(function(processLink) {
        if (processLink.source.nodeId === processId) {
          var index = processLink.queue.out.values.indexOf(msg);
          if (index >= 0) {
            processLink.queue.out.values.slice(index);
            isRemoved = true;
          }
        }
      });
      return isRemoved;
    }

    function findRootNode() {
      var rootNode = {
        processes: [],
        depth: 0
      },
      startStatesNum = 0;

      // find start nodes in each fsm
      graph.protocol.processes.nodes.forEach(function(process, index) {
        graph.protocol.finalstatemachines.forEach(function(fsm) {
          if (process.nodeId === fsm.parentNodeId) {
            fsm.nodes.forEach(function(node_) {
              if (node_.type === 'START_STATE') {
                
                process.currrentFsmNode = {
                 nodeId: node_.nodeId,
                 label: node_.label
                };

                process.currrentFsmNode = node_;
                startStatesNum ++;
              }
            });
          }
        });
        process.index = index;
        rootNode.processes.push(process);
      });

      // init queues
      graph.protocol.processes.links.forEach(function(processLink, index) {
        if(!processLink.queue) {
          processLink.queue = {
            in: {
              length: processLink.queueInLength 
            },
            out: {
              length: processLink.queueOutLength
            }
          };
        }
        processLink.queue.in.values = [];
        processLink.queue.out.values = [];
      });

      return rootNode.processes.length === startStatesNum && rootNode;
    }

    function researchLevel(parent, process, index) {

      getProcessFsmLinks(process).forEach(function(link_) {
        if (process.currrentFsmNode.nodeId === link_.source.nodeId) {

          switch(link_.typeId) {
            case 'RECEIVE':
              if (addToInQueue(link_.processId, link_.name)) {
                if(removeFromOutQueue(process.nodeId, link_.name)) {
                  parent = addChildNode(parent, link_.target);
                } else {
                  removeFromInQueue(link_.processId, link_.name);
                }
              }
              break;
            case 'SEND':
              if (addToOutQueue(link_.processId, link_.name)) {
                if (removeFromInQueue(process.nodeId, link_.name)) {
                  parent = addChildNode(parent, link_.target);
                } else {
                  removeFromOutQueue(link_.processId, link_.name);
                }
              }
              break;
            case 'LOCAL':
              parent = addChildNode(parent, link_.target); 
              break;
            default:
              Messenger.post('UNKNOWN_LINK_TYPE', 'error');
              return;
          }
        }
      });

      if(index === graph.root.processes.length - 1) {
        graph.root.processes.forEach(function (process, index) {
          if(process.isFinished) {
            researchLevel(parent, process, index);  
          }
        });  
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

      graph.protocol = protocol;
      graph.root = findRootNode();

      if(!graph.root) {
        Messenger.post('MISSING_START_STATE', 'error');
        return;
      }
      graph.root.x0 = (1500-60) / 2;
      graph.root.y0 = 0;
    
      graph.root.processes.forEach(function (process, index) {
        researchLevel(graph.root, process, index);
      });

      draw(graph.root);
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
        .size([width, height])
        .separation(function separation(a, b) {
          return a.parent === b.parent ? 1 : 2;
        });

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
