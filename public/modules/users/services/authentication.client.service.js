'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window', function($window) {
	var auth = {
		user: $window.user,
    hasAuthorization: function(roles) {
      var 
      this_ = this,
      userRoles,
      hasAuthorization = false;
      
      roles = roles || [];
      userRoles = this_.user && this_.user.roles || [];
      if (!angular.isArray(roles)) {
        roles = [roles];    
      }

      roles.forEach(function(role) {
        var hasRole = false;
        userRoles.forEach(function(role2) {
          if(role === role2) {
             hasRole = true;
          }    
        });  
        if(!hasRole) {
          return (hasAuthorization = false);
        } else {
          hasAuthorization = true;
        }
      });
      
      return hasAuthorization;
    }
	};
	
	return auth;
}]);
