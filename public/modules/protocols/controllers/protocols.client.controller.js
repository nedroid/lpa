'use strict';

angular.module('protocols').controller('ProtocolsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Messenger', 'Protocols', 'StateMachine',
	function($scope, $stateParams, $location, Authentication, Messenger, Protocols, StateMachine) {
		$scope.authentication = Authentication;

		$scope.selected = {
			index: 0
		};

		$scope.fsms = StateMachine.instances;

		$scope.save = function() {

			var protocol = new Protocols({
				title: 'TESTTT',
				fsms: [],
			});

			StateMachine.instances.forEach(function(fsm) {
				protocol.fsms.push(fsm.data());
			});
			
			protocol.$save(function(response) {
				$location.path('protocols/' + response._id);
			}, function(errorResponse) {
				Messenger.post(errorResponse.data.message, 'error');
			});
		};

		$scope.processInit = function() {
			  $scope.fsms =  [
			  	{
			  		title: 'Protokol test test'
			  	}
			  ];
		};

		$scope.findOne = function() {
			$scope.protocol = Protocols.get({
				protocolId: $stateParams.protocolId
			});
		};

	}
]);