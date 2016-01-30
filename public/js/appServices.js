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
                console.log("Is current user in localStorage", currentUser);
                
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
        
        signupUser: function(user){
            var self = this;
            $log.info("Signing Up the User");
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
            $log.info("Updating the User");
            $http.post('/update', {
                user: user
            })
            .success(function(user){
                $log.info("Updated Successfully");
                self.setSession(user);
            })
            .error(function(err){
                $log.error("Error" + err);
            });
        },
        getUserData: function() {
            var self = this;
            $log.info("Getting the User data");
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


.service('LoginModal',
    function ($uibModal, $log, UserService) {
        function assignCurrentUser (user) {
            UserService.setSession(user);
        }

        return function() {
            var instance = $uibModal.open({
                animation: true,
                templateUrl: 'views/login-modal.html',
                controller: 'LoginModalCtrl',
                backdrop: "static"
            });

            return instance.result.then(assignCurrentUser);
        };
    }
);