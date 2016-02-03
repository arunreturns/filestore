/* global angular */

angular.module('appControllers', ['ngAnimate','ui.bootstrap','ngFileUpload'])

.controller('SignupCtrl',
    function($scope, UserService, $state, UIService) {
        $scope.signupUser = function(){
            UserService.signupUser($scope.newUser).then(function(){
                UIService.showSuccess('Signed up successfully');
                $state.go('profile');
            });
        };
    }
)

.controller('LoginCtrl',
    function($scope, UserService, $log, UIService, Modal) {
        $scope.updateUser = function(){
            UserService.updateUser($scope.user).then(function(){
                UIService('Profile Updated successfully');
                $scope.userDetails.$setPristine();
                $scope.clicked = false;
            });
        };
        $scope.changePassword = function(){
            Modal('views/change-password.html', 'LoginCtrl')
            .then(function () {
                $log.info("[LoginCtrl] => Modal closed");
            })
            .catch(function () {
                $log.info("[LoginCtrl] => Modal cancelled");
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

.controller('ModalCtrl',
    function ($scope, $uibModalInstance, $http, $log, UIService, UserService) {
        $scope.alerts = [];
        $scope.togglePassword = false;    
        $scope.login = function(){
            $http.post('/login', {
                userName: $scope.userName,
                password: $scope.password
            })
            .success(function(data){
                if ( data === "User Not Found!") {
                    $log.info("[ModalCtrl] => User Not Found!");
                    $scope.addAlert(data,'warning');
                } else if ( data === "Incorrect Password!") {
                    $log.info("[ModalCtrl] => Incorrect Password!");
                    $scope.addAlert(data,'danger');
                } else {
                    $log.info("[ModalCtrl] => Login Succesful");
                    $uibModalInstance.close(data);
                    UIService.showSuccess('Welcome back ' + data.firstName);
                }
            })
            .error(function(err){
                $log.error("[ModalCtrl] => Error" + err);
            });
        };
        $scope.resetPassword = function(){
            $log.info("[ModalCtrl] => Resetting password");
            UserService.resetPassword($scope.email).success(function(user){
                $uibModalInstance.close();
                UIService.showSuccess('Password reset successfully');
            })
            .error(function(err){
                $scope.addAlert(err, "danger");
                $log.error(err);
            });
        };
        
        $scope.changePassword = function(){
            UserService.changePassword($scope.oldPassword, $scope.newPassword).success(function(user){
                $uibModalInstance.close(user);
                UIService.showSuccess('Password updated successfully ');
            })
            .error(function(err){
                $scope.addAlert(err, "danger");
                $log.error(err);
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
    function($scope, UserService, UIService) {
        $scope.user = UserService;
        $scope.logOut = function(){
            UserService.logoutUser();
            UIService.showDanger('User logged out successfully');
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
    function($scope, $http, $log, UserService, UIService) {
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
                UIService.showDanger('File Removed Successfully');
            });  
        };
        $scope.sendMail = function(id){
            $http.post("/sendMail", {
                id: id,
                userName : UserService.userName
            }).success(function(status){
                $log.info(status);
                UIService.showWarning('Mail Sent successfully to ' + (UserService.currentUser.email));
            });
        };
        
        $scope.sendMessage = function(id){
            $http.post("/sendMessage", {
                id: id,
                userName : UserService.userName
            }).success(function(url){
                $log.info(url);
                UIService.showWarning('SMS Sent successfully to ' + (UserService.currentUser.phoneNo.code + UserService.currentUser.phoneNo.number));
            });
        };
    }
)

.controller('UploadCtrl',
    function($scope, Upload, UserService, UIService, $log){
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
                UIService.showSuccess('Uploaded ' + resp.config.data.file.name + ' successfully');
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