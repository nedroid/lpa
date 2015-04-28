'use strict';

angular.module('protocols').directive('fsm', [
	
	function() {
		return {
  		restrict: 'EA',
  		scope: {
  			fsmData: '=fsmData'
  		},
  		templateUrl: 'modules/protocols/directives/views/fsm.client.directive.view.html',
  		controller: ['$scope', 'StateMachine', function($scope, StateMachine) {
				$scope.fsm = new StateMachine.instance();
			}],
    	link: function(scope, elm, attrs) {
    		scope.fsm.init(elm[0].querySelector('.fsm-content'), scope.fsmData);
  		}
		};
	}
]);