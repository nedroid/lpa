'use strict';

angular.module('core').directive('panelDraggable', function($document) {
  return {
    restrict: 'C',
    link: function(scope, element, attr) {
      var
      startX = 0, 
      startY = 0, 
      x = 0, 
      y = 0;
    
      function mousemove(e) {
        y = e.screenY - startY;
        x = e.screenX - startX;
        element.css({
          top: y + 'px',
          left: x + 'px'
        });
      }

      function mouseup(e) {
        y = element.css('top').replace('px', '') * 1;
        x = element.css('left').replace('px', '') * 1;
        y = y < 0 ? 0 : y;
        x = x < 0 ? 0 : x;
        element.css({
          top: y + 'px',
          left: x + 'px'
        });
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
      }

      element.find('.panel-heading').on('mousedown', function(e) {
        e.preventDefault();
        y = element.css('top').replace('px', '') * 1;
        x = element.css('left').replace('px', '') * 1;
        startX = e.screenX - x;
        startY = e.screenY - y;
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      });

    }
  };
});