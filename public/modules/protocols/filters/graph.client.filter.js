'use strict';

angular.module('protocols').filter('processFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        if (item.values && item.values.type === 'PROCESSES') {
          out = item.values.data.nodes;
        }
      });
    } else {
      out = items;
    }

    return out;
  };
});