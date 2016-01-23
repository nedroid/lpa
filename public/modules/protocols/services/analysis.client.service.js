'use strict';

angular.module('protocols').factory('Analysis', ['d3', '$window', 'Graph', 'Messenger',
  function(d3, $window, Graph, Messenger) {

    var 

    graph = {
      svg: null,
      overlay: null,
      tree: null,
      treeSvg: null,
      protocol: null,
      root: null,
      diagonal: null,
      nodesCount: 0,
      normalNodesCount: 0,
      error: false
    },

    element = null,

    node = {
      procNum: 0,
      size: 30
    },
    
    duration = 500,

    NODE_TYPE = {
      QUEUE_FULL: 'QUEUE_FULL',
      UNDEFINED_RECEIVE: 'UNDEFINED_RECEIVE',
      REPEATING: 'REPEATING',
      NORMAL: 'NORMAL'
    };

    function resize() {
      var 
      w = angular.element('.container > section').prop('offsetWidth'),
      h = 2000;

      graph.tree.size([w, h]);

      graph.treeSvg
        .attr('width', w)
        .attr('height', h);

      graph.overlay
        .attr('width', w)
        .attr('height', h);
    }

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

    function creatTextNode(d3node, value) {
      d3node.selectAll('g')
        .data([value])
        .enter()
        .append('svg:g')
        .attr('class', 'text-tree-node')
        .attr('text-anchor', 'middle')
        .each(function (d) {

          d3.select(this)
            .append('svg:circle')
            .attr('stroke', '#333')
            .attr('fill', '#fff')
            .attr('stroke-width', '2px')
            .attr('r', 22)
            .attr('cx', '2px')
            .attr('cy', '22px');

          d3.select(this)
            .append('svg:text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '14px')
            .attr('dx', '2px')
            .attr('dy', '28px')
            .text(d);    
        });
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
          node_.process = node_.processes[i % node.procNum].label;
        } else {
          node_.value = node_.processes[i % node.procNum].queue[node_.processes[Math.floor(i / node.procNum)]._id].values.join(', ');
          node_.process = null;
        }

        node_.grid.data.push({ 
          time: i, 
          value: node_.value,
          process: node_.process,
          width: node_.grid.item.size,
          height: node_.grid.item.size,
          x: node_.grid.item.posX,
          y: node_.grid.item.posY,
          count: i + 1
        });

        node_.grid.item.posY += node_.grid.item.step;
        if((i + 1) % node.procNum === 0) {
          node_.grid.item.posY = node_.grid.item.startY;
          node_.grid.item.posX += node_.grid.item.step;
        }
      }

      d3node.selectAll('g')
        .data(node_.grid.data)
        .enter()
        .append('svg:g')
        .attr('text-anchor', 'middle')
        .each(function (d) {
          
          d3.select(this)
            .append('svg:rect')
            .attr('class', 'cell')
            .attr('fill', '#fff')
            .attr('stroke', '#333')
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('width', function(d) { return d.width; })
            .attr('height', function(d) { return d.height; });

          d3.select(this)
            .append('svg:text')           
            .attr('x', function(d) { return d.x + d.width / 2; })
            .attr('y', function(d) { return d.y; })
            .attr('dy', '20px')
            .text(function(d) { return d.value || ''; });

          d3.select(this)
            .append('svg:text')
            .attr('class', 'process')
            .attr('text-anchor', 'start')
            .attr('fill', '#A7A7A7')
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('dy', '28px')
            .attr('dx', '2px')
            .text(function(d) { return d.process || ''; });
        });
    }

    function update(source) {

      graph.tree.nodeSize([
        node.size * source.processes.length + 30,
        node.size * source.processes.length + 130
      ]);
      
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

          switch(d.typeId) {
            case NODE_TYPE.QUEUE_FULL:
              creatTextNode(d3.select(this), 'PV');
              break;
            case NODE_TYPE.UNDEFINED_RECEIVE:
              creatTextNode(d3.select(this), 'NS');
              break;
            case NODE_TYPE.REPEATING:
              creatTextNode(d3.select(this), getTreeNode(d.repeatingNodeId).normalNodeId);
              break;
            default:
              createNode(d3.select(this), d);

              d3.select(this)
                .append('svg:text')
                .attr('x', function () { return (node.procNum * node.size) / -2; })
                .attr('dy', '-5px')
                .text(function(d) { return getTreeNode(d.id).normalNodeId; });

              d3.select(this)
                .on('click', click);
          }

          d3.select(this)
            .append('svg:text')
            .attr('dx', '10px')
            .attr('dy', '-5px')
            .text(function(d) { return d.action; });

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
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', '2px')
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
    
    function getParentTreeProcess(parentTreeNode, processNodeId) {
      var parent;
      parentTreeNode.processes.forEach(function (process) {
        if (process.nodeId === processNodeId) {
          parent = process;
        }
      });
      return parent;
    }

    function getProcess(processNodeId) {
      var process_;
      graph.protocol.processes.nodes.forEach(function(process) {
        if (process.nodeId === processNodeId) {
            process_ = process;
        }
      });
      return process_;
    }

    function addToQueue(targetProcessNodeId, sourceProcess, msg) {
      var isAdded = false;

      graph.protocol.processes.nodes.forEach(function(processNode) {
        if (processNode.nodeId === targetProcessNodeId && processNode.queue[sourceProcess._id].values.length < processNode.queue[sourceProcess._id].length) {
          processNode.queue[sourceProcess._id].values.push(msg);
          isAdded = true;
        }
      });

      return isAdded;
    }

    function removeFromQueue(sourceProcessNodeId, targetProcess, msg) {
      var isRemoved = false;

      graph.protocol.processes.nodes.forEach(function(processNode) {
        if (processNode.nodeId === sourceProcessNodeId) {
          var index = processNode.queue[targetProcess._id].values.indexOf(msg);
          if (index >= 0) {
            processNode.queue[targetProcess._id].values.splice(index, 1);
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
      var tmp_  = {
        nodeId: process.nodeId,
        label: process.label,
        _id: process._id,
        currrentFsmNode: transformFsmNode(process.currrentFsmNode),
        queue: {}
      };
      graph.protocol.processes.nodes.forEach(function (process_) {
        if (process !== process_) {
          tmp_.queue[process_._id] = {
            values: process.queue[process_._id].values.slice(),
            length: process.queue[process_._id].length
          };
        }
      });
      return tmp_;
    }

    function compareTreeNodes(node1, node2) {
      var count = 0;
      if (node1.typeId === NODE_TYPE.NORMAL && node2.typeId === NODE_TYPE.NORMAL) {
        node1.processes.forEach(function(p1) {
          node2.processes.forEach(function(p2) {
            if (p1.nodeId === p2.nodeId && angular.equals(p1.queue, p2.queue) &&
              p1.currrentFsmNode.nodeId === p2.currrentFsmNode.nodeId) {
              count++;
            }
          });
        });
      }
      return node1.processes.length === node2.processes.length && node1.processes.length === count;
    }

    function isTreeNodeExists(currentTreeNode, treeNode) {
      var index = -1;
      if (compareTreeNodes(currentTreeNode, treeNode)) {
        index = currentTreeNode.id;
      } else if (currentTreeNode.children && currentTreeNode.children.length > 0) {
        for (var i = 0; i < currentTreeNode.children.length; i++) {
          if((index = isTreeNodeExists(currentTreeNode.children[i], treeNode)) > 0) {
            break; 
          }
        }
      }
      return index;
    }

    function createTreeNode(options) {
      options = options || {};
      
      var treeNode =  {
        id: ++graph.nodesCount - 1,
        processes: [],
        typeId: options.typeId || NODE_TYPE.NORMAL,
        action: options.action || '',
        level: options.level
      };

      graph.protocol.processes.nodes.forEach(function(process) {
        treeNode.processes.push(transformProcessNode(process));
      });

      if (graph.root && (treeNode.repeatingNodeId = isTreeNodeExists(graph.root, treeNode)) >= 0) {
        treeNode.typeId = NODE_TYPE.REPEATING;
      }

      if (treeNode.typeId === NODE_TYPE.NORMAL) {
        treeNode.normalNodeId =  ++graph.normalNodesCount - 1;
      }

      return treeNode;
    }

    function addChildNode(parentTreeNode, options) {
      parentTreeNode.children = parentTreeNode.children || [];

      parentTreeNode.children.push(createTreeNode(options));
    }

    
    function treeNodes(parent, node, childs) {
      if (!parent) return;
      node(parent);
      childs(parent).forEach(function (child) {
        treeNodes(child, node, childs);
      });
    }

    function getTreeNodes(level, typeId) {
      var nodes = [];
      treeNodes(graph.root, function(node) {
        if (node.level === level && node.typeId === typeId) {
          nodes.push(node);
        }
      }, function(d) {
        return d.children && d.children.length > 0 ? d.children : [];
      });
      return nodes;
    }
    
    function getTreeNode(id) {
      var node;
      treeNodes(graph.root, function(node_) {
        if (node_.id === id) {
          node = node_;
        }
      }, function(d) {
        return d.children && d.children.length > 0 ? d.children : (d._children && d._children.length > 0 ? d._children : []);
      });
      return node;
    }

    function researchLevel(parentTreeNode, level, isLast) {
      
      var priorityProcess = null;

      graph.protocol.processes.nodes.forEach(function (sourceProcess) {

        getProcessFsmLinks(sourceProcess).forEach(function(link) {

          sourceProcess.currrentFsmNode = getParentTreeProcess(parentTreeNode, sourceProcess.nodeId).currrentFsmNode;

          if (sourceProcess.currrentFsmNode.nodeId === link.source.nodeId) {

            var
            targetProcess = link.processId && getProcess(link.processId) || {},
            action = sourceProcess.label + ': ' + Graph.LINK_TYPE[link.typeId] + link.name + (link.processId && ('(' + targetProcess.label + ')') || '');

            graph.protocol.processes.nodes.forEach(function (process_) {
              var parent  = getParentTreeProcess(parentTreeNode, process_.nodeId);
              process_.currrentFsmNode = parent.currrentFsmNode;
              process_.queue = {};
              graph.protocol.processes.nodes.forEach(function (process2_) {
                if (process_ !== process2_) {
                  process_.queue[process2_._id] = {
                    values: parent.queue[process2_._id].values.slice(),
                    length: parent.queue[process2_._id].length
                  };
                }
              });
            });

            var 
            addToQueueResult = null,
            removeFromQueueResult = null;

            switch(link.typeId) {
              case 'SEND':
                if ((!graph.priority || (!priorityProcess || priorityProcess._id === sourceProcess._id)) &&
                  (addToQueueResult = addToQueue(link.processId, sourceProcess, link.name))) {
                  
                  sourceProcess.currrentFsmNode = link.target;
                  addChildNode(parentTreeNode, {
                    action: action,
                    level: level
                  });
                  priorityProcess = sourceProcess;

                } else if(addToQueueResult === false) {
                  addChildNode(parentTreeNode, {
                    typeId: NODE_TYPE.QUEUE_FULL,
                    action: action,
                    level: level
                  });
                }
                break;
              case 'RECEIVE':
                if ((!graph.priority || (!priorityProcess || priorityProcess._id === sourceProcess._id)) &&
                  (removeFromQueueResult = removeFromQueue(sourceProcess.nodeId, targetProcess, link.name))) {

                  sourceProcess.currrentFsmNode = link.target;
                  addChildNode(parentTreeNode, {
                    action: action,
                    level: level
                  });
                  priorityProcess = sourceProcess;
                  
                //} else if (removeFromQueueResult === false && getParentTreeProcess(parentTreeNode, sourceProcess.nodeId).queue[targetProcess._id].values.length > 0) {
                } else if (removeFromQueueResult === false && sourceProcess.queue[targetProcess._id].values.length > 0) {
                  addChildNode(parentTreeNode, {
                    typeId: NODE_TYPE.UNDEFINED_RECEIVE,
                    action: action,
                    level: level
                  });
                }
                break;
              case 'LOCAL':
                sourceProcess.currrentFsmNode = link.target;
                addChildNode(parentTreeNode, {
                  action: action,
                  level: level
                });
                break;
            }
          }
        });
      });
      
      if (isLast) {
        var children = getTreeNodes(level, NODE_TYPE.NORMAL);
        children.forEach(function (treeChildNode, index) {
          if (treeChildNode.typeId === NODE_TYPE.NORMAL) {
            researchLevel(treeChildNode, level + 1, index === children.length - 1);
          }
        });
      }
    }

    function collapseAllNodes() {
      graph.svg.selectAll('g.node').each(function(d, i) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } 
      });
      update(graph.root);
    }

    function drawGraph(protocol) {

      graph.svg.selectAll('*').remove();

      graph.protocol = protocol;
      graph.error = false;
      graph.nodesCount = 0;
      graph.normalNodesCount = 0;
      graph.root = null;

      graph.priority = protocol.isPriority;

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

      if (graph.priority) {
        graph.protocol.processes.nodes.sort(function (a, b) {
          var aIndex, bIndex;
          protocol.priorityProcesses.forEach(function(p, index_) {
            if (a.nodeId === p.nodeId) {
              aIndex = index_;
            } if (b.nodeId === p.nodeId) {
              bIndex = index_;
            }
          });
          return aIndex > bIndex;
        });
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
          Messenger.post('MISSING_START_STATE', 'error', process.label);
          graph.error = true;
        }

        // number of queues == processes.length - 1
        process.queue = {};
        graph.protocol.processes.nodes.forEach(function(process_) {
          if(process !== process_) {
            process.queue[process_._id] = {
              length: process.queueLength,
              values: []
            };  
          }
        });          
        
      });

      if(graph.error) {
        return;
      }

      resize();

      graph.root = createTreeNode();      
      graph.root.x0 = graph.treeSvg.attr('width') / 2;
      graph.root.y0 = 0;
      
      researchLevel(graph.root, 0, true);

      update(graph.root);
    }

    function init(element_) {
      var
      width =  5000,
      height = 1000;

      element = element_;

      graph.tree = d3.layout.tree()
        .size([width, height]);

      graph.diagonal = d3.svg.diagonal()
        .source(function(d) { return { x: d.source.x, y: ( d.source.y + node.procNum * node.size )}; })            
        .target(function(d) { return { x: d.target.x, y: d.target.y }; })
        .projection(function(d) { return [d.x, d.y]; });

      graph.treeSvg = d3.select(element_).append('svg')
        .attr('width', width)
        .attr('height', height);

      graph.svg = graph.treeSvg
        .append('g')
        .attr('transform', 'translate(0, 50)')
        .call(d3.behavior.zoom().scaleExtent([-1, 8]).on('zoom', function () {
          graph.svg.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
        }));

      graph.overlay = graph.svg.append('rect')
        .attr('class', 'overlay')
        .attr('fill', 'none')
        .attr('width', width)
        .attr('height', height);

      graph.svg = graph.svg.append('g');

      angular.element($window).bind('resize', resize);
    }

    return {
      init: init,
      drawTree: drawGraph,
      collapseAllNodes: collapseAllNodes
    };
  }
]);
