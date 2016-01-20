'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function($scope, Authentication) {

		$scope.authentication = Authentication;

    $scope.init = function () {
      $scope.slides = [{
        image: 'modules/core/img/brand/lpa-logo.png'
      }, {
        image: 'modules/core/img/pgss/procesi.jpg',
        text: 'Procesi'
      }, {
        image: 'modules/core/img/pgss/fsm.jpg',
        text: 'Final State Machine'
      }, {
        image: 'modules/core/img/pgss/tree-procesi.jpg',
        text: 'Analiza'
      }, {
        image: 'modules/core/img/pgss/tree-send.jpg',
        text: 'Sending messages'
      }, {
        image: 'modules/core/img/pgss/tree-receive.jpg',
        text: 'Receiving messages'
      }, {
        image: 'modules/core/img/pgss/tree-local.jpg',
        text: 'Local messages'
      }, {
        image: 'modules/core/img/pgss/tree-ns.jpg',
        text: 'Nedefiniran sprejem'
      }, {
        image: 'modules/core/img/pgss/tree-pv.jpg',
        text: 'Polna vrsta'
      }, {
        image: 'modules/core/img/pgss/tree-cikel.jpg',
        text: 'Cikle'
      }];
    };
  
	}
]);