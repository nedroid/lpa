'use strict';

angular.module('protocols').service('Actions', ['$timeout', 'Messenger',
  function($timeout, Messenger) {
    
    this.nodeSettings = {
      visible: false
    };
    
    this.linkSettings = {
      visible: false
    };

    this.showNodeSettings = function(options) {
      var this_ = this;

      options = options || {};
      options.visible = true;
      
      $timeout(function() {
        this_.nodeSettings = options;
      }, 0);
    };

    this.hideNodeSettings = function() {
      var this_ = this;
      $timeout(function() {
        this_.nodeSettings.visible = false;
      }, 0);
    };

    this.showLinkSettings = function(options) {
      var this_ = this;

      options = options || {};
      options.visible = true;
      
      $timeout(function() {
        this_.linkSettings = options;
      }, 0);
    };

    this.hideLinkSettings = function() {
      var this_ = this;
      $timeout(function() {
        this_.linkSettings.visible = false;
      }, 0);
    };
  }
]);
