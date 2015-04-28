'use strict';

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus', '$translate',
	function($scope, Authentication, Menus, $translate) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};
		
		$scope.toggleLanguage = function () {
		    $translate.use(($translate.use() === 'en_EN') ? 'si_SL' : 'en_EN');
  		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);