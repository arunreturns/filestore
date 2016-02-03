/* global angular */

angular.module('fileApp', ['appRoutes','appControllers','appDirectives','appServices'])
    .run(
        function ($rootScope, $state, Modal, $log, UserService) {
            $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
                var requireLogin = toState.data.requireLogin;
                if (requireLogin && UserService.currentUser === null) {
                    $log.info("Inside Login");
                    event.preventDefault();
                    UserService.checkSession().then(function(hasSession) {
                        console.log("Has Session ?", hasSession);
                        if (hasSession) 
                            return $state.go(toState.name, toParams);
                        else {
                            Modal("views/login-modal.html")
                            .then(function () {
                                return $state.go(toState.name, toParams);
                            })
                            .catch(function () {
                                return $state.go('home');
                            });
                        }
                    });
                } 
            });
            
        }
  );