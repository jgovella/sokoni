angular.module('starter.services', [])
        .constant('authStatus', {
    loggedin: 1,
    loggedout: 0})
	
.factory('localstorage', ['$window', function($window) {
        return {
            set: function(key, value) {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        };
    }])
	
	        .factory('stockFunction', function(config, http, localstorage,setting) {
    return{
        updateInitialData: function() {
		      //get the local saved district id
		     var workLoc = setting.get(config.set_workLocation);
             var id = workLoc.district.id;
            var promise = http.request('GET',
                    //config.serverUrl + '/sample/get_data.php',
					config.serverUrl + '/sample/get_data.php?zone='+ id,
                    'Downloding agents/depot and officers....',
                    null
                    ).then(function(data) {
                if (data) {
                    //save locally brands and depots
                    localstorage.setObject(config.stockInitData,
                            {depots: data.depots,
                                officers: data.officers,
								brands: data.brands,
                                date: '16/04/2015'}
                    );
                }
            })
            return promise;
        },
        getInitLocalData: function() {
            return localstorage.getObject(config.stockInitData);
        }
    }
})
	        .factory('paymentFunction', function(config, http, localstorage,setting) {
    return{
        updateInitialData: function() {
		//get the local saved district id
		     var workLoc = setting.get(config.set_workLocation);
             var id = workLoc.district.id;
			 
            var promise = http.request('GET',
                    config.serverUrl + '/sample/get_payment_data.php?zone='+ id,
                    'Downloding agents/depot and accountants....',
                    null
                    ).then(function(data) {
                if (data) {
                    //save locally brands and depots
                    localstorage.setObject(config.paymentInitData,
                            {depots: data.depots,
							accountants: data.accountants,
                                date: '16/04/2015'}
                    );
                }
            })
            return promise;
        }
    }
})

	        .factory('saleFunction', function(config, http, localstorage,setting) {
    return{
        updateInitialData: function() {
		//get the local saved district id
		     var workLoc = setting.get(config.set_workLocation);
             var id = workLoc.district.id;
			 
            var promise = http.request('GET',
                    config.serverUrl + '/sample/get_customer.php?zone='+ id,
                    'Downloding Customer....',
                    null
                    ).then(function(data) {
                if (data) {
                    //save locally brands and depots
                    localstorage.setObject(config.saleInitData,
                            {customers: data.customers,
							 brands: data.brands,
                                date: '16/04/2015'}
                    );
                }
            })
            return promise;
        }
    }
})
        .factory('setting', function(localstorage, config) {
    return {
        //save objects of settings
        save: function(key, obj) {
            //get settings
            var setting = localstorage.getObject(config.setting);
            setting[key] = obj;
            localstorage.setObject(config.setting, setting);
        },
        get: function(key) {
            var setting = localstorage.getObject(config.setting);
            return setting[key];
        },
        reset: function(){
          localstorage.setObject(config.setting,{});  
        }
    };
})
        .factory('network', function($cordovaNetwork) {
    return {
        isOnline: function() {
            return $cordovaNetwork.isOnline();
        }
    };
})


   .factory('popup', function($ionicPopup) {
    return {
        alert: function(title, message, type) {
            $ionicPopup.alert({
                title: title,
                template: message
            });
        },
        confirm: function(message) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Warning',
                template: message
            });
            return confirmPopup;
        }
    };
})

.factory('GetUU', function() {
	var uploadurl = "http://localhost";
	return  {
    	query: function() {
		return uploadurl;
		}
	}
})

       .factory('config', function() {
	   
    return {
	    defaultRoute: '/app/home',
		session: 'session',
		credentials: 'credentials',
	    stockSave:'stockSaveData',
		stockInitData:'stockInitData',
		paymentInitData:'paymentInitData',
		saleSave:'saleSaveData',
        saleInitData:'saleInitData',
		fuelSave:'fuelSaveData',
		marketSave:'marketSaveData',
		activationSave:'activationSaveData',
		paymentSave:'paymentSaveData',
		set_workLocation: 'workingLocation',
        serverUrl: 'http://lsf.co.tz'
    };
})

        .factory('http', function(loading, $http, popup) {
    return {
        request: function(type, url, loadingMsg, data) {
            loading.show(loadingMsg);
            var promise = $http({
                method: type,
                url: url,
                data: data,
                headers: {
                    'Content-Type': undefined
                }
            }).then(function(response) {
                loading.hide();
                //return data
                return response.data;
            }, function(error) {
                console.log(error);
                loading.hide();
                //show popup
                popup.alert('Alert', 'Network error occured', 'error');
            });
            return promise;
        }

    }
})
        .factory('loading', function($ionicLoading) {
    return {
        show: function(loadingMsg) {
            $ionicLoading.show({
                template: loadingMsg
            });
        },
        hide: function() {
            $ionicLoading.hide();
        }
    };
})
   .factory('offline', function(localstorage, config) {
    return {
        saveCredential: function(credential) {
            localstorage.setObject(config.credentials, credential);
        },
        getCredential: function() {
            return localstorage.getObject(config.credentials);
        },
        hasUnsyncData: function(){
         var stock = [];
             stock = localstorage.getObject(config.stockSave);
             if(stock.length > 0)
                 return true;
            return false; 
        }
    };
})

        .factory('authService', function(http, session, config, popup, $location, $rootScope, authStatus, $ionicHistory, offline, $ionicModal) {
    var auth = {};

    auth.login = function(credentials) {
        var promise = http.request('POST',
                config.serverUrl + '/sample/login.php',
                'loggin....',
                credentials
                ).then(function(data) {
            if (data) {
                if (data.success === 1) {
                    //check if another user is loggining
                    var cr = offline.getCredential();
                    if ((cr.userid !== data.userId) && offline.hasUnsyncData()) {
                        //page explaining why cant loggin
                       $location.path('loginDenied');
                        return false;
                    }
                    session.create(data.id,data.userId, data.username, authStatus.loggedin);
                    credentials.userid = data.userId;
                    //save login credentials offline
                    offline.saveCredential(credentials);
                    $rootScope.$broadcast('login');
                    //remove this page from history
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    $location.path(config.defaultRoute);

                } else
                    popup.alert('Login failed', 'Please check your credentials!', 'error');
            }
        });
        return promise;
    };
    auth.offlineLogin = function(credentials) {
        var cr = offline.getCredential();
        if ((cr.username === credentials.username) && (cr.password === credentials.password)) {
            //set status to logged in
            var s = session.get();
            session.create(s.id,s.userid, s.username, authStatus.loggedin);
            $rootScope.$broadcast('login');
            $location.path(config.defaultRoute);
            //remove this page from history
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
        } else
        {
            popup.alert('Login failed', 'Please check your credentials!', 'error');
        }
    }
    auth.isAuthenticated = function() {
        var s = session.get();
        if (Object.keys(s).length > 0) {
            if (s.status === authStatus.loggedin)
                return true;
        }
        return false;
    };
    auth.logout = function() {
        var s = session.get();
        //update session to logout
        session.create(s.id,s.userid, s.username, authStatus.loggedout);
        //clear past history
        $ionicHistory.clearHistory();
        //remove current page from history
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        //redirect to login
        $location.path('/login');
    }
    return auth;

})
     .service('session', function(localstorage, config) {
    this.create = function(sessionId, userId, user_name, status) {
        //store user info 
        localstorage.setObject(config.session, {id: sessionId, userid: userId, username: user_name,
            status: status});
    };
    this.get = function() {
        return localstorage.getObject(config.session);
    };
    this.destroy = function() {
        localstorage.setObject(config.session, {});
    };
})

.factory('catagories',function(){
	var catagories = {};
	catagories.cast = [
	{
		value: "exeCatagory_001",
		text: "Konyagi Depot"
	},
	{
		value: "exeCatagory_002",
		text: "K-vant Agent"
	}
	];
	return catagories;
})




.factory('depot',function(){
	var depot = {};
	depot.cast = [
	{
		value: "exeCatagory_001",
		text: "Justine Govella"
	},
	{
		value: "exeCatagory_002",
		text: "Isaac Lyatuu"
	}
	];
	return depot;
})
.factory('agent',function(){
	var agent = {};
	agent.cast = [
	{
		value: "exeCatagory_001",
		text: "Daniel Mzungu"
	},
	{
		value: "exeCatagory_002",
		text: "Sadick Masomhe"
	}
	];
	return agent;
})
.factory('setNulls',function(){
	var setNulls = {};
	setNulls.cast = [
	{
		value: "00",
		text: "Select Agent/Depot"
	}	
	];
	return setNulls;
})

.filter('startFrom', function() {
 return function(input, start) {
 if(input) {
 start = +start; //parse to int
 return input.slice(start);
 }
 return [];
 }
})

        .factory('camera', ['$q', function($q) {

        return {
            getPicture: function(options) {
                var q = $q.defer();

                navigator.camera.getPicture(function(result) {
                    // Do any magic you need
                    q.resolve(result);
                }, function(err) {
                    q.reject(err);
                }, options);

                return q.promise;
            }
        };
    }])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Andrew Jostlin',
    lastText: 'Did you get the ice cream?',
    face: 'https://pbs.twimg.com/profile_images/491274378181488640/Tti0fFVJ.jpeg'
  }, {
    id: 3,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 4,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});

