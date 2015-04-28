'use strict';

//Menu service used for managing  menus
angular.module('core').service('Messenger', ['$translate',
	function($translate) {
		
		Messenger.options = {
    		extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
    		theme: 'future'
		};

		var _messenger = new Messenger();

		this.post = function(msg, type, options) {
			/*
			$translate(msg).then(function(message) {
				_messenger.post({
  				message: message,
  				type: type || 'error',
  				showCloseButton: true
				});	
			});
			*/
			_messenger.post({
  				message: msg || 'No message',
  				type: type || 'error',
  				showCloseButton: true
			});	
		};
	}
]);