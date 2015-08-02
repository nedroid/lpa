'use strict';

angular.module('protocols')

.filter('processFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        if (item.values && item.values.type === 'PROCESSES') {
          item.values.data.nodes.forEach(function (node) {
            if(props && props.parentNodeId && node.nodeId !== props.parentNodeId) {
              out.push(node);
            }
          });
        }
      });
    } else {
      out = items;
    }

    return out;
  };
})

.filter('processName', ['Graph', function(Graph) {
  return function(item) {
    var name;
    if (typeof item === 'string') {
      Graph.instances.forEach(function(graph) {
        if (graph.values && graph.values.type === 'PROCESSES') {
          graph.values.data.nodes.forEach(function(node) {
            if (node.nodeId === item) {
              name = node.title;  
            }
          });
        }
      });
    } else if (!item) {
      name = '_';
    } else {
      name = item.label;
    }
    return name;
  };
}])

.filter('linkTypeName', ['Graph', function(Graph) {
  return function(item) {
    if (typeof item === 'string') {
      return Graph.LINK_TYPE[item];
    } else {
      return item && item.text;
    }
  };
}]);

