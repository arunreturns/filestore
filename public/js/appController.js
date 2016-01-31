/* global angular */
angular.module('appControllers', ['ngAnimate','ui.bootstrap','ngFileUpload','ngToast'])

.controller('SignupCtrl',
    function($scope, UserService, $state, ngToast) {
        $scope.signupUser = function(){
            UserService.signupUser($scope.newUser).then(function(){
                ngToast.create({
                    className: 'warning',
                    content: 'Signed up successfully'
                });
                $state.go('profile');
            });
        };
    }
)

.controller('LoginCtrl',
    function($scope, UserService, $log, ngToast) {
        $scope.updateUser = function(){
            UserService.updateUser($scope.user).then(function(){
                ngToast.create({
                    className: 'warning',
                    content: 'Profile Updated successfully'
                });
                $scope.userDetails.$setPristine();
                $scope.clicked = false;
            });
        };

        if ( UserService.currentUser) {
            UserService.getUserData().success(function(user) {
                $scope.user = user;
            })
            .error(function(err) {
                $log.error("Error" + err);
            });
        }
    }
)

.controller('LoginModalCtrl',
    function ($scope, $uibModalInstance, $http, $log) {
        $scope.alerts = [];
            
        $scope.login = function(){
            $http.post('/login', {
                userName: $scope.userName,
                password: $scope.password
            })
            .success(function(data){
                $log.info("Login Succesful");
                if ( data === "User Not Found!") {
                    $scope.addAlert(data,'warning');
                } else if ( data === "Incorrect Password!") {
                    $scope.addAlert(data,'danger');
                } else {
                    $uibModalInstance.close(data);
                }
            })
            .error(function(data){
                $log.error("Error" + data);
            });
        };
        
        $scope.dismissModal = function(){
            $uibModalInstance.dismiss();
        };
        
        $scope.addAlert = function(msg,type) {
            $scope.alerts.push({type: type,msg: msg});
        };
        
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
})

.controller('MainCtrl', 
    function($scope, UserService) {
        console.log("Main Ctrl", UserService);
        $scope.user = UserService;
        
        $scope.logOut = function(){
            UserService.logoutUser();
        };
    }
)

.controller('ServerCtrl', [ 
    '$scope', '$log', '$http',
    
    function($scope, $log, $http) {
        
        $scope.runServerCommand = function(){
            
            if ( $scope.serverCmd ) {
                $http.post('/runServerCmd', { "serverCmd" : $scope.serverCmd } )
                .success(function(data){
                    $scope.serverOutput = data;
                })
                .error(function(data){
                    $log.error("Error " + data);
                });
            }
        };
        
        $scope.clearOutput = function(){
            $scope.serverOutput = "";
        };
    }
])

.controller('ViewCtrl',
    function($scope, $http, $log, UserService, ngToast) {
        $http.post('/viewFiles', {
            userName : UserService.userName
        }).success(function(files){
            console.log(files);
            $scope.filesList = files;
        })
        .error(function(err, data){
            $log.err("Error", err);
        });
        
        $scope.removeFile = function(id){
            console.log("Removing id ", id);
            $http.post("/removeFile", {
                id: id,
                userName : UserService.userName
            }).success(function(files){
                console.log(files);
                $scope.filesList = files;
                ngToast.create({
                    className: 'danger',
                    content: 'File Removed Successfully'
                });
            });  
        };
        
        $scope.sendMessage = function(id){
            $http.post("/sendMessage", {
                id: id,
                userName : UserService.userName
            }).success(function(url){
                $log.info(url);
                ngToast.create({
                    className: 'warning',
                    content: 'SMS Sent successfully to ' + UserService.currentUser.phoneNo
                });
            });
        };
    }
)

.controller('UploadCtrl',
    function($scope, Upload, UserService, ngToast){
        $scope.upload = function (file) {
            $scope.f = file;
            console.log($scope.f);
            if ( !file )
                return;
            console.log("User is uploading" , UserService.userName);
            file.upload = Upload.upload({
                url: 'uploadFiles',
                data: {file: file, 'userName': UserService.userName}
            });
            
            file.upload.then(function (resp) {
                console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                ngToast.create({
                    className: 'warning',
                    content: 'Uploaded successfully'
                });
                $scope.f = null;
            }, function (resp) {
                console.log('Error status: ' + resp.status);
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                console.log('progress: ' + file.progress + '% ' + evt.config.data.file.name);
            });
        };
    }
);