/* global angular */

angular.module('appControllers', ['ngAnimate','ui.bootstrap','ngFileUpload'])
/**
 * @ngdoc controller
 * @name appControllers.controller:SignupCtrl
 * @description
 * Controller used for Signup the user
 */
.controller('SignupCtrl',
    function($scope, UserService, $state, UIService) {
        /**
         * @ngdoc method
         * @name signupUser
         * @methodOf appControllers.SignupCtrl
         * @description
         * Method used for Signup the user
         * Calls UserService.signupUser 
         * @param none
         * @returns none
         */
        $scope.signupUser = function(){
            UserService.signupUser($scope.newUser).then(function(){
                UIService.showSuccess('Signed up successfully');
                $state.go('profile');
            }, function(err){
                UIService.showDanger(err.data);
                $scope.clicked = false;
            });
        };
    }
)

/**
 * @ngdoc controller
 * @name appControllers.controller:LoginCtrl
 * @description
 * Controller used for Maintaining Login related data of the user
 */
.controller('LoginCtrl',
    function($scope, UserService, $log, UIService, Modal) {
        /**
         * @ngdoc method
         * @name updateUser
         * @methodOf appControllers.LoginCtrl
         * @description
         * Method used for updating the user details
         * Calls UserService.updateUser 
         * @param none
         * @returns none
         */
        $scope.updateUser = function(){
            UserService.updateUser($scope.user).then(function(){
                UIService.showSuccess('Profile Updated successfully');
                $scope.userDetails.$setPristine();
                $scope.clicked = false;
            });
        };
        
        /**
         * @ngdoc method
         * @name changePassword
         * @methodOf appControllers.LoginCtrl
         * @description
         * Method used for changing the password of the user
         * Uses the Modal service to open a change password page
         * @param none
         * @returns none
         */
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

/**
 * @ngdoc controller
 * @name appControllers.controller:ModalCtrl
 * @description
 * Controller used for Maintaining Modal data displayed.
 */
.controller('ModalCtrl',
    function ($scope, $uibModalInstance, $http, $log, UIService, UserService, Modal, $timeout) {
        $scope.alerts = [];
        $scope.user = UserService;
        $scope.togglePassword = false;
        /**
         * @ngdoc method
         * @name login
         * @methodOf appControllers.ModalCtrl
         * @description
         * Method used for logging in the user
         * @param none
         * @returns none
         */
        $scope.login = function(){
            $http.post('/login', {
                userName: $scope.userName,
                password: $scope.password
            })
            .success(function(data){
                $log.info("[ModalCtrl] => Login Succesful");
                $uibModalInstance.close(data);
                if (data.isPasswordChanged) {
                    Modal("views/change-password.html")
                        .then(function() {
                
                        });
                }
                UIService.showSuccess('Welcome back ' + data.firstName);
            })
            .error(function(err){
                $scope.addAlert(err, "danger");
                $log.error("[ModalCtrl] => Error" + err);
            });
        };
        /**
         * @ngdoc method
         * @name resetPassword
         * @methodOf appControllers.ModalCtrl
         * @description
         * Method used for resetting the password of the user
         * @param none
         * @returns none
         */
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
        
        /**
         * @ngdoc method
         * @name changePassword
         * @methodOf appControllers.ModalCtrl
         * @description
         * Method used for changing the password of the user
         * @param none
         * @returns none
         */
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
        
        /**
         * @ngdoc method
         * @name dismissModal
         * @methodOf appControllers.ModalCtrl
         * @description
         * Method used for closing the modal
         * @param none
         * @returns none
         */
        $scope.dismissModal = function(){
            $uibModalInstance.dismiss();
        };
        
        /**
         * @ngdoc method
         * @name addAlert
         * @methodOf appControllers.ModalCtrl
         * @description
         * Method used for changing the password of the user
         * @param   msg     => the text content 
         *          type    => severity of the msg
         * @returns none
         */
        $scope.addAlert = function(msg,type) {
            var alert = {type: type,msg: msg, id: Date.now()};
            $scope.alerts.push(alert);
            $timeout(function(){
                var id = "#"+ alert.id;
                console.log("Closing id " + id);
                $(id).fadeTo(500, 0).slideUp(500, function() {
                    $(this).remove();
                });
            }, 3000);
        };
        
        /**
         * @ngdoc method
         * @name closeAlert
         * @methodOf appControllers.ModalCtrl
         * @description
         * Method used for closing the alerts on the page
         * @param index
         * @returns none
         */
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
})

/**
 * @ngdoc controller
 * @name appControllers.controller:MainCtrl
 * @description
 * Controller used for Maintaining the Whole App status
 */
.controller('MainCtrl', 
    function($scope, UserService, UIService) {
        $scope.user = UserService;
        /**
         * @ngdoc method
         * @name logOut
         * @methodOf appControllers.MainCtrl
         * @description
         * Method used for logging out the user
         * @param none
         * @returns none
         */
        $scope.logOut = function(){
            UserService.logoutUser();
            UIService.showDanger('User logged out successfully');
        };
})

/**
 * @ngdoc controller
 * @name appControllers.controller:ServerCtrl
 * @description
 * Controller used for Running server commands
 */
.controller('ServerCtrl',
    function($scope, $log, $http) {
        /**
         * @ngdoc method
         * @name runServerCommand
         * @methodOf appControllers.ServerCtrl
         * @description
         * Method used for Running server commands
         * @param none
         * @returns none
         */
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
})

/**
 * @ngdoc controller
 * @name appControllers.controller:ViewCtrl
 * @description
 * Controller used for Viewing the file on the server
 */
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
        
        /**
         * @ngdoc method
         * @name removeFile
         * @methodOf appControllers.ViewCtrl
         * @description
         * Method used for removing a file from the server
         * @param id => Id of the file
         * @returns none
         */
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
        
        /**
         * @ngdoc method
         * @name sendMail
         * @methodOf appControllers.ViewCtrl
         * @description
         * Method used for sending mail messages
         * @param id => Id of the file
         * @returns none
         */
        $scope.sendMail = function(id){
            $http.post("/sendMail", {
                id: id,
                userName : UserService.userName
            }).success(function(status){
                $log.info(status);
                UIService.showWarning('Mail Sent successfully to ' + (UserService.currentUser.email));
            });
        };
        
        /**
         * @ngdoc method
         * @name sendMessage
         * @methodOf appControllers.ViewCtrl
         * @description
         * Method used for sending SMS messages
         * @param id => Id of the file
         * @returns none
         */
        $scope.sendMessage = function(id){
            $http.post("/sendMessage", {
                id: id,
                userName : UserService.userName
            }).success(function(url){
                $log.info(url);
                UIService.showWarning('SMS Sent successfully to ' + 
                    (UserService.currentUser.phoneNo.code + UserService.currentUser.phoneNo.number));
            });
        };
    })

/**
 * @ngdoc controller
 * @name appControllers.controller:UploadCtrl
 * @description
 * Controller used for Uploading the file onto the server
 */
.controller('UploadCtrl',
    function($scope, Upload, UserService, UIService, $log){
        /**
         * @ngdoc method
         * @name upload
         * @methodOf appControllers.UploadCtrl
         * @description
         * Method used for uploading a file to the server
         * @param file => The file to be uploaded
         * @returns none
         */
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