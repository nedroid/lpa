'use strict';

angular.module('users').controller('UsersController', ['$scope', '$http', '$stateParams', '$location', 'LpaUsers', 'Authentication', 'Messenger',
  function($scope, $http, $stateParams, $location, LpaUsers, Authentication, Messenger) {
    $scope.authentication = Authentication;
    
    $scope.userRoles = [
      {
        name: 'User',
        key: 'user',
        value: false
      },
      {
        name: 'Administrator',
        key: 'admin',
        value: false
      }
    ];

    $scope.create = function() {
      var lpaUser = new LpaUsers({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        username: this.username
      });

      lpaUser.$save(function(response) {
        $location.path('users/' + response._id);

        $scope.firstName = '';
        $scope.lastName = '';
        $scope.username = '';
        $scope.email = '';
      
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.update = function() {
      var lpaUser = $scope.lpaUser;

      lpaUser.roles = [];
      $scope.userRoles.forEach(function(role) {
        if(role.value) {
          lpaUser.roles.push(role.key);
        }
      }); 

      lpaUser.$update(function(lpaUser) {
        $scope.success = true;
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.remove = function(lpaUser) {
      var errorHandler = function (error) {
        Messenger.post(error.data.message, 'error');
      };
      if (lpaUser) {
        lpaUser.$remove(function() {
          for (var i in $scope.lpaUsers) {
            if ($scope.lpaUsers[i] === lpaUser) {
              $scope.lpaUsers.splice(i, 1);
            }
          } 
        }, errorHandler);
      } else {
        $scope.lpaUser.$remove(function() {
          $location.path('users');
        }, errorHandler);
      }
    };

    $scope.findOne = function() {
      $scope.lpaUser = LpaUsers.get({
        userId: $stateParams.userId
      }, function(lpaUser) {
        lpaUser.roles = lpaUser.roles || [];
        lpaUser.roles.forEach(function(role) {
          $scope.userRoles.forEach(function(role2) {
            if(role === role2.key) {
              role2.value = true;
            }
          }); 
        });
      });
    };

    $scope.list = function() {
      $scope.lpaUsers = LpaUsers.query();
    };

    $scope.edit = function(lpaUser) {
      $location.path('users/' + lpaUser._id);
    };

  }
]);