'use strict';

angular.module('core').service('Messenger', ['$filter',
	function($filter) {
		
		Messenger.options = {
    	extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
    	theme: 'future'
		};

		var _messenger = new Messenger(),
    
    message = function(msg) {
      var args = Array.prototype.slice.call(arguments, 1);

      msg = $filter('translate')(msg || 'NO_MESSAGE');

      return msg.replace(/{(\d+)}/g, function(m, n) {
        return typeof args[n] !== 'undefined' ? args[n] : m;
      });
    };
    
		this.post = function(msg, type) {
			_messenger.post({
  				message: message(msg, Array.prototype.slice.call(arguments, 2)),
  				type: type || 'error',
  				showCloseButton: true
			});	
		};
	}
]);