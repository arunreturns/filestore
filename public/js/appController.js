/* global angular */
angular.module('appControllers', ['ngAnimate','ui.bootstrap','ngFileUpload','ngToast'])

.controller('SignupCtrl',
    function($scope, UserService, $state, ngToast) {
        $scope.signupUser = function(){
            UserService.signupUser($scope.newUser).then(function(){
                ngToast.create({
                    className: 'success',
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
                    className: 'success',
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
    function ($scope, $uibModalInstance, $http, $log, ngToast) {
        $scope.alerts = [];
            
        $scope.login = function(){
            $http.post('/login', {
                userName: $scope.userName,
                password: $scope.password
            })
            .success(function(data){
                if ( data === "User Not Found!") {
                    $log.info("[LoginModalCtrl] => User Not Found!");
                    $scope.addAlert(data,'warning');
                } else if ( data === "Incorrect Password!") {
                    $log.info("[LoginModalCtrl] => Incorrect Password!");
                    $scope.addAlert(data,'danger');
                } else {
                    $log.info("[LoginModalCtrl] => Login Succesful");
                    $uibModalInstance.close(data);
                    ngToast.create({
                        className: 'success',
                        content: 'Welcome back ' + data.firstName
                    });
                }
            })
            .error(function(err){
                $log.error("[LoginModalCtrl] => Error" + err);
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
    function($scope, UserService, ngToast) {
        $scope.user = UserService;
        $scope.logOut = function(){
            UserService.logoutUser();
            ngToast.create({
                className: 'danger',
                content: 'User logged out successfully'
            });
        };
    }
)

.controller('ServerCtrl', [ 
    '$scope', '$log', '$http',
    
    function($scope, $log, $http) {
        
        $scope.runServerCommand = function(){
            
            if ( $scope.serverCmd ) {
                $http.post('/runServerCmd', { "serverCmd" : $scope.serverCmd } )
                .success(function(output){
                    $scope.serverOutput = output;
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
            $log.info("[ViewCtrl] => Files retrieved successfully");
            $log.info("[ViewCtrl] => Files List is ");
            $log.info(files);
            $scope.filesList = files;
        })
        .error(function(err, data){
            $log.error("[ViewCtrl] => Error", err);
        });
        
        $scope.removeFile = function(id){
            $log.info("[ViewCtrl] => Removing id ", id);
            $http.post("/removeFile", {
                id: id,
                userName : UserService.userName
            }).success(function(files){
                $log.info("[ViewCtrl] => File removed successfully");
                $log.info("[ViewCtrl] => Updated file list");
                $log.info(files);
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
                    content: 'SMS Sent successfully to ' + (UserService.currentUser.phoneNo.code + UserService.currentUser.phoneNo.number)
                });
            });
        };
    }
)

.controller('UploadCtrl',
    function($scope, Upload, UserService, ngToast, $log){
        $scope.upload = function (file) {
            $scope.f = file;
            console.log($scope.f);
            if ( !file )
                return;
            $log.info("[UploadCtrl] => User " + UserService.userName + " is uploading");
            file.upload = Upload.upload({
                url: 'uploadFiles',
                data: {file: file, 'userName': UserService.userName}
            });
            
            file.upload.then(function (resp) {
                $log.info('[UploadCtrl] => Success ' + resp.config.data.file.name + 'uploaded');
                $log.info('[UploadCtrl] => Response: ' + resp.data);
                ngToast.create({
                    className: 'success',
                    content: 'Uploaded ' + resp.config.data.file.name + ' successfully'
                });
                $scope.f = null;
            }, function (resp) {
                $log.info('[UploadCtrl] => Error status: ' + resp.status);
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total, 10));
                $log.info('[UploadCtrl] => Progress: ' + file.progress + '% ' + evt.config.data.file.name);
            });
        };
    }
);