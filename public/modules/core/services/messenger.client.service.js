'use strict';

angular.module('core').service('Messenger', ['$filter',
	function($filter) {
		
		Messenger.options = {
    		extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
    		theme: 'future'
		};

		var _messenger = new Messenger();
    
		this.post = function(msg, type, options) {
			_messenger.post({
  				message: $filter('translate')(msg || 'NO_MESSAGE'),
  				type: type || 'error',
  				showCloseButton: true
			});	
		};
	}
]);