/* global angular */

angular.module('appServices', ['ngAnimate', 'ui.bootstrap'])

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
.service('UserService', function($log, $http, $localstorage, $q){
    var User = {
        currentUser: null, userName: "Login",
        
        setSession: function(user){
            var self = this;
            self.userName  = user.userName;
            self.currentUser = user;
            $localstorage.setObject('currentUser', user);
        },
        
        checkSession: function() {
            var defer = $q.defer();
            var self = this;
        
            if (self.currentUser) {
                // if this session is already initialized in the service
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
        changePassword: function(oldPassword, newPassword){
            $log.info("{UserService} -> Changing the user password");
            return $http.post('/changePassword', {
                oldPassword: oldPassword,
                newPassword: newPassword,
                userName: this.currentUser.userName
            });
        },
        resetPassword: function(email){
            $log.info("{UserService} -> Resseting the user password");
            return $http.post('/resetPassword', {
                email: email,
            });
        },
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
                $log.error("Error" + err);
            });
        },
        getUserData: function() {
            var self = this;
            $log.info("{UserService} -> Getting the User data");
            return $http.post('/profile', {
                userName: self.currentUser.userName
            });
        },
        logoutUser: function(){
            var self = this;
            self.currentUser = null;
            self.userName = "Login";
            $localstorage.setObject('currentUser', null);
        }
    };
    
    return User;
})

.service('UIService', 
    function(ngToast){
        var UI = {
            showWarning: function(content, timeout) {
                ngToast.create({
                    className: 'warning',
                    content: content,
                    dismissOnTimeout: true,
                    timeout: timeout || 3000,
                    dismissButton: true
                });
            },
            showSuccess: function(content, timeout) {
                ngToast.create({
                    className: 'success',
                    content: content,
                    dismissOnTimeout: true,
                    timeout: timeout || 3000,
                    dismissButton: true
                });
            },
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
    }
    
)
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
                backdrop: "static"
            });

            return instance.result.then(assignCurrentUser);
        };
    }
);