'use strict';

angular.module('protocols').run(['Menus',
	function(Menus) {
		Menus.addMenuItem('topbar', 'PROTOCOLS', 'protocols', 'dropdown', '/protocols(/create)?');
		Menus.addSubMenuItem('topbar', 'protocols', 'PROTOCOLS_LIST', 'protocols');
		Menus.addSubMenuItem('topbar', 'protocols', 'PROTOCOLS_NEW', 'protocols/create', false, false);
	}
]);