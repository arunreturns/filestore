/* global angular */ 

angular.module('appDirectives', [])

.directive('toggle', function(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
          if (attrs.toggle === "tooltip"){
            $(element).tooltip();
          }
          if (attrs.toggle === "popover"){
            $(element).popover();
          }
        }
    };
})

.directive('capitalize', function() {
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
        var capitalize = function(inputValue) {
           if(inputValue === undefined) inputValue = '';
           var capitalized = inputValue.toUpperCase();
           if(capitalized !== inputValue) {
              modelCtrl.$setViewValue(capitalized);
              modelCtrl.$render();
            }         
            return capitalized;
         };
         modelCtrl.$parsers.push(capitalize);
         capitalize(scope[attrs.ngModel]);  // capitalize initial value
     }
   };
})

.directive('modal', function () {
    return {
        template:   '<div class="modal fade">' +
                    '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                    '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                    '<h4 class="modal-title">{{ title }}</h4>' +
                    '</div>' +
                    '<div class="modal-body" ng-transclude></div>' +
                    '</div>' +
                    '</div>' +
                    '</div>',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: true,
        link: function postLink(scope, element, attrs) {
            scope.title = attrs.title;

            scope.$watch(attrs.visible, function (value) {
                if (value === true) $(element).modal('show');
                else $(element).modal('hide');
            });

            $(element).on('shown.bs.modal', function () {
                scope.$apply(function () {
                    scope.$parent[attrs.visible] = true;
                });
            });

            $(element).on('hidden.bs.modal', function () {
                scope.$apply(function () {
                    scope.$parent[attrs.visible] = false;
                });
            });
        }
    };
})

.directive('phoneNumberInput', function($http, $log) {
   return {
     scope: {
         phoneNo: "=phoneNo",
     },
     controller: function($scope) {   
         if ( !$scope.phoneNo )
                $scope.phoneNo = {};
         
         $scope.setCode = function(code) {
             
        
             $scope.phoneNo.code = code.dial_code;
             $scope.phoneNo.country = code.name;
             $scope.search = "";
         };
     },
     templateUrl: 'views/phone-number-input.html',
     link: function(scope, element, attrs, ctrl) {
         $http.get("/phoneCountryCode").success(function(phoneNumberList){
             $log.info(phoneNumberList);
             scope.phoneNumberList = phoneNumberList;
             scope.selectedName = phoneNumberList[0].name;
         }).error(function(err){
             $log.error(err);
         });
     }
   };
})