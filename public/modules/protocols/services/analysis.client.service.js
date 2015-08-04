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

    function click(node_) {
      if (node_.children) {
        node_._children = node_.children;
        node_.children = null;
      } else if(node_._children) {
        node_.children = node_._children;
        node_._children = null;   
      }
      update(node_);
    }

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
        } else {
          node_.value = node_.processes[i % node.procNum].queue.values.join(', ');
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
        .data(nodes, function(d) { return d.id; });

      node_.enter().append('g')
        .attr('class', 'node')
        .attr('width', function () { return node.procNum * node.size; })
        .attr('height', function () { return node.procNum * node.size; })
        .attr('transform', function (d) { return 'translate(' + source.x0 + ',' + source.y0 + ')'; })
        .each(function (d) {

          createNode(d3.select(this), d);

          d3.select(this)
            .append('svg:text')
            .attr('x', function () { return (node.procNum * node.size) / -2; })
            .attr('dy', '-5px')
            .text(function(d) { return d.id; });

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
    
    function getParentTreeProcess(parentTreeNode, processId) {
      var parent;
      parentTreeNode.processes.forEach(function (process) {
        if (process.nodeId === processId) {
          parent = process;
        }
      });
      return parent;
    }

    function addToQueue(parentTreeNode, processId, msg) {
      var 
      isAdded = false,
      parent = getParentTreeProcess(parentTreeNode, processId);
  
      graph.protocol.processes.nodes.forEach(function(processNode) {
        if (processNode.nodeId === processId) {
          if (parent.queue.values.length < processNode.queue.length) {
            processNode.queue.values.push(msg);
            isAdded = true;
          }
        }
      });
      return isAdded;
    }

    function removeFromQueue(parentTreeNode, processId, msg) {
      var 
      isRemoved = false,
      parent = getParentTreeProcess(parentTreeNode, processId),
      index = parent.queue.values.indexOf(msg),
      queue = parent.queue.values.slice();

      queue.splice(index, 1);

      if (index >= 0) {
        graph.protocol.processes.nodes.forEach(function(processNode) {
          if (processNode.nodeId === processId) {
            processNode.queue.values = queue;
            isRemoved = true;
          }
        });
      }
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
          values: process.queue.values.slice()
        }
      };
    }

    function createTreeNode() {
      var treeNode =  {
        id: ++graph.nodesCount - 1,
        processes: []
      };
      graph.protocol.processes.nodes.forEach(function(process) {
        treeNode.processes.push(transformProcessNode(process));
      });
      return treeNode;
    }

    function addChildNode(parentTreeNode) {
      parentTreeNode.children = parentTreeNode.children || [];

      parentTreeNode.children.push(createTreeNode());
    }

    function researchLevel(parentTreeNode, process, index) {

      getProcessFsmLinks(process).forEach(function(link_, linkIndex) {

        if (process.currrentFsmNode.nodeId === link_.source.nodeId) {
          
          var tmp = process.currrentFsmNode;
          process.queue.values = [];

          switch(link_.typeId) {
            case 'SEND':
              if (addToQueue(parentTreeNode, link_.processId, link_.name)) {
                process.currrentFsmNode = link_.target;
                addChildNode(parentTreeNode);
              }
              break;
            case 'RECEIVE':
              if (removeFromQueue(parentTreeNode, process.nodeId, link_.name)) {
                process.currrentFsmNode = link_.target;
                addChildNode(parentTreeNode);
              }
              break;
            case 'LOCAL':
              process.currrentFsmNode = link_.target;
              addChildNode(parentTreeNode);
              break;
            default:
              Messenger.post('UNKNOWN_LINK_TYPE', 'error');
              return;
          }

          process.currrentFsmNode = tmp;
        }
      });

      if(index === graph.protocol.processes.nodes.length - 1) {
        if (parentTreeNode.children) {
          parentTreeNode.children.forEach(function (treeChildNode, index) {
            graph.protocol.processes.nodes.forEach(function (process_) {
              process_.currrentFsmNode = getParentTreeProcess(treeChildNode, process_.nodeId).currrentFsmNode;
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

      // init current process state and queues
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
        process.queue = {
          length: process.queueLength,
          values: []
        };
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
