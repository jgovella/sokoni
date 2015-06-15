angular.module('starter.directive', [])
        .directive('loginDialog', function (AUTH_EVENTS) {
  return {
    restrict: 'A',
    template: '<div ng-if="visible" ng-include="\'templates/login-form.html\'">',
    link: function (scope) {
      var showDialog = function () {
        scope.visible = true;
      };
  
      scope.visible = false;
      scope.$on(AUTH_EVENTS.notAuthenticated, showDialog);
    }
  };
});