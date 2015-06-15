// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services','ngCordova'])

.run(function($ionicPlatform,authService, $location) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
  if (authService.isAuthenticated()) {
      
    } else {
        console.log('not logged in');
        $location.path('/login');
    }
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })
  
     .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
    })
         .state('loginDenied', {
        url: '/loginDenied',
        templateUrl: 'templates/loginDenied.html',
        controller: 'LoginCtrl'
    })

  .state('app.home', {
    url: "/home",
    views: {
      'menuContent': {
        templateUrl: "templates/home.html"
      }
    }
  })
              .state('app.setting', {
        url: '/setting',
        views: {
            'menuContent': {
                templateUrl: "templates/setting.html",
            }
        }
    })
  
    .state('app.payment', {
    url: "/payment",
    views: {
      'menuContent': {
        templateUrl: "templates/payment.html",
		controller: 'paymentCtrl'
      }
    }
  })

  .state('app.sales', {
    url: "/sales",
    views: {
      'menuContent': {
        templateUrl: "templates/sales.html",
		  controller: 'salesCtrl'
      }
    }
  })
    .state('app.customer',{
    url: "/customer",
    views: {
      'menuContent': {
        templateUrl: "templates/customer.html",
		 controller: 'customerCtrl'
      }
    }
  })
      .state('app.activation',{
    url: "/activation",
    views: {
      'menuContent': {
        templateUrl: "templates/activation.html",
		 controller: 'activationCtrl'
      }
    }
  })
      .state('app.localstorage',{
    url: "/localstorage",
    views: {
      'menuContent': {
        templateUrl: "templates/localstorage.html",
		 controller: 'localstorageCtr'
      }
    }
  })
        .state('app.Fuellocalstorage',{
    url: "/Fuellocalstorage",
    views: {
      'menuContent': {
        templateUrl: "templates/Fuellocalstorage.html",
		 controller: 'FuellocalstorageCtr'
      }
    }
  })
          .state('app.Marketlocalstorage',{
    url: "/Marketlocalstorage",
    views: {
      'menuContent': {
        templateUrl: "templates/Marketlocalstorage.html",
		 controller: 'MarketlocalstorageCtr'
      }
    }
  })
            .state('app.Activationlocalstorage',{
    url: "/Activationlocalstorage",
    views: {
      'menuContent': {
        templateUrl: "templates/Activationlocalstorage.html",
		 controller: 'ActivationlocalstorageCtr'
      }
    }
  })
          .state('app.Paymentlocalstorage',{
    url: "/Paymentlocalstorage",
    views: {
      'menuContent': {
        templateUrl: "templates/Paymentlocalstorage.html",
		 controller: 'PaymentlocalstorageCtr'
      }
    }
  })
        .state('app.fuel',{
    url: "/fuel",
    views: {
      'menuContent': {
        templateUrl: "templates/fuel.html",
		 controller: 'fuelCtrl'
      }
    }
  })
          .state('app.market',{
    url: "/market",
    views: {
      'menuContent': {
        templateUrl: "templates/market.html",
		 controller: 'marketCtrl'
      }
    }
  })
  .state('app.Saleslocalstorage',{
    url: "/Saleslocalstorage",
    views: {
      'menuContent': {
        templateUrl: "templates/Saleslocalstorage.html",
		 controller: 'SaleslocalstorageCtr'
      }
    }
  })
    .state('app.stock', {
      url: "/stock",
      views: {
        'menuContent': {
          templateUrl: "templates/stock.html",
		   controller: 'stockCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
