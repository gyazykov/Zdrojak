'use strict';



(function() {  

var module = angular.module('zdrojak.controller', []);

/**
 * App Controller
 * 
 */

module.controller('AppCtrl', ['$scope', 'basket', function($scope, basket){
  $scope.basket = basket;        
}]);


/**
 * Vyhledavani
 * 
 */

module.controller('MenuSearchCtrl', ['$scope', '$location', function($scope, $location) {
  $scope.search = function() {
    $location.url('/vyhledavani/' + $scope.query);    
  }
}]);


/**
 * Menu stranek.
 * 
 */

module.controller('MenuPagesCtrl', ['$scope', 'api', function($scope, api) {
  $scope.pages = api.page.index({fields: ['name', 'url']});
}]);


/**
 * Menu kategorii.
 * 
 */

module.controller('MenuCategoriesCtrl', ['$scope', 'api', function($scope, api) {
  $scope.categories = api.category.index();    
}]);


/**
 * Seznam produktu na uvodni strance.
 * 
 */

module.controller('IndexCtrl', ['$scope', 'api', function($scope, api) {
  $scope.products = api.product.homepage({homepage: true});  
}]);


/**
 * Vyhledavani
 * 
 */

module.controller('SearchCtrl', ['$scope', '$routeParams', 'api', function ($scope, $routeParams, api) {
  $scope.query = $routeParams.query;
  $scope.products = api.product.index({query: $scope.query});  
}]);


/**
 * Detail stranky
 * 
 */

module.controller('PageCtrl', ['$scope', '$routeParams', 'api', function ($scope, $routeParams, api) {
  $scope.page = api.page.show({url: $routeParams.page});
}]);


/**
 * Kategorie.
 * 
 */

module.controller('CategoryCtrl', ['$scope', '$routeParams', '$location', 'psearch', 'api', function ($scope, $routeParams, $location, psearch, api) { 
  //pocet produktu na stranku v kategorii
  $scope.limit = 10;
  
  var search = $location.search();
  var query = {category: $routeParams.category};
  
  $scope.category = api.category.show({url: $routeParams.category}, function(){
    var urlParams = psearch.getParamsFromUrl(search.filter);
    $scope.category.params.forEach(function(param){
      if (!Array.isArray(urlParams[param.code])) return;
      param.values.forEach(function(value){
        if(~urlParams[param.code].indexOf(value.code)) value.checked = true;   
      });
    });
    
    $scope.price   = psearch.getPriceFromUrl(urlParams, $scope.category.maxPrice);
    $scope.sort    = psearch.getSortFromUrl(search, 'price');
    $scope.current = psearch.getCurrentFromUrl(search, $scope.limit);
    $scope.offset  = psearch.getOffsetFromUrl(search, $scope.limit);
    $scope.load($scope.offset, $scope.limit); 
    
  });  
  
  /**
   * @param {Number} offset
   * @param {Number} limit
   */
  $scope.load = function(offset, limit) {
    var values = psearch.getValues($scope.category.params);
    values.push('price:' + $scope.price);
    
    query.filter = values.join('@');
    query.sort = $scope.sort;
    query.offset = offset || 0; 
    query.limit = limit || $scope.limit;    
    
    $scope.results = api.product.index(query, function(){
      if (!limit) $scope.current = 1;
      
    }); 
  }
 
  /**
   * @param {Number} offset
   * @param {Number} limit
   */
  $scope.filter = function(offset, limit) {
    $scope.load(offset, limit);
    $location.search({
      filter: query.filter, 
      sort: query.sort, 
      offset: query.offset, 
      limit: query.limit     
    });    
  }; 
}]);


/**
 * Detail produktu.
 * 
 */

module.controller('ProductCtrl', ['$scope', '$routeParams', '$location', 'api', 'basket', function Product($scope, $routeParams, $location, api, basket) {
  $scope.addToBasket = function(variant){
    if (!basket.exist($scope.product.id, variant.name)) {
      basket.add({
        id: $scope.product.id, 
        name: $scope.product.name, 
        url: $scope.product.url, 
        variant: variant.name, 
        price: $scope.product.price,
        quantity: 1
      });  
    }
    $location.path('/kosik');      
  }
  $scope.product = api.product.show({url: $routeParams.product});   
}]);


/**
 * Kosik.
 * 
 */

module.controller('BasketCtrl', ['$scope', '$location', 'basket', function ($scope, $location, basket) {
  $scope.step = 'basket';  
  $scope.products = basket.getAll();
  $scope.next = function() {
    $location.path('/zakaznicke-udaje');      
  };
}]);


/**
 * Udaje o zakaznikovi.
 * 
 * radio input v ng-repeat: https://github.com/angular/angular.js/issues/1100
 */

module.controller('CustomerCtrl', ['$scope', '$location', 'basket', 'transport', function ($scope, $location, basket, transport) {
  $scope.step = 'customer';
  if (!basket.hasProducts()) {
    $location.path('/kosik');    
    return;
  }
  
  $scope.customer  = basket.getCustomer();
  $scope.transport = basket.getTransport() || {code: 'personal'};
  $scope.transportMethods = transport.methods();
  
  $scope.next = function() {
    basket.updateCustomer($scope.customer);
    basket.updateTransport(transport.get($scope.transport.code));
    $location.path('/potvrzeni');      
  }
}]);


/**
 * Potvrzeni objednavky.
 * 
 */

module.controller('SummaryCtrl', ['$scope', '$location', 'api', 'basket', function ($scope, $location, api, basket) {
  $scope.step = 'summary';
  if (!basket.hasCustomer() || !basket.hasProducts()) {
    $location.path('/kosik');    
    return;
  }  
  
  $scope.products   = basket.getAll(); 
  $scope.customer   = basket.getCustomer();
  $scope.transport  = basket.getTransport();
  $scope.priceTotal = basket.priceTotal();
  
  $scope.next = function() {
    var data = {
      products: $scope.products,
      customer: $scope.customer,
      transport: $scope.transport
    };  
      
    api.order.create(data, function(info){
      $scope.number = info.number;    
      basket.clear();
    }); 
  }
}]);
    
})();