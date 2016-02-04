/* global angular */ 

angular.module('appDirectives', [])
/**
 * @ngdoc directive
 * @name appDirectives.directive:phoneNumberInput
 * @description
 * Directive for phone number input with code and name
 */
.directive('phoneNumberInput', function($http, $log) {
   return {
     scope: {
         phoneNo: "=phoneNo",
         form: "=form"
     },
     controller: function($scope) {   
         if ( !$scope.phoneNo )
                $scope.phoneNo = {};
         
         $scope.setCode = function(code) {
             $scope.form.$dirty = true;
             $scope.phoneNo.code = code.dial_code;
             $scope.phoneNo.country = code.name;
             $scope.search = "";
         };
     },
     templateUrl: 'views/phone-number-input.html',
     link: function(scope, element, attrs, ctrl) {
         $http.get("/phoneCountryCode").success(function(phoneNumberList){
             scope.phoneNumberList = phoneNumberList;
             scope.selectedName = phoneNumberList[0].name;
         }).error(function(err){
             $log.error(err);
         });
     }
   };
})