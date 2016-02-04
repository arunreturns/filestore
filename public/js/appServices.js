/* global angular */

angular.module('appServices', ['ngAnimate', 'ui.bootstrap'])

/**
 * @ngdoc factory
 * @name appServices.factory:$localstorage
 * @description
 * Factory for getting localStorage
 */
.factory('$localstorage', ['$window', function($window) {
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
            return JSON.parse($window.localStorage[key] || null);
        }
    };
}])

/**
 * @ngdoc service
 * @name appServices.service:UserService
 * @description
 * Service for manipulating and maintaining the user data.
 */
.service('UserService', 
    function($log, $http, $localstorage, $q){
        var User = {
            currentUser: null, userName: "Login",
            /**
             * @ngdoc method
             * @name setSession
             * @methodOf appServices.UserService
             * @description
             * Method used for setting the session of the user
             * @param user => the user to be saved
             * @returns none
             */
            setSession: function(user){
                var self = this;
                self.userName  = user.userName;
                self.currentUser = user;
                $localstorage.setObject('currentUser', user);
            },
            
            /**
             * @ngdoc method
             * @name checkSession
             * @methodOf appServices.UserService
             * @description
             * Method used for checking the session of the user
             * @param none
             * @returns none
             */
            checkSession: function() {
                var defer = $q.defer();
                var self = this;
            
                if (self.currentUser) {
                    // if this session is already initialized in the service
                    $log.info("{UserService} -> Is current user in Service", self.currentUser);
                    defer.resolve(true);
                }
                else {
                    // detect if there's a session in localstorage from previous use.
                    // if it is, pull into our service
                    var currentUser = $localstorage.getObject('currentUser');
                    $log.info("{UserService} -> Is current user in localStorage", currentUser);
                    
                    if (currentUser) {
                        // if there's a user, lets grab their favorites from the server
                        self.setSession(currentUser);
                        defer.resolve(true);
                    }
                    else {
                        // no user info in localstorage, reject
                        defer.resolve(false);
                    }
            
                }
            
                return defer.promise;
            },
            
            /**
             * @ngdoc method
             * @name changePassword
             * @methodOf appServices.UserService
             * @description
             * Method used for changing the password of the user
             * @param   oldPassword => the old password to be changed
             *          newPassword => the new password to be updated
             * @returns none
             */
            changePassword: function(oldPassword, newPassword){
                $log.info("{UserService} -> Changing the user password");
                return $http.post('/changePassword', {
                    oldPassword: oldPassword,
                    newPassword: newPassword,
                    userName: this.currentUser.userName
                });
            },
            
            /**
             * @ngdoc method
             * @name resetPassword
             * @methodOf appServices.UserService
             * @description
             * Method used for resetting the password of the user
             * @param email => The email to which reset instructions are sent
             * @returns none
             */
            resetPassword: function(email){
                $log.info("{UserService} -> Resseting the user password");
                return $http.post('/resetPassword', {
                    email: email,
                });
            },
            
            /**
             * @ngdoc method
             * @name signupUser
             * @methodOf appServices.UserService
             * @description
             * Method used for signing up the user
             * @param user => the user to be signed up
             * @returns none
             */
            signupUser: function(user){
                var self = this;
                
                $log.info("{UserService} -> Signing Up the User");
                $log.info(user);
                return $http.post('/signup', {
                    user: user
                }).success(function(user){
                    $log.info(user);
                    self.setSession(user);
                })
                .error(function(err){
                    $log.error(err);
                });
            },
            
            /**
             * @ngdoc method
             * @name updateUser
             * @methodOf appServices.UserService
             * @description
             * Method used for updating the user details
             * @param user => the user to be updated
             * @returns none
             */
            updateUser: function(user){
                var self = this;
                $log.info("{UserService} -> Updating the User");
                return $http.post('/update', {
                    user: user
                })
                .success(function(updatedUser){
                    $log.info("{UserService} -> Updated Successfully");
                    $log.info(updatedUser);
                    self.setSession(user);
                })
                .error(function(err){
                    $log.error("Error: " + err);
                });
            },
            
            /**
             * @ngdoc method
             * @name getUserData
             * @methodOf appServices.UserService
             * @description
             * Method used for getting the user details
             * @param none
             * @returns none
             */
            getUserData: function() {
                var self = this;
                $log.info("{UserService} -> Getting the User data");
                return $http.post('/profile', {
                    userName: self.currentUser.userName
                });
            },
            
            /**
             * @ngdoc method
             * @name logoutUser
             * @methodOf appServices.UserService
             * @description
             * Method used for logging out the user
             * @param none
             * @returns none
             */
            logoutUser: function(){
                var self = this;
                self.currentUser = null;
                self.userName = "Login";
                $localstorage.setObject('currentUser', null);
            }
        };
        
        return User;
})

/**
 * @ngdoc service
 * @name appServices.service:UIService
 * @description
 * Service wrapper for ngToast
 */
.service('UIService', 
    function(ngToast){
        var UI = {
            /**
             * @ngdoc showWarning
             * @name runServerCommand
             * @methodOf appServices.UIService
             * @description
             * Method used for showing warning toast messages
             * @param   content => the content of the toast
             *          timeout => optional ( time to auto close )
             * @returns none
             */
            showWarning: function(content, timeout) {
                ngToast.create({
                    className: 'warning',
                    content: content,
                    dismissOnTimeout: true,
                    timeout: timeout || 3000,
                    dismissButton: true
                });
            },
            /**
             * @ngdoc showSuccess
             * @name runServerCommand
             * @methodOf appServices.UIService
             * @description
             * Method used for showing success toast messages
             * @param   content => the content of the toast
             *          timeout => optional ( time to auto close )
             * @returns none
             */
            showSuccess: function(content, timeout) {
                ngToast.create({
                    className: 'success',
                    content: content,
                    dismissOnTimeout: true,
                    timeout: timeout || 3000,
                    dismissButton: true
                });
            },
            /**
             * @ngdoc showDanger
             * @name runServerCommand
             * @methodOf appServices.UIService
             * @description
             * Method used for showing danger toast messages
             * @param   content => the content of the toast
             *          timeout => optional ( time to auto close )
             * @returns none
             */
            showDanger: function(content, timeout) {
                ngToast.create({
                    className: 'danger',
                    content: content,
                    dismissOnTimeout: true,
                    timeout: timeout || 3000,
                    dismissButton: true
                });
            }
        };
        return UI;
    })
    
/**
 * @ngdoc service
 * @name appServices.service:Modal
 * @description
 * Modal wrapper
 */
.service('Modal',
    function ($uibModal, $log, UserService) {
        function assignCurrentUser (user) {
            if ( user )
                UserService.setSession(user);
        }

        return function(view) {
            var instance = $uibModal.open({
                animation: true,
                templateUrl: view,
                controller: "ModalCtrl",
                backdrop: "static",
                keyboard: false
            });

            return instance.result.then(assignCurrentUser);
        };
    });