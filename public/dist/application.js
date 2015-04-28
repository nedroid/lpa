'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'lpa';
	var applicationModuleVendorDependencies = [
		'ngResource', 
		'ngAnimate', 
		'ui.router', 
		'ui.bootstrap', 
		'ui.utils',
		'pascalprecht.translate',
		'ui.select',
		'angulartics',
		'angulartics.google.analytics'
	];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();
'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('core');

'use strict';

ApplicationConfiguration.registerModule('protocols');

'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('users');
'use strict';

angular.module('core').config(['$analyticsProvider',
	function ($analyticsProvider) {
  		// turn off automatic tracking
  		$analyticsProvider.virtualPageviews(false);
	}
]);
'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		// Home state routing
		$stateProvider.
		state('home', {
			url: '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		});
	}
]);
'use strict';

angular.module('core').config(['$translateProvider', function($translateProvider) {
	$translateProvider.useStaticFilesLoader({
		prefix: 'i18n/locale-',
		suffix: '.json'
	});
	$translateProvider.preferredLanguage('si_SL');
}]);

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
'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function($scope, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
	}
]);
'use strict';

angular.module('core').directive('lpaTitle', [

	function() {
		return {
			restrict: 'E',
			transclude : true,
			scope: {
				code: '@',
			},
			templateUrl: 'modules/core/directives/views/title.client.view.html'
		};
	}

]);
'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

	function() {
		// Define a set of default roles
		this.defaultRoles = ['*'];

		// Define the menus object
		this.menus = {};

		// A private function for rendering decision 
		var shouldRender = function(user) {
			if (user) {
				if (!!~this.roles.indexOf('*')) {
					return true;
				} else {
					for (var userRoleIndex in user.roles) {
						for (var roleIndex in this.roles) {
							if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
								return true;
							}
						}
					}
				}
			} else {
				return this.isPublic;
			}

			return false;
		};

		// Validate menu existance
		this.validateMenuExistance = function(menuId) {
			if (menuId && menuId.length) {
				if (this.menus[menuId]) {
					return true;
				} else {
					throw new Error('Menu does not exists');
				}
			} else {
				throw new Error('MenuId was not provided');
			}

			return false;
		};

		// Get the menu object by menu id
		this.getMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			return this.menus[menuId];
		};

		// Add new menu object by menu id
		this.addMenu = function(menuId, isPublic, roles) {
			// Create the new menu
			this.menus[menuId] = {
				isPublic: isPublic || false,
				roles: roles || this.defaultRoles,
				items: [],
				shouldRender: shouldRender
			};

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			delete this.menus[menuId];
		};

		// Add menu item object
		this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Push new menu item
			this.menus[menuId].items.push({
				title: menuItemTitle,
				link: menuItemURL,
				menuItemType: menuItemType || 'item',
				menuItemClass: menuItemType,
				uiRoute: menuItemUIRoute || ('/' + menuItemURL),
				isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
				roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
				position: position || 0,
				items: [],
				shouldRender: shouldRender
			});

			// Return the menu object
			return this.menus[menuId];
		};

		// Add submenu item object
		this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
					// Push new submenu item
					this.menus[menuId].items[itemIndex].items.push({
						title: menuItemTitle,
						link: menuItemURL,
						uiRoute: menuItemUIRoute || ('/' + menuItemURL),
						isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
						roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
						position: position || 0,
						shouldRender: shouldRender
					});
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenuItem = function(menuId, menuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
					this.menus[menuId].items.splice(itemIndex, 1);
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeSubMenuItem = function(menuId, submenuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
					if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
						this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
					}
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		//Adding the topbar menu
		this.addMenu('topbar', true);
	}
]);
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
'use strict';

angular.module('protocols').run(['Menus',
  function(Menus) {
    Menus.addMenuItem('topbar', 'PROTOCOLS', 'protocols', 'dropdown', '/protocols(/create)?');
    Menus.addSubMenuItem('topbar', 'protocols', 'PROTOCOLS_LIST', 'protocols');
    Menus.addSubMenuItem('topbar', 'protocols', 'PROTOCOLS_NEW', 'protocols/create', false, false);
  }
]);
'use strict';

angular.module('protocols').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.
    state('listProtocols', {
      url: '/protocols',
      templateUrl: 'modules/protocols/views/list-protocols.client.view.html'
    }).
    state('createProtocol', {
      url: '/protocols/create',
      templateUrl: 'modules/protocols/views/create-protocol.client.view.html'
    }).
    state('viewProtocol', {
      url: '/protocols/:protocolId',
      templateUrl: 'modules/protocols/views/view-protocol.client.view.html'
    }).
    state('editProtocol', {
      url: '/protocols/:protocolId/edit',
      templateUrl: 'modules/protocols/views/edit-protocol.client.view.html'
    });
  }
]);
'use strict';

angular.module('protocols').controller('ProtocolsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Messenger', 'Protocols', 'Graph',
  function($scope, $stateParams, $location, Authentication, Messenger, Protocols, Graph) {
    $scope.authentication = Authentication;

    $scope.selected = {
      index: 0
    };

    $scope.init = function() {
      $scope.graphs = Graph.instances;
      Graph.empty({
        type: Graph.TYPE.PROCESSES,
        title: 'Protokol title'
      });
    };

    $scope.findOne = function() {
      $scope.protocol = Protocols.get({
        protocolId: $stateParams.protocolId
      });
    };

  }
]);
'use strict';

angular.module('protocols').directive('graph', [
  
  function() {
    return {
      restrict: 'EA',
      scope: {
        graphData: '=graphData'
      },
      templateUrl: 'modules/protocols/directives/views/graph.client.directive.view.html',
      controller: ['$scope', '$stateParams', '$location', 'Graph', 'Protocols', function($scope, $stateParams, $location, Graph, Protocols) {
        
        $scope.graph = new Graph.instance();

        $scope.save = function() {
          var protocol = new Protocols({
            title: 'TESTTT',
            processes: {},
            finalstatemachines: [],
          });

          Graph.instances.forEach(function(graph) {
            protocol.finalstatemachines.push(graph.data());
          });
          
          protocol.$save(function(response) {
            $location.path('protocols/' + response._id);
          }, function(errorResponse) {
            Messenger.post(errorResponse.data.message, 'error');
          });
        };

      }],
      link: function($scope, elm, attrs) {
        $scope.graph.init(elm[0].querySelector('.graph-content'), $scope.graphData);
      }
    };
  }
]);
'use strict';

angular.module('protocols').directive('protocol', [ 
  function() {
    return {
      restrict: 'EA',
      transclude: true,
      templateUrl: 'modules/protocols/directives/views/protocol.client.directive.view.html'
    };
  }
]);
'use strict';

angular.module('protocols').service('Graph', ['$filter', 'Messenger',
  function($filter, Messenger) {

    var 
    graphs = [],
    graphsCount = 0,

    radius = d3.scale.sqrt().range([0, 6]),
    
    LINKDISTANCE = 150,
    
    GRAPH = {
      TYPE: {
        PROCESSES: 'PROCESSES',
        FINAL_STATE_MACHNE: 'FINAL_STATE_MACHNE'
      }
    },

    NODES = {
      TYPE: {
        PROCESS: 'PROCESS',
        START_STATE: 'START_STATE',
        ACCEPT_STATE: 'ACCEPT_STATE'
      },
      SIZE: {
        PROCESS: 12,
        START_STATE: 12,
        ACCEPT_STATE: 12
      },
      COLOR: {
        PROCESS: '#FF0000',
        START_STATE: '#00FF00',
        ACCEPT_STATE: '#0000FF'
      }
    };

    function nodeData(node) {
      return node[0][0].parentNode.__data__;
    }

    function random(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    function label(i) {
      return i;
    }
  
    function uid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }     

    function Graph() {
      this.values = {

        type: null,
        title: null,

        force: null,
        
        svg: {
          nodes: [],
          links: [],
          selected: {
            node: null,
            link: null
          }
        },
        data: {
          nodes: [],
          links: []
        }
      };
      if(graphsCount > graphs.length) {
        graphs[graphs.length - 1] = this;
      } else {
        graphs.push(this);  
        graphsCount++;
      }
      
    }
    
    Graph.prototype.data = function() {
      var 
      this_ = this,
      statemachine = {
        title: 'StateMachine as',
        nodes: [],
        links: []
      };
        
      this_.values.data.nodes.forEach(function(node) {
        statemachine.nodes.push({
          label: node.label,
            //TODO remove default value
          type: node.type || 'PROCESS',
          x: node.x,
          y: node.y,
          size: node.size,
          id: node.index
        });
      });

      this_.values.data.links.forEach(function(link) {
        statemachine.links.push({
            //TODO remove default value
          label: link.label || 'TEST',
          source: link.source.index,
          target: link.target.index,          
        });
      });

      return statemachine;
    };

    Graph.prototype.build = function() {

      var this_ = this,
      
      nodeClicked = function(node) {
        if (this_.values.svg.selected.node) {
          this_.values.svg.selected.node.style('filter', '');
        }

        this_.values.svg.selected.node = d3.select(this)
         .select('circle')
         .style('filter', 'url(#selected-element)');
      },

      linkClicked = function(link) {
        if (this_.values.svg.selected.link) {
          this_.values.svg.selected.link.style('filter', '');
        }
        
        this_.values.svg.selected.link = d3.select(this)
          .select('line')
          .style('filter', 'url(#selected-element)');
      };
      
      // LINKS
      this_.values.svg.links = this_.values.svg.links
        .data(this_.values.force.links(), function(d) { 
          return d.source._id + '-' + d.target._id; 
        });

      this_.values.svg.links.enter().append('svg:g').attr('class', 'link').each(function(d) {
        
        d3.select(this)
          .append('svg:path')
          .attr('class', 'link')
          .attr('id', function(d) { return 'link-' + d.source._id + '-' + d.target._id; })
          .attr('marker-end', 'url(#end)');

        d3.select(this)
          .append('svg:text')
          .attr('class', 'linklabel')
          .style('font-size', '13px')
          .attr('x', LINKDISTANCE / 2)
          .attr('y', '-20')
          .attr('text-anchor', 'middle')
          .style('fill','#000')
          .append('textPath')
          .attr('xlink:href', function(d) { return '#link-' + d.source._id + '-' + d.target._id; })
          .text(function(d) { return d.label || 'no label'; });       
   
      });

      this_.values.svg.links.exit().remove();

      //NODES
      this_.values.svg.nodes = this_.values.svg.nodes
        .data(this_.values.force.nodes(), function(d) { return d._id; });

      this_.values.svg.nodes.enter()
        .append('svg:g')
        .attr('class', 'node')
        .each(function(d) {

          d3.select(this)
            .append('svg:circle')
            .attr('class', function(d) { return 'node ' + d._id; })
            .attr('r', function(d) { return radius(d.size); });

          d3.select(this)
            .append('svg:text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .text(function(d, i) { return d.label || i; }); 
        
          d3.select(this)
            .on('click', nodeClicked);

          d3.select(this)
            .call(this_.values.force.drag);
        });

      this_.values.svg.nodes.exit()
        .remove();

      this_.values.force.start();

    };

    Graph.prototype.nodeLinks = function(nodeId) {
      var links = [];
      this.values.data.links.forEach(function(link) {
        if (link.source._id === nodeId || link.target._id === nodeId) {
          links.push(link);
        }
      });
      return links;
    };
    
    Graph.prototype.addLink = function () {

      var this_ = this;
      
      window.temp = window.temp || {};

      if(!this_.values.svg.selected.node) {
        Messenger.post('Select source node and click add link.', 'info');
        return;
      } else if(window.temp.sourceNode) {
        this_.values.data.links.push({
          source: nodeData(window.temp.sourceNode), 
          target: nodeData(this_.values.svg.selected.node)
        });
        window.temp.sourceNode = null;
        this_.build();
        Messenger.post('Link added.', 'success');
      } else {
        window.temp.sourceNode = this_.values.svg.selected.node;
        Messenger.post('Select target node and click add link.', 'info');
      }
    };

    Graph.prototype.addNode = function (type) {
      if (!type) {
        Messenger.post('No type selected!', 'error');
        return;
      } 
      var
      this_ = this,
      node = {
        _id: uid(),
        label: label(this_.values.data.nodes.length + 1),
        size: NODES.SIZE[type],
        type: NODES.TYPE[type]
      };

      if(this_.values.svg.selected.node) {  
        node.x = nodeData(this_.values.svg.selected.node).x + random(-15, 15);
        node.y = nodeData(this_.values.svg.selected.node).y + random(-15, 15);

        this_.values.data.links.push({
          source: nodeData(this_.values.svg.selected.node), 
          target: node
        });
      }

      this_.values.data.nodes.push(node);

      if(this_.values.type === GRAPH.TYPE.PROCESSES) {
        createNewGraph({
          type: GRAPH.TYPE.FINAL_STATE_MACHNE,
          title: label(graphs.length)
        });  
      }
      
      this_.build();
    };

    Graph.prototype.removeNode = function () {
      var this_ = this;
      if (!this_.values.svg.selected.node) {
        Messenger.post('NO_SELECTED_NODE', 'error');
        return;
      }
      var 
      nodeId = nodeData(this_.values.svg.selected.node)._id,
      nodeIndex,
      nodeLinksIndexes = [];
      this_.values.data.nodes.forEach(function(node, index) {
        if(node._id === nodeId) {
          nodeIndex = index;
        }
      });

      this_.values.data.nodes.splice(nodeIndex, 1);
      
      this_.values.data.links.forEach(function(link, index) { 
        this_.nodeLinks(nodeId).forEach(function(nodeLink) {  
          if(nodeLink === link) {
            nodeLinksIndexes.push(index);
          }
        });
      });
      nodeLinksIndexes
        .sort(function(a, b) { return b - a; })
        .forEach(function(linkIndex) {
          this_.values.data.links.splice(linkIndex, 1);
        });

      removeGraph(nodeIndex + 1);
      this_.values.svg.selected.node = null;
      this_.build();
    };
    
    Graph.prototype.init = function(element, options) {
      options = options || {};
      
      var 
      this_ = this,
      
      width = 960,
      height = 500,

      svg = d3.select(element).append('svg')
        .attr('width', '100%')
        .attr('height', '100%'),
      
      defs = svg.append('svg:defs'),

      filter, 
      feMerge,

      tick = function() {
        this_.values.svg.nodes.attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'; 
        });

        this_.values.svg.links.selectAll('path').attr('d', function(d) {
          var
          dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
          return 'M' + d.source.x + ',' +  d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
        });
      };

      filter = defs.append('svg:filter')
        .attr('id', 'selected-element');
      filter.append('svg:feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 3)
        .attr('result', 'blur');
      filter.append('svg:feOffset')
        .attr('in', 'blur')
        .attr('result', 'offsetBlur');
      feMerge = filter.append('svg:feMerge');
      feMerge.append('svg:feMergeNode')
        .attr('in', 'offsetBlur');
      feMerge.append('svg:feMergeNode')
        .attr('in', 'SourceGraphic');

      defs.selectAll('marker')
        .data(['end'])
        .enter().append('svg:marker')
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

      this_.values.data.nodes = [];
      this_.values.data.links = [];

      this_.values.force = d3.layout.force()
        .nodes(this_.values.data.nodes)
        .links(this_.values.data.links)
        .charge(-400)
        .linkDistance(LINKDISTANCE)
        .size([width, height])
        .on('tick', tick);

      this_.values.svg.nodes = svg.selectAll('g.node');
      this_.values.svg.links = svg.selectAll('g.link');


      this_.values.type = options.type;
      this_.values.title = options.title;

      options.nodes = options.nodes || [];
      options.nodes.forEach(function(node) {
        this_.values.data.nodes.push({
          _id: node._id,
          label: node.label,
          size: node.size,
          type: node.type,
          x: node.x,
          y: node.y
        });
      });
      
      options.links = options.links || [];
      options.links.forEach(function(link, sourceNode, targetNode) {
        sourceNode = null;
        targetNode = null;
        this_.values.data.nodes.forEach(function(node) {
          if(node._id === link.source) {
            sourceNode = node;
          }
          if(node._id === link.target) {
            targetNode = node;  
          }
        });       
        this_.values.data.links.push({
          label: link.label,
          source: sourceNode,
          target: targetNode
        });
      });

      this_.build();
    };
    
    function createNewGraph(options) {
      graphsCount += 2;
      graphs.push(options);
    }

    function removeGraph(graphIndex) {
      graphs.splice(graphIndex, 1);
      graphsCount--;
    }

    return {
      instance: Graph,
      instances: graphs,
      empty: createNewGraph,
      NODES: NODES,
      TYPE: GRAPH.TYPE
    };
  }
]);

'use strict';

angular.module('protocols').factory('Protocols', ['$resource',
  function($resource) {
    return $resource('protocols/:protocolId', {
      protocolId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
	function($httpProvider) {
		// Set the httpProvider "not authorized" interceptor
		$httpProvider.interceptors.push(['$q', '$location', 'Authentication',
			function($q, $location, Authentication) {
				return {
					responseError: function(rejection) {
						switch (rejection.status) {
							case 401:
								// Deauthenticate the global user
								Authentication.user = null;

								// Redirect to signin page
								$location.path('signin');
								break;
							case 403:
								// Add unauthorized behaviour 
								break;
						}

						return $q.reject(rejection);
					}
				};
			}
		]);
	}
]);
'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function($stateProvider) {
		// Users state routing
		$stateProvider.
		state('profile', {
			url: '/settings/profile',
			templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
		}).
		state('password', {
			url: '/settings/password',
			templateUrl: 'modules/users/views/settings/change-password.client.view.html'
		}).
		state('accounts', {
			url: '/settings/accounts',
			templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
		}).
		state('signup', {
			url: '/signup',
			templateUrl: 'modules/users/views/authentication/signup.client.view.html'
		}).
		state('signin', {
			url: '/signin',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		}).
		state('forgot', {
			url: '/password/forgot',
			templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
		}).
		state('reset-invalid', {
			url: '/password/reset/invalid',
			templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
		}).
		state('reset-success', {
			url: '/password/reset/success',
			templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
		}).
		state('reset', {
			url: '/password/reset/:token',
			templateUrl: 'modules/users/views/password/reset-password.client.view.html'
		});
	}
]);
'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		$scope.signin = function() {
			$http.post('/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
	function($scope, $stateParams, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		//If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		// Submit forgotten password account id
		$scope.askForPasswordReset = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/forgot', $scope.credentials).success(function(response) {
				// Show user success message and clear form
				$scope.credentials = null;
				$scope.success = response.message;

			}).error(function(response) {
				// Show user error message and clear form
				$scope.credentials = null;
				$scope.error = response.message;
			});
		};

		// Change user password
		$scope.resetUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.passwordDetails = null;

				// Attach user profile
				Authentication.user = response;

				// And redirect to the index page
				$location.path('/password/reset/success');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		// Check if there are additional accounts 
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window', function($window) {
	var auth = {
		user: $window.user
	};
	
	return auth;
}]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('users', {}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);