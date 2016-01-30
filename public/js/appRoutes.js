angular.module('appRoutes', ['ui.router'])
.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'views/main-screen.html',
            controller: 'MainCtrl',
            data: {
                requireLogin: false
            },
            onEnter: function($state, UserService) {
                UserService.checkSession();
            }
        }).state('upload', {
            url: '/upload',
            templateUrl: 'views/upload-page.html',
            controller: 'UploadCtrl',
            data: {
                requireLogin: true
            }
        }).state('view', {
            url: '/view',
            templateUrl: 'views/view-files.html',
            controller: 'ViewCtrl',
            data: {
                requireLogin: true
            }
        }).state('server', {
            url: '/server',
            templateUrl: 'views/server-result.html',
            controller: 'ServerCtrl',
            data: {
                requireLogin: true
            }
        }).state('signup', {
            url: '/signup',
            templateUrl: 'views/signup.html',
            controller: 'SignupCtrl',
            data: {
                requireLogin: false
            }
        }).state('profile', {
            url: '/profile',
            templateUrl: 'views/profile.html',
            controller: 'LoginCtrl',
            data: {
                requireLogin: true
            }
        });
});