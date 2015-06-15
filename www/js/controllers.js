angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, authService, session, $rootScope) {
 //logout  
    $scope.logout = function() {
        authService.logout();
    };

    $scope.getUser = function() {
        var s = session.get();
        console.log(s);
        $rootScope.userid = s.userid;
        $rootScope.username = s.username;
        $scope.username = $rootScope.username;
    }
    
    //get user info 
    $scope.getUser();
    //listen to new userdetails
    $rootScope.$on('login', function(event, args) {
        //get user
        $scope.getUser()
    });

})

//login controller
        .controller('LoginCtrl', function($scope, authService, session, offline) {
    $scope.credential = {};
    $scope.offlineLoging = false;
    var s = session.get();
    var storedCred = offline.getCredential();
    //check if session exists
    if (Object.keys(s).length > 0) {
        //check data integrity
        if (s.userid === storedCred.userid) {
            $scope.username = s.username;
            $scope.offlineLoging = true;
        }
    }
    $scope.oflineLogin = function() {
        authService.offlineLogin($scope.credential);
    }
    $scope.login = function() {

        //login if no internet or server is down
        authService.login($scope.credential);
    };
})
.controller('stockCtrl', function($scope,$ionicLoading,http,$cordovaNetwork,$ionicPopup,network, $timeout,$ionicModal,$rootScope,config,localstorage,setting) {
var count=0;
//form model
      $scope.details = {};
      //disable officer choice
      $scope.Officerdisabled = true;
    //brand elements
	 $scope.brandElemnts = [{count: count, detail: '', quantity: ''}];
    //depots from db
    $scope.depots = [{}];
    $scope.brands = [{}];
	
	
	  //form data model for displaying error message when nothan is filled in
    $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    }	
	    $rootScope.$on('stock-details', function(event, args) {
        //get working location
        var workLoc = setting.get(config.set_workLocation);
        $scope.WRegion = workLoc.region.name;
        $scope.WDistrict = workLoc.district.name;
    });

			
    $scope.getInitialData = function() {
		//getting district id 
			var workLoc = setting.get(config.set_workLocation);
			if(workLoc)
			{
			$scope.WRegion=workLoc.region.name;
			$scope.WDistrict=workLoc.district.name;
			
            var id = workLoc.district.id;
			 
        $scope.online = network.isOnline();
        if ($scope.online) {
            $scope.isOffline = false;
            http.request('GET',
					config.serverUrl + '/sample/get_data.php?zone='+ id,
                    'getting Depots/Agents....',
                    null
                    ).then(function(data) {
                if (data) {
                    console.log(data);
                    $scope.depots = data.depots;
                    $scope.officers = data.officers;
					$scope.brands = data.brands;
                    //save locally brands and depots
                    localstorage.setObject(config.stockInitData,
                            {depots: $scope.depots,
							officers: $scope.officers,
                            brands: $scope.brands,
                                date: '16/04/2015'}
                    );
                }
            });
			
        } else if (!$scope.online) {
            $scope.isOffline = true;
            //check for local data for brands and depots 
            var stockData = localstorage.getObject(config.stockInitData);
            //console.log(stockData);
            if (stockData) {
                $scope.depots = stockData.depots;
				$scope.brands = stockData.brands;
                
            }
        }

        //check if init data found
       if ($scope.depots.length > 0)
           $scope.initDataFound = true;
       else
        $scope.initDataFound = false;
		}//end of if workloc is available
    };
	
	$scope.getLocalSavedData = function() {
        var saved = localstorage.getObject(config.stockSave);
        if (saved)
            $scope.localSavedData = saved;
    };
	
		 
		 //get officers
	     $scope.getOfficers = function(selected) {
        if ($scope.online) {
            http.request('GET',
                    config.serverUrl + '/sample/get_officer.php?id=' + selected.id,
                    'getting Officers....',
                    null
                    ).then(function(data) {

                $scope.officers = data;
			});
        } else {
            //get local
            var saved = localstorage.getObject(config.stockInitData);
            //select only officers from selected
            var officers = saved.officers;
            // re initialize officer
            $scope.officers = [];
            angular.forEach(officers, function(elem) {
                console.log(elem.depot_id);
                console.log(selected);
                if (elem.depot_id === selected.id) {
                    $scope.officers.push(elem);
                }
            });
        }
        //enable officers field
        if ($scope.officers.length > 0)
            $scope.Officerdisabled = false;

        console.log($scope.officers);
    };
	
	 $scope.newItem = function($event) {
        count++;
        $scope.brandElemnts.push({count: count, detail: '', quantity: ''});
        $event.preventDefault();
    };
	

	//preview model
	$ionicModal.fromTemplateUrl('templates/stockPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });
	//validation
	    $scope.preview = function($form) {
        console.log($form.$invalid);
        if (!$form.$invalid)
            $scope.modal.show();
        else {
            $scope.message = 'Fill all required fields';
            $scope.poptitle = 'Error';
            $scope.popup();
        }
    }
    $scope.closePreview = function() {
        $scope.modal.hide();
    }
	
	  $scope.reset = function() {
        //disable officer choice
        $scope.Officerdisabled = true;
        //reset form model
        //$scope.details = angular.copy({serviceDate: ''});
        //reset brands array
        $scope.brandElemnts = angular.copy([{count: count, detail: '', quantity: ''}]);
    }
	
   $scope.save =  function(){
   //hide preview modal
        $scope.closePreview();
   //this brand array carries the value of brand and quantity
   $scope.details.brand = $scope.brandElemnts;
   $scope.details.userId = $rootScope.userid;
     console.log($scope.details);
	 
		 //save data into the databases
		$scope.online = network.isOnline();
        if ($scope.online) {
            http.request('POST',
                    config.serverUrl + '/sample/data.php',
                    'Saving....',
                    $scope.details
                    ).then(function(data) {

                if (data.success === 1) {
                    //unset data
                    $scope.reset();
                    $scope.message = 'Stock data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
        } else if (!$scope.online) {
            //save offline
            var storage = [];
            var stockSave = [];
            //check if it exists
            storage = localstorage.getObject(config.stockSave);
            console.log(storage);
            if (storage.length > 0) {
                //add new item
                storage.push($scope.details);
                stockSave = storage;
            }
            else
                stockSave.push($scope.details);

            console.log($scope.stockSave);
            //save it
            localstorage.setObject(config.stockSave, stockSave);
            //unset data
            $scope.reset();
            //get local saved data
            $scope.getLocalSavedData();

        }
   }
     /** functions to load when controller starts **/
    //get initial data at the begining
	
    $scope.getInitialData();
    //check if there is data stored locally
    $scope.getLocalSavedData();
})

.controller('salesCtrl', function($scope,$ionicLoading,http,$cordovaNetwork,$ionicPopup,setting, $timeout,$ionicModal,$rootScope,config,localstorage) {
var count=0;
//form model
      $scope.details = {};
    //product elements
	 $scope.brandElemnts = [{count: count, detail: '', quantity: '',price:''}];
    //depots from db
    $scope.customers = [{}];
    $scope.brands = [{}];
	
	  //form data model for displaying error message when nothing is filled in
    $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    }

  $rootScope.$on('stock-details', function(event, args) {
        //get working location
        var workLoc = setting.get(config.set_workLocation);
        $scope.WRegion = workLoc.region.name;
        $scope.WDistrict = workLoc.district.name;
    });
	
    $scope.getInitialData = function() {
        //  check if there is network, if not allow user to post offline
		
		//getting district id 
			var workLoc = setting.get(config.set_workLocation);	
			if(workLoc)
			{
			$scope.WRegion = workLoc.region.name;
           $scope.WDistrict = workLoc.district.name;
             var id = workLoc.district.id;
			 
        $scope.online =$cordovaNetwork.isOnline();
        if ($scope.online) {
            $scope.isOffline = false;
            http.request('GET',
			        config.serverUrl + '/sample/get_customer.php?zone='+ id,
                    'Downloading the latest customer names....',
                    null
                    ).then(function(data) {
                if (data) {
                    console.log(data);
                    $scope.customers = data.customers;
					$scope.brands = data.brands;
					
                    //save locally customer's names
                    localstorage.setObject(config.saleInitData,
                            {customers: $scope.customers,
                              brands: $scope.brands,
                                date: '16/04/2015'}
                    );
                }
            });
			
        } else if (!$scope.online) {
            $scope.isOffline = true;
            //check for local data for brands and depots 
            var saleData = localstorage.getObject(config.saleInitData);
            //console.log(stockData);
            if (saleData) {
                $scope.customers = saleData.customers;
				$scope.brands = saleData.brands;

            }

        }

        //check if init data found
        if ($scope.customers.length > 0 )
            $scope.initDataFound = true;
        else
            $scope.initDataFound = false;
			}

    };
	
	$scope.getLocalSavedData = function() {
        var saved = localstorage.getObject(config.saleSave);
        if (saved)
            $scope.localSavedData = saved;
    };
	

	
	 $scope.newItem = function($event) {
        count++;
        $scope.brandElemnts.push({count: count, detail: '', quantity: '',price:''});
        $event.preventDefault();
    };
	

	//preview model
	$ionicModal.fromTemplateUrl('templates/salePreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });
	//validation
	    $scope.preview = function($form) {
        console.log($form.$invalid);
        if (!$form.$invalid)
            $scope.modal.show();
        else {
            $scope.message = 'Fill all required fields';
            $scope.poptitle = 'Error';
            $scope.popup();
        }
    }
    $scope.closePreview = function() {
        $scope.modal.hide();
    }
	
	  $scope.reset = function() {
        //disable officer choice
        //$scope.Officerdisabled = true;
        //reset form model
        $scope.details = angular.copy({cash: '',mpesaFactory: '',mpesaSales: ''});
        //reset brands array
        $scope.brandElemnts = angular.copy([{count: count, detail: '', quantity: '',price: ''}]);
    }
	
   $scope.save =  function(){
   //hide preview modal
        $scope.closePreview();
   //this brand array carries the value of brand and quantity
   $scope.details.brand = $scope.brandElemnts;
     console.log($scope.details);
	 
		 //save data into the databases
        if ($scope.online) {
            http.request('POST',
                    config.serverUrl + '/sample/save_sales_data.php',
                    'Saving Sales Data....',
                    $scope.details
                    ).then(function(data) {

                if (data.success === 1) {
                    //unset data
                    $scope.reset();
                    $scope.message = 'Sales data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
        } else if (!$scope.online) {
            //save offline
            var storage = [];
            var saleSave = [];
            //check if it exists
            storage = localstorage.getObject(config.saleSave);
            console.log(storage);
            if (storage.length > 0) {
                //add new item
                storage.push($scope.details);
                saleSave = storage;
            }
            else
                saleSave.push($scope.details);

            console.log($scope.saleSave);
            //save it
            localstorage.setObject(config.saleSave, saleSave);
            //unset data
            $scope.reset();
            //get local saved data
            $scope.getLocalSavedData();

        }
   }
     /** functions to load when controller starts **/
    //get initial data at the begining
	
    $scope.getInitialData();
    //check if there is data stored locally
    $scope.getLocalSavedData();
})

.controller('paymentCtrl', function($scope,$ionicLoading,http,$cordovaNetwork,$ionicPopup,camera,$timeout,$ionicModal,config,localstorage,$rootScope,setting){
//form model
      $scope.details = {};
      //disable officer choice
      $scope.accountantdisabled = true;
    //brand elements
    $scope.depots = [{}];	
	  //form data model for displaying error message when nothan is filled in
    $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    }	
    $scope.getInitialData = function() {
	
	//getting district id 
			var workLoc = setting.get(config.set_workLocation);	
			if(workLoc)
			{
			$scope.WRegion = workLoc.region.name;
           $scope.WDistrict = workLoc.district.name;
             var id = workLoc.district.id;
        //  check if there is network, if not allow user to post offline
        $scope.online =$cordovaNetwork.isOnline();
        if ($scope.online) {
            $scope.isOffline = false;
            http.request('GET',
                    config.serverUrl + '/sample/get_payment_data.php?zone='+ id,
                    'getting Depots and agents....',
                    null
                    ).then(function(data) {
                if (data) {
                    console.log(data);
                    $scope.depots = data.depots;
                    $scope.accountants = data.accountants;
                    //save locally brands and depots
                    localstorage.setObject(config.paymentInitData,
                            {depots: $scope.depots,
							accountants: $scope.accountants,
                                date: '16/04/2015'}
                    );
                }
            });
			
        } else if (!$scope.online) {
            $scope.isOffline = true;
            //check for local data for brands and depots 
            var paymentData = localstorage.getObject(config.paymentInitData);
            //console.log(stockData);
            if (paymentData) {
                $scope.depots = paymentData.depots;
				//$scope.brands = stockData.brands;
                
            }

        }

        //check if init data found
        if ($scope.depots.length > 0)
            $scope.initDataFound = true;
        else
            $scope.initDataFound = false;
			}//end of if workloc

    };
	
	$scope.getLocalSavedData = function() {
        var saved = localstorage.getObject(config.paymentSave);
        if (saved)
            $scope.localSavedData = saved;
    };
	
		 
		 //get accountants
	     $scope.getAccountant = function(selected) {

        if ($scope.online) {
            http.request('GET',
                    config.serverUrl + '/sample/get_accountant.php?id=' + selected.id,
                    'getting Accountant....',
                    null
                    ).then(function(data) {

                $scope.accountants = data;
			});
        } else {
            //get local
            var saved = localstorage.getObject(config.paymentInitData);
            //select only accountants from selected
            var accountants = saved.accountants;
            // re initialize accountants
            $scope.accountants = [];
            angular.forEach(accountants, function(elem) {
                console.log(elem.depot_id);
                console.log(selected);
                if (elem.depot_id === selected.id) {
                    $scope.accountants.push(elem);
                }
            });
        }
        //enable officers field
        if ($scope.accountants.length > 0)
            $scope.accountantdisabled = false;

        console.log($scope.accountants);
    };
	
	
	//preview model
	$ionicModal.fromTemplateUrl('templates/paymentPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });
	//validation
	    $scope.preview = function($form) {
        console.log($form.$invalid);
        if (!$form.$invalid)
            $scope.modal.show();
        else {
            $scope.message = 'Fill all required fields';
            $scope.poptitle = 'Error';
            $scope.popup();
        }
    }
    $scope.closePreview = function() {
        $scope.modal.hide();
    }
	//camera
    $scope.getPhoto = function() {
        camera.getPicture({
            quality: 75,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        }).then(function(imageURI) {
            $scope.details.officerImage = imageURI;
            console.log($scope.details.officerImage);
        }, function(err) {
            console.err(err);
        });
    };
    //preview image
    //modal for image
    $ionicModal.fromTemplateUrl('image.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.imageModal = modal;
    });
    $scope.viewPhoto = function() {
        console.log($scope.details.officerImage);
        $scope.imageModal.show()
    }
    $scope.imageDelete = function() {
        $scope.details.officerImage = null;
    }
	
	  $scope.reset = function() {
        //disable officer choice
        $scope.accountantdisabled = true;
        //reset form model
        $scope.details = angular.copy({depot: '',accountant:'',cash:'',bank:'',cheque:'',mpesa:'',amount:'',reference:''});
		$scope.cashbox=[];
		$scope.bankbox=[];
		$scope.chequebox=[];
		$scope.mpesabox=[];
        //reset brands array
       // $scope.brandElemnts = angular.copy([{count: count, detail: '', quantity: ''}]);
    }
	
   $scope.save =  function(){
   //hide preview modal
        $scope.closePreview();
   //this brand array carries the value of brand and quantity
   //$scope.details.brand = $scope.brandElemnts;
     console.log($scope.details);
	 
		 //save data into the databases
        if ($scope.online) {
            http.request('POST',
                    config.serverUrl + '/sample/save_payment.php',
                    'Saving Payment....',
                    $scope.details
                    ).then(function(data) {

                if (data.success === 1) {
                    //unset data
                    $scope.reset();
                    $scope.message = 'Payment data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
        } else if (!$scope.online) {
            //save offline
            var storage = [];
            var paymentSave = [];
            //check if it exists
            storage = localstorage.getObject(config.paymentSave);
            console.log(storage);
            if (storage.length > 0) {
                //add new item
                storage.push($scope.details);
                paymentSave = storage;
            }
            else
                paymentSave.push($scope.details);

            console.log($scope.paymentSave);
            //save it
            localstorage.setObject(config.paymentSave, paymentSave);
            //unset data
            $scope.reset();
            //get local saved data
            $scope.getLocalSavedData();

        }
   }
     /** functions to load when controller starts **/
    //get initial data at the begining
	
    $scope.getInitialData();
    //check if there is data stored locally
    $scope.getLocalSavedData();


  
})

.controller('PopupCtrl', function($scope, $location) {
$scope.$location =$location;
})

.controller('customerCtrl', function($scope,$ionicLoading,http,network,$cordovaNetwork,$ionicPopup, $timeout,setting,$ionicModal,config,localstorage) {

$scope.details={};
$scope.zonedisabled = true;
	
    $scope.getInitialData = function() {
			 
        $scope.online = network.isOnline();
		//getting region
        if ($scope.online) {
            $scope.isOffline = false;
            http.request('GET',
					config.serverUrl + '/sample/get_region.php',
                    'getting Region....',
                    null
                    ).then(function(data) {
                if (data) {
                    console.log(data);
                    $scope.regions = data;
                }
            });
			
        }
    };
	
	 //get district
	     $scope.getZones = function(selected) {
        if ($scope.online) {
            http.request('GET',
                    config.serverUrl + '/sample/get_district.php?id=' + selected.id,
                    'getting zone....',
                    null
                    ).then(function(data) {

                $scope.zones = data;
			});
        }
        $scope.zonedisabled = false;
        console.log($scope.zones);
    };
	  //form data model for displaying error message when nothan is filled in
    $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    }		

	
	//preview model
	$ionicModal.fromTemplateUrl('templates/customerPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });
	//validation
	    $scope.preview = function($form) {
        console.log($form.$invalid);
        if (!$form.$invalid)
            $scope.modal.show();
        else {
            $scope.message = 'Fill all required fields';
            $scope.poptitle = 'Error';
            $scope.popup();
        }
    }
    $scope.closePreview = function() {
        $scope.modal.hide();
    }
	
	  $scope.reset = function() {
        //disable officer choice
        //reset form model
        $scope.details = angular.copy({customer: '',location:'',email:'',phone:'',outlet:'',year:'',territory:''});
        //reset brands array
        //$scope.brandElemnts = angular.copy([{count: count, detail: '', quantity: ''}]);
    }
	
   $scope.save =  function(){
   //hide preview modal
        $scope.closePreview();
     console.log($scope.details);
	 
		 //save data into the databases
		 $scope.online = $cordovaNetwork.isOnline();
        if ($scope.online) {
            http.request('POST',
                    config.serverUrl + '/sample/customer_new.php',
                    'Saving New customer data....',
                    $scope.details
                    ).then(function(data) {

                if (data.success === 1) {
                    //unset data
                    $scope.reset();
                    $scope.message = 'New Customer data added Successfully';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
        } else if (!$scope.online) {
            
          $scope.message = 'No Internet Connection';
          $scope.poptitle = 'Error';
		  $scope.popup();
        }
   }
   $scope.getInitialData();

})
.controller('fuelCtrl', function($scope,$ionicLoading,http,$cordovaNetwork,$ionicPopup, $timeout,camera,loading,$cordovaGeolocation,$ionicModal,config,localstorage) {

//check network availability

$scope.details={};


	$scope.getLocalSavedData = function() {
        var saved = localstorage.getObject(config.fuelSave);
        if (saved)
            $scope.localSavedData = saved;
    };
	
	  //form data model for displaying error message when nothan is filled in
    $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    }		

	
	//preview model
	$ionicModal.fromTemplateUrl('templates/fuelPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });
	//validation
	    $scope.preview = function($form) {
        console.log($form.$invalid);
        if (!$form.$invalid)
            $scope.modal.show();
        else {
            $scope.message = 'Fill all required fields';
            $scope.poptitle = 'Error';
            $scope.popup();
        }
    }
    $scope.closePreview = function() {
        $scope.modal.hide();
    }
	
	  $scope.reset = function() {
        //disable officer choice
        //reset form model
        $scope.details = angular.copy({reg: '',mileage:'',litre:'',cost:'',amount:''});
        //reset brands array
        //$scope.brandElemnts = angular.copy([{count: count, detail: '', quantity: ''}]);
    }
	
	
	//camera
    $scope.getPhoto = function() {
        camera.getPicture({
            quality: 75,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        }).then(function(imageURI) {
            $scope.details.officerImage = imageURI;
            console.log($scope.details.officerImage);
        }, function(err) {
            console.err(err);
        });
    };
    //preview image
    //modal for image
    $ionicModal.fromTemplateUrl('image.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.imageModal = modal;
    });
    $scope.viewPhoto = function() {
        console.log($scope.details.officerImage);
        $scope.imageModal.show()
    }
    $scope.imageDelete = function() {
        $scope.details.officerImage = null;
    }
	
	$scope.getLocation = function() {
        loading.show('fetch location...');
        var posOptions = {timeout: 20000, enableHighAccuracy: false};
        $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function(position) {

            $scope.details.coordinates = {latitude: position.coords.latitude,
                longitude: position.coords.longitude};
				
            loading.hide();
        }, function(err) {
            loading.hide();
            // error
            popup.alert('error',' Please Turn on Location/check internet', 'error');
        });
    }
	
	    //modal for location
    $ionicModal.fromTemplateUrl('location.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.locationModal = modal;
    });
    $scope.viewLocation = function() {
        console.log($scope.details.coordinates);
        $scope.locationModal.show()
    }
	
   $scope.save =  function(){
   //hide preview modal
        $scope.closePreview();
     console.log($scope.details);
	 
		 //save data into the databases
		 $scope.online = $cordovaNetwork.isOnline();
        if ($scope.online) {
            http.request('POST',
                    config.serverUrl + '/sample/fuel_data.php',
                    'Saving fuel data....',
                    $scope.details
                    ).then(function(data) {

                if (data.success === 1) {
                    //unset data
                    $scope.reset();
                    $scope.message = 'Fuel data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
        } else if (!$scope.online) {
            //save offline
            var storage = [];
            var fuelSave = [];
            //check if it exists
            storage = localstorage.getObject(config.fuelSave);
            console.log(storage);
            if (storage.length > 0) {
                //add new item
                storage.push($scope.details);
                fuelSave = storage;
            }
            else
                fuelSave.push($scope.details);

            console.log($scope.fuelSave);
            //save it
            localstorage.setObject(config.fuelSave, fuelSave);
            //unset data
            $scope.reset();
            //get local saved data
            $scope.getLocalSavedData();

        }
   }
   //check if there is data saved locally
   $scope.getLocalSavedData();

})
.controller('marketCtrl', function($scope,$ionicLoading,http,$cordovaNetwork,$ionicPopup,setting,$cordovaGeolocation,$timeout,loading,$ionicModal,$rootScope,config,popup,localstorage) {

$scope.details={};
$scope.customers = [{}]; 
			
	    $scope.getData = function() {
		
		  //getting working places
			var workLoc = setting.get(config.set_workLocation);
			if(workLoc)
			{
			$scope.WRegion=workLoc.region.name;
			$scope.WDistrict=workLoc.district.name;
			}
		
		//get customers saved locally
            var saleData = localstorage.getObject(config.saleInitData);
            //console.log(saleData);
            if (saleData) {
                $scope.customers = saleData.customers;	
            }
			
    };

	$scope.getLocalSavedData = function() {
        var saved = localstorage.getObject(config.marketSave);
        if (saved)
            $scope.localSavedData = saved;
    };
		
	  //form data model for displaying error message when nothan is filled in
    $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    }		

	
	//preview model
	$ionicModal.fromTemplateUrl('templates/marketPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });
	//validation
	    $scope.preview = function($form) {
        console.log($form.$invalid);
        if (!$form.$invalid)
            $scope.modal.show();
        else {
            $scope.message = 'Fill all required fields';
            $scope.poptitle = 'Error';
            $scope.popup();
        }
    }
    $scope.closePreview = function() {
        $scope.modal.hide();
    }
	
	  $scope.reset = function() {
        //disable officer choice
        //reset form model
        $scope.details = angular.copy({customer: '',kvant:'',kvanta:'',kiroba:'',kirobaa:'',van:'',vana:'',konyagi:'',konyagia:'',valuer:'',valuera:''});
        //reset brands array
        //$scope.brandElemnts = angular.copy([{count: count, detail: '', quantity: ''}]);
    }
	 $scope.getLocation = function() {
        loading.show('fetch location...');
        var posOptions = {timeout: 20000, enableHighAccuracy: false};
        $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function(position) {

            $scope.details.coordinates = {latitude: position.coords.latitude,
                longitude: position.coords.longitude};
				
            loading.hide();
        }, function(err) {
            loading.hide();
            // error
            popup.alert('error',' Please Turn on Location/check internet', 'error');
        });
    }
	
	    //modal for location
    $ionicModal.fromTemplateUrl('location.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.imageModal = modal;
    });
    $scope.viewLocation = function() {
        console.log($scope.details.coordinates);
        $scope.imageModal.show()
    }
	
   $scope.save =  function(){
   //hide preview modal
        $scope.closePreview();
     console.log($scope.details);
	 //check network
	 $scope.online = $cordovaNetwork.isOnline();
		 //save data into the databases
        if ($scope.online) {
            http.request('POST',
                    config.serverUrl + '/sample/save_market.php',
                    'Saving market intelligence data....',
                    $scope.details
                    ).then(function(data) {

                if (data.success === 1) {
                    //unset data
                    $scope.reset();
                    $scope.message = 'Market data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
        } else if (!$scope.online) {
            //save offline
            var storage = [];
            var marketSave = [];
            //check if it exists
            storage = localstorage.getObject(config.marketSave);
            console.log(storage);
            if (storage.length > 0) {
                //add new item
                storage.push($scope.details);
                marketSave = storage;
            }
            else
                marketSave.push($scope.details);

            console.log($scope.marketSave);
            //save it
            localstorage.setObject(config.marketSave, marketSave);
            //unset data
            $scope.reset();
            //get local saved data
            $scope.getLocalSavedData();

        }
   }
   //check if there is data saved locally
   $scope.getData();
   $scope.getLocalSavedData();

})
.controller('activationCtrl', function($scope,$ionicLoading,http,$cordovaNetwork,$ionicPopup,setting,$cordovaGeolocation,$timeout,loading,$ionicModal,$rootScope,config,popup,localstorage) {

$scope.details={};
$scope.customers = [{}]; 
			
	    $scope.getData = function() {
		
		  //getting working places
			var workLoc = setting.get(config.set_workLocation);
			if(workLoc)
			{
			$scope.WRegion=workLoc.region.name;
			$scope.WDistrict=workLoc.district.name;
			}
		
		//get customers saved locally
            var saleData = localstorage.getObject(config.saleInitData);
            //console.log(saleData);
            if (saleData) {
                $scope.customers = saleData.customers;	
            }
			
    };

	$scope.getLocalSavedData = function() {
        var saved = localstorage.getObject(config.activationSave);
        if (saved)
            $scope.localSavedData = saved;
    };
		
	  //form data model for displaying error message when nothan is filled in
    $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    }		

	
	//preview model
	$ionicModal.fromTemplateUrl('templates/activationPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });
	//validation
	    $scope.preview = function($form) {
        console.log($form.$invalid);
        if (!$form.$invalid)
            $scope.modal.show();
        else {
            $scope.message = 'Fill all required fields';
            $scope.poptitle = 'Error';
            $scope.popup();
        }
    }
    $scope.closePreview = function() {
        $scope.modal.hide();
    }
	
	  $scope.reset = function() {
        //disable officer choice
        //reset form model
        $scope.details = angular.copy({customer: '',kvant:'',kiroba:'',van:'',konyagi:'',valuer:''});
        //reset brands array
        //$scope.brandElemnts = angular.copy([{count: count, detail: '', quantity: ''}]);
    }
	 $scope.getLocation = function() {
        loading.show('fetch location...');
        var posOptions = {timeout: 20000, enableHighAccuracy: false};
        $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function(position) {

            $scope.details.coordinates = {latitude: position.coords.latitude,
                longitude: position.coords.longitude};
				
            loading.hide();
        }, function(err) {
            loading.hide();
            // error
            popup.alert('error',' Please Turn on Location/check internet', 'error');
        });
    }
	
	    //modal for location
    $ionicModal.fromTemplateUrl('location.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.imageModal = modal;
    });
    $scope.viewLocation = function() {
        console.log($scope.details.coordinates);
        $scope.imageModal.show()
    }
	
   $scope.save =  function(){
   //hide preview modal
        $scope.closePreview();
     console.log($scope.details);
	 //check network
	 $scope.online = $cordovaNetwork.isOnline();
		 //save data into the databases
        if ($scope.online) {
            http.request('POST',
                    config.serverUrl + '/sample/activation_save.php',
                    'Saving market activation data....',
                    $scope.details
                    ).then(function(data) {

                if (data.success === 1) {
                    //unset data
                    $scope.reset();
                    $scope.message = 'Market Activation data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
        } else if (!$scope.online) {
            //save offline
            var storage = [];
            var activationSave = [];
            //check if it exists
            storage = localstorage.getObject(config.activationSave);
            console.log(storage);
            if (storage.length > 0) {
                //add new item
                storage.push($scope.details);
                activationSave = storage;
            }
            else
                activationSave.push($scope.details);

            console.log($scope.activationSave);
            //save it
            localstorage.setObject(config.activationSave, activationSave);
            //unset data
            $scope.reset();
            //get local saved data
            $scope.getLocalSavedData();

        }
   }
   //check if there is data saved locally
   $scope.getData();
   $scope.getLocalSavedData();

})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})
.controller('DatabaseCrtl', function ($scope, $http, $timeout) {
$http.get('http://localhost/sample/get_data.php').success(function(data){
console.log(data);
 $scope.list = data;
 } );
})
.controller('localstorageCtr', function($scope, localstorage, config,$ionicModal,http,$ionicPopup,$cordovaNetwork,stockFunction,popup) {

$scope.islocalstorage = true;
$scope.init = function() {
        $scope.stockItems = [];
        ///get local stored stock items
        $scope.stockItems = localstorage.getObject(config.stockSave);
        $scope.stockInitDetails = localstorage.getObject(config.stockInitData);

    }
    //initialize data
    $scope.init();
    //modal for depot
    $ionicModal.fromTemplateUrl('depots.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.depotModal = modal;
    });
     //modal for officer
    $ionicModal.fromTemplateUrl('officers.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.officerModal = modal;
    });
	
	//stock preview modal
	$ionicModal.fromTemplateUrl('templates/stockPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.previewModal = modal;
    });
	

      $scope.previewDepots = function() {
        $scope.depots = $scope.stockInitDetails.depots;
        //open depot modal
        $scope.depotModal.show();
       
    };
    
    $scope.previewOfficers = function(){
       
        $scope.officers = $scope.stockInitDetails.officers;
        //open depot modal
        $scope.officerModal.show();
    };
	
     $scope.previewItem = function(item) {
        $scope.details = item;
        $scope.brandElemnts = item.brand;
        $scope.previewModal.show();
    }
	
		//function to close modal
	 $scope.closePreview = function() {
        $scope.previewModal.hide();
    }

	
	//initialize the pop so that u can pop up a message
     $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    };
    
    $scope.sychronizeStock = function(){
       http.request('POST',
                    config.serverUrl + '/sample/offline_data.php',
                    'Uploading to the online server....',
                     $scope.stockItems
                    ).then(function(data) {
                   console.log(data);
                if (data.success === 1) {
                    //unset data
                    localstorage.setObject(config.stockSave,{});
					$scope.stockItems = []; //unset this to remove the number of items without reloding the page
                    $scope.message = 'Stock data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
    }
	
	 //clear stock items 
    $scope.clearStockItems = function() {

        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.stockSave, {});
                $scope.init();
            }
        });
    }
	
	    $scope.updateData = function() {
        //if ($scope.isOnline()) {
            stockFunction.updateInitialData().then(
                    function() {
                        $scope.init();
                    }
            );

        //}
       // else
          // alert('No internet Connection');
    }
	
	    //clear stock downloaded data
    $scope.clearData = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.stockInitData, {});
                $scope.init();
            }
        });
    }
	//clear all items and pre loaded data
	$scope.clearStorage = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.stockSave, {});
                localstorage.setObject(config.stockInitData, {});
                $scope.init();
            }
        });
    }
	$scope.remove = function(item) {
        var index = $scope.stockItems.indexOf(item);
        $scope.stockItems.splice(index, 1);
        //update storage
        localstorage.setObject(config.stockSave, $scope.stockItems);
        //close modal
        $scope.previewModal.hide();
    }
})
.controller('SaleslocalstorageCtr', function($scope, localstorage, config,$ionicModal,http,$ionicPopup,$cordovaNetwork,popup,saleFunction) {

$scope.islocalstorage = true;
$scope.init = function() {
        $scope.saleItems = [];
        ///get local stored stock items
        $scope.saleItems = localstorage.getObject(config.saleSave);
        $scope.saleInitDetails = localstorage.getObject(config.saleInitData);

    }
    //initialize data
    $scope.init();
    //modal for customer
	
    $ionicModal.fromTemplateUrl('customers.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.customerModal = modal;
    });
     
	//salespreview modal
	$ionicModal.fromTemplateUrl('templates/salePreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.previewModal = modal;
    });
	

      $scope.previewCustomers = function() {
        $scope.customers = $scope.saleInitDetails.customers;
        //open depot modal
        $scope.customerModal.show();
       
    };
    
	
     $scope.previewItem = function(item) {
        $scope.details = item;
        $scope.brandElemnts = item.brand;
        $scope.previewModal.show();
    }
	
	
		//function to close modal
	 $scope.closePreview = function() {
        $scope.previewModal.hide();
    }

	
	//initialize the pop so that u can pop up a message
     $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    };
    
    $scope.sychronizeSale = function(){
       http.request('POST',
                    config.serverUrl + '/sample/sales_offline_data.php',
                    'Uploading to the online server....',
                     $scope.saleItems
                    ).then(function(data) {
                   console.log(data);
                if (data.success === 1) {
                    //unset data
                    localstorage.setObject(config.saleSave,{});
					$scope.saleItems = []; //unset this to remove the number of items without reloding the page
                    $scope.message = 'Sales data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
    }
	
	 //clear sales items 
    $scope.clearSaleItems = function() {

        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.saleSave, {});
                $scope.init();
            }
        });
    }
		
	    //clear customers downloaded data
    $scope.clearData = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.saleInitData, {});
                $scope.init();
            }
        });
    }
	       //get customer pre loaded data
		    $scope.updateData = function() {
        //if ($scope.isOnline()) {
            saleFunction.updateInitialData().then(
                    function() {
                        $scope.init();
                    }
            );

        //}
       // else
          // alert('No internet Connection');
    }
	//clear all items and pre loaded data
	$scope.clearStorage = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.saleSave, {});
                localstorage.setObject(config.saleInitData, {});
                $scope.init();
            }
        });
    }
	$scope.remove = function(item) {
        var index = $scope.saleItems.indexOf(item);
        $scope.saleItems.splice(index, 1);
        //update storage
        localstorage.setObject(config.saleSave, $scope.saleItems);
        //close modal
        $scope.previewModal.hide();
    }
})
.controller('PaymentlocalstorageCtr', function($scope, localstorage,config,$ionicModal,http,$ionicPopup,$cordovaNetwork,popup,paymentFunction) {
$scope.islocalstorage = true;
$scope.init = function() {
        $scope.paymentItems = [];
        ///get local stored payment items
        $scope.paymentItems = localstorage.getObject(config.paymentSave);
        $scope.paymentInitDetails = localstorage.getObject(config.paymentInitData);

    }
    //initialize data
    $scope.init();
    //modal for customer
	
    $ionicModal.fromTemplateUrl('accountants.html', {
        scope: $scope,
    }).then(function(modal) {
        $scope.customerModal = modal;
    });
     
	//salespreview modal
	$ionicModal.fromTemplateUrl('templates/paymentPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.previewModal = modal;
    });
	

      $scope.previewAccountants = function() {
        $scope.accountants = $scope.paymentInitDetails.accountants;
        //open depot modal
        $scope.customerModal.show();
       
    };
    
	
     $scope.previewItem = function(item) {
        $scope.details = item;
        $scope.previewModal.show();
    }
	
		//function to close modal
	 $scope.closePreview = function() {
        $scope.previewModal.hide();
    }

	
	//initialize the pop so that u can pop up a message
     $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    };
    
    $scope.sychronizePayment = function(){
       http.request('POST',
                    config.serverUrl + '/sample/payment_offline_data.php',
                    'Uploading to the online server....',
                     $scope.paymentItems
                    ).then(function(data) {
                   console.log(data);
                if (data.success === 1) {
                    //unset data
                    localstorage.setObject(config.paymentSave,{});
					$scope.paymentItems = []; //unset this to remove the number of items without reloding the page
                    $scope.message = 'Payment data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
    }
	
	 //clear sales items 
    $scope.clearPaymentItems = function() {

        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.paymentSave, {});
                $scope.init();
            }
        });
    }
		
	    //clear customers downloaded data
    $scope.clearData = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.paymentInitData, {});
                $scope.init();
            }
        });
    }
	       //get customer pre loaded data
		    $scope.updateData = function() {
        //if ($scope.isOnline()) {
            paymentFunction.updateInitialData().then(
                    function() {
                        $scope.init();
                    }
            );

        //}
       // else
          // alert('No internet Connection');
    }
	//clear all items and pre loaded data
	$scope.clearStorage = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.paymentSave, {});
                localstorage.setObject(config.paymentInitData, {});
                $scope.init();
            }
        });
    }
	$scope.remove = function(item) {
        var index = $scope.paymentItems.indexOf(item);
        $scope.paymentItems.splice(index, 1);
        //update storage
        localstorage.setObject(config.paymentSave, $scope.paymentItems);
        //close modal
        $scope.previewModal.hide();
    }
})
.controller('FuellocalstorageCtr', function($scope, localstorage, config,$ionicModal,http,$ionicPopup,$cordovaNetwork,popup) {

$scope.islocalstorage = true;
$scope.init = function() {
        $scope.fuelItems = [];
        ///get local stored fuel items
        $scope.fuelItems = localstorage.getObject(config.fuelSave);

    }
    //initialize data
    $scope.init();

     
	//fuel preview modal
	$ionicModal.fromTemplateUrl('templates/fuelPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.previewModal = modal;
    });
	

     $scope.previewItem = function(item) {
        $scope.details = item;
        $scope.previewModal.show();
    }
	
		//function to close modal
	 $scope.closePreview = function() {
        $scope.previewModal.hide();
    }

	
	//initialize the pop so that u can pop up a message
     $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    };
    
    $scope.sychronizeFuel = function(){
       http.request('POST',
                    config.serverUrl + '/sample/fuel_offline_data.php',
                    'Uploading to the online server....',
                     $scope.fuelItems
                    ).then(function(data) {
                   console.log(data);
                if (data.success === 1) {
                    //unset data
                    localstorage.setObject(config.fuelSave,{});
					$scope.fuelItems = []; //unset this to remove the number of items without reloding the page
                    $scope.message = 'Fuel data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
    }
	
	 //clear fuel items 
    $scope.clearFuelItems = function() {

        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.fuelSave, {});
                $scope.init();
            }
        });
    }
		
	//clear all items and pre loaded data
	$scope.clearStorage = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.fuelSave, {});
                $scope.init();
            }
        });
    }
	$scope.remove = function(item) {
        var index = $scope.fuelItems.indexOf(item);
        $scope.fuelItems.splice(index, 1);
        //update storage
        localstorage.setObject(config.fuelSave, $scope.fuelItems);
        //close modal
        $scope.previewModal.hide();
    }
})
.controller('MarketlocalstorageCtr', function($scope, localstorage, config,$ionicModal,http,$ionicPopup,$cordovaNetwork,popup) {

$scope.islocalstorage = true;
$scope.init = function() {
        $scope.marketItems = [];
        ///get local stored fuel items
        $scope.marketItems = localstorage.getObject(config.marketSave);

    }
    //initialize data
    $scope.init();

     
	//fuel preview modal
	$ionicModal.fromTemplateUrl('templates/marketPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.previewModal = modal;
    });
	

     $scope.previewItem = function(item) {
        $scope.details = item;
        $scope.previewModal.show();
    }
	
		//function to close modal
	 $scope.closePreview = function() {
        $scope.previewModal.hide();
    }

	
	//initialize the pop so that u can pop up a message
     $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    };
    
    $scope.sychronizeMarket = function(){
       http.request('POST',
                    config.serverUrl + '/sample/market_offline_data.php',
                    'Uploading to the online server....',
                     $scope.marketItems
                    ).then(function(data) {
                   console.log(data);
                if (data.success === 1) {
                    //unset data
                    localstorage.setObject(config.marketSave,{});
					$scope.marketItems = []; //unset this to remove the number of items without reloding the page
                    $scope.message = 'Market data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
    }
	
	 //clear fuel items 
    $scope.clearMarketItems = function() {

        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.marketSave, {});
                $scope.init();
            }
        });
    }
		
	//clear all items and pre loaded data
	$scope.clearStorage = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.marketSave, {});
                $scope.init();
            }
        });
    }
	$scope.remove = function(item) {
        var index = $scope.marketItems.indexOf(item);
        $scope.marketItems.splice(index, 1);
        //update storage
        localstorage.setObject(config.marketSave, $scope.marketItems);
        //close modal
        $scope.previewModal.hide();
    }
})
.controller('ActivationlocalstorageCtr', function($scope, localstorage, config,$ionicModal,http,$ionicPopup,$cordovaNetwork,popup) {

$scope.islocalstorage = true;
$scope.init = function() {
        $scope.activationItems = [];
        ///get local stored fuel items
        $scope.activationItems = localstorage.getObject(config.activationSave);

    }
    //initialize data
    $scope.init();

     
	//fuel preview modal
	$ionicModal.fromTemplateUrl('templates/activationPreview.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.previewModal = modal;
    });
	

     $scope.previewItem = function(item) {
        $scope.details = item;
        $scope.previewModal.show();
    }
	
	
		//function to close modal
	 $scope.closePreview = function() {
        $scope.previewModal.hide();
    }

	
	//initialize the pop so that u can pop up a message
     $scope.popup = function() {
        $ionicPopup.alert({
            title: $scope.poptitle,
            template: $scope.message
        });

        $scope.poptitle = null;
        $scope.message = null;
    };
    
    $scope.sychronizeActivation = function(){
       http.request('POST',
                    config.serverUrl + '/sample/activation_save_offline.php',
                    'Uploading to the online server....',
                     $scope.activationItems
                    ).then(function(data) {
                   console.log(data);
                if (data.success === 1) {
                    //unset data
                    localstorage.setObject(config.activationSave,{});
					$scope.activationItems = []; //unset this to remove the number of items without reloding the page
                    $scope.message = 'Market Activation data successfully saved';
                    $scope.poptitle = 'Info';
                }
                else if (data.success === 0) {
                    $scope.message = 'There was an error, data not saved';
                    $scope.poptitle = 'Error';
                }
                $scope.popup();
            });
    }
	
	 //clear fuel items 
    $scope.clearActivationItems = function() {

        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.activationSave, {});
                $scope.init();
            }
        });
    }
		
	//clear all items and pre loaded data
	$scope.clearStorage = function() {
        popup.confirm('Are you sure?').then(function(res) {
            if (res) {
                localstorage.setObject(config.activationSave, {});
                $scope.init();
            }
        });
    }
	$scope.remove = function(item) {
        var index = $scope.activationItems.indexOf(item);
        $scope.activationItems.splice(index, 1);
        //update storage
        localstorage.setObject(config.activationSave, $scope.activationItems);
        //close modal
        $scope.previewModal.hide();
    }
})
.controller('settingCtr', function($scope, network, popup, http, localstorage, $ionicModal, config, setting,$timeout,$rootScope, stockFunction,saleFunction,paymentFunction) {  
    // modal
    $ionicModal.fromTemplateUrl('settingList.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.settingModal = modal;
    });

    $scope.getRegion = function() {
        $scope.modalTitle = "Select District";
        $scope.nextFunction = 'getDistrict';
       if (network.isOnline(true)) {

            http.request('GET',
                    config.serverUrl + '/sample/get_region.php',
                    'fetching district.....',
                    null
                    ).then(function(data) {
                if (data) {

                    $scope.settingModal.show();
                    $scope.list = data;
                }
            });
        } else {
            //show pop up
           popup.alert('Alert', 'NO network connection', 'error');
        }

    }



    $scope.getDistrict = function(item) {
        $scope.modalTitle = "Select Zone";
        $scope.nextFunction = 'saveLocation';
        $scope.list = null;
        if (network.isOnline()) {

            http.request('GET',
                    config.serverUrl + '/sample/get_district.php?id=' + item.id,
                    'fetching Zone.....',
                    null
                    ).then(function(data) {
                if (data) {

                    $scope.list = data;
                }
            });
        } else {
            //show pop up
            popup.alert('Alert', 'NO network connection', 'error');
        }
    }

    $scope.saveLocation = function() {
        setting.save(config.set_workLocation,
                {region: $scope.selRegion, district: $scope.selDistrict});
        //close modal
        $scope.settingModal.hide();
        //update data
       stockFunction.updateInitialData().then(
               function(data) {
                    //get data from local
                    var stock = stockFunction.getInitLocalData();
                   // console.log(stock);
                   $rootScope.$broadcast('stock-details');


                }
       );
	   
	     //update sales to get customer based on selected location
       saleFunction.updateInitialData().then(
               function(data) {
                    //get data from local
                    //var sale = stockFunction.getInitLocalData();
                   // console.log(stock);
                   //$rootScope.$broadcast('stock-details');


                }
       );
	   
	     //update sales to get customer based on selected location
       paymentFunction.updateInitialData().then(
               function(data) {
                    //get data from local
                    //var sale = stockFunction.getInitLocalData();
                   // console.log(stock);
                   //$rootScope.$broadcast('stock-details');


                }
       );


        console.log(localstorage.getObject(config.setting));
    }
	//end of save.location
    $scope.reset = function() {
        setting.reset();
    }

    $scope.modalSelect = function(item) {
        if ($scope.nextFunction == 'getDistrict') {
            $scope.selRegion = item;
            $scope.getDistrict(item);
        }
        else if ($scope.nextFunction == 'saveLocation') {
            $scope.selDistrict = item;
            $scope.saveLocation();
            $scope.nextFunction = null;
        }

    }
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
