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
      nodesCount: 0,
      error: false
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
          node_.value = node_.processes[i % node.procNum].queue.in;
          //node_.value = getInQueue(node_.processes[i % node.procNum].nodeId).join(', ');
        } else {
          node_.value = node_.processes[i % node.procNum].queue.out;
          //node_.value = getOutQueue(node_.processes[i % node.procNum].nodeId).join(', ');
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
        .attr('height', function(d) { return d.height; });

      node_.d3
        .append('svg:text')           
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; })
        .attr('dy', '20px')
        .attr('dx', '12px')
        .text(function(d) { return d.value || ''; });
    }

    function update(source) {

      var 
      nodes = graph.tree.nodes(graph.root).reverse(),
      links = graph.tree.links(nodes);

      nodes.forEach(function(d) { d.y = d.depth * 150; });

      var 
      node_ = graph.svg.selectAll('g.node')
        .data(nodes, function(d) { return d.id || (d.id = ++graph.nodesCount); });

      node_.enter().append('g')
        .attr('class', 'node')
        .attr('width', function () { return node.procNum * node.size; })
        .attr('height', function () { return node.procNum * node.size; })
        .attr('transform', function (d) { return 'translate(' + source.x0 + ',' + source.y0 + ')'; })
        .each(function (d) {

          createNode(d3.select(this), d);

          d3.select(this)
            .on('click', click);
        });
  
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
      update(node_);
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

    function transformFsmNode(node_) {
      return {
        nodeId: node_.nodeId,
        label: node_.label
      };
    }
    
    function transformProcessNode(process) {
      return {
        nodeId: process.nodeId,
        currrentFsmNode: transformFsmNode(process.currrentFsmNode),
        queue: {
          in: getInQueue(process.nodeId).join(', '),
          out: getOutQueue(process.nodeId).join(', ')
        } 
      };
    }

    function createTreeNode() {
      var treeNode =  {
        processes: []
      };

      graph.protocol.processes.nodes.forEach(function(process) {
        treeNode.processes.push(transformProcessNode(process));
      });

      return treeNode;
    }

    function addChildNode(treeNode) {
      treeNode.children = treeNode.children || [];

      treeNode.children.push(createTreeNode());
    }

    function getParentProcessCurrentNode (treeNode, processId) {
      var currrentFsmNode;
      treeNode.processes.forEach(function (process) {
        if (process.nodeId === processId) {
          currrentFsmNode = process.currrentFsmNode;
        }
      });
      return currrentFsmNode;
    }

    function researchLevel(treeNode, process, index) {

      getProcessFsmLinks(process).forEach(function(link_, linkIndex) {

        if (process.currrentFsmNode.nodeId === link_.source.nodeId) {
          
          var tmp = process.currrentFsmNode;

          switch(link_.typeId) {
            case 'RECEIVE':
              if(removeFromOutQueue(process.nodeId, link_.name)) {
                process.currrentFsmNode = link_.target;
                addChildNode(treeNode);
              }
              break;
            case 'SEND':
              if (addToOutQueue(link_.processId, link_.name)) {
                process.currrentFsmNode = link_.target;
                addChildNode(treeNode);
              }
              break;
            case 'LOCAL':
              process.currrentFsmNode = link_.target;
              addChildNode(treeNode);
              break;
            default:
              Messenger.post('UNKNOWN_LINK_TYPE', 'error');
              return;
          }

          process.currrentFsmNode = tmp;
        }
      });

      if(index === graph.protocol.processes.nodes.length - 1) {
        if (treeNode.children) {
          treeNode.children.forEach(function (treeChildNode, index) {
            graph.protocol.processes.nodes.forEach(function (process_) {
              process_.currrentFsmNode = getParentProcessCurrentNode(treeChildNode, process_.nodeId);
              researchLevel(treeChildNode, process_, index);  
            });  
          });
        }
      }
    }

    function drawGraph(protocol) {      
      
      graph.protocol = protocol;
      graph.error = false;
      graph.nodesCount = 0;

      if(!graph.protocol) {
        Messenger.post('NO_PROTOCOL_TO_ANALYZE', 'error');
        return;
      }
      if(graph.protocol.processes && graph.protocol.processes.nodes && graph.protocol.processes.nodes.length) {
        node.procNum = graph.protocol.processes.nodes.length;
      } else {
        Messenger.post('PROTOCOL_HAS_NO_PROCESSES', 'error');
        return;
      }

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

      // init current process state
      graph.protocol.processes.nodes.forEach(function(process, index) {
        graph.protocol.finalstatemachines.forEach(function(fsm) {
          if (process.nodeId === fsm.parentNodeId) {
            fsm.nodes.forEach(function(node_) {
              if (node_.type === 'START_STATE') {
                process.currrentFsmNode = transformFsmNode(node_);
              }
            });
          }
        });
        if(!process.currrentFsmNode) {
          Messenger.post('MISSING_START_STATE', 'error');
          graph.error = true;
        }
      });

      if(graph.error) {
        return;
      }

      graph.root = createTreeNode();      
      graph.root.x0 = (1500-60) / 2;
      graph.root.y0 = 0;
      
      graph.protocol.processes.nodes.forEach(function (process, index) {
        researchLevel(graph.root, process, index);
      });

      update(graph.root);
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
        .separation(function (a, b) {
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
