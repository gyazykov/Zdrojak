
/**
 * Trida pro zpracovani parametru v URL pri parametrickem hledani/strankovani.
 * 
 * Konfiguracni parametry:
 *   limit - maximalni pocet objektu na stranku
 *   orderColumns - sloupce, podle kterych je mozne radit
 * 
 * @param {Object} config Konfiguracni objekt.
 */

function ParametricSearch(config) {
  this._limit  = config.limit;
  this._orderColumns = config.orderColumns;
}


/**
 * Vraci vsechny parametry z URL.
 * 
 * @return {Object}
 */

ParametricSearch.prototype.getParams = function() {
  return this._params;
};


/**
 * Vraci hodnotu jednoho parametru z URL. 
 * Pokud parametr neexistuje, vraci se hodnota predana v parametru def.
 * 
 * @param {String} name Nazev parametru
 * @param {String} def  Defaultni hodnota
 * @return {Object}
 */

ParametricSearch.prototype.getParam = function(name, def) {
  if (this._isUndefined(this._params[name])) {
    return def;    
  }
  return this._params[name] || def;
};


/**
 * Vraci hodnotu jednoho parametru v parametru filter. 
 * Pokud hodnota neexistuje, vraci se hodnota predana v parametru def.
 * 
 * Priklad URL:
 *   /abc?filter=aaa:2@bbb:7,3
 *   
 *   ps.getFilterParam('aaa') vrati ['2'] 
 *   ps.getFilterParam('bbb') vrati ['7','3']  
 *   ps.getFilterParam('ccc', 42) vrati '42'   
 * 
 * @param {String} name Nazev parametru
 * @param {String} def  Defaultni hodnota
 * @return {Object}
 */

ParametricSearch.prototype.getFilterParam = function(name, def) {
  var filter = this.getParam('filter');
  if (this._isUndefined(filter)) {
    return def;    
  }
  return filter[name] || def;
};


/**
 * Vraci hodnotu jednoho parametru v parametru filter jako retezec.
 * Pokud hodnota neexistuje, vraci se hodnota predana v parametru def.
 * 
 * Priklad URL:
 *   /abc?filter=aaa:2@bbb:7,3
 *   
 *   ps.getFilterParam('aaa') vrati '2'   
 * 
 * @param {String} name Nazev parametru
 * @param {String} def  Defaultni hodnota
 * @return {Object}
 */

ParametricSearch.prototype.getFilterParamAsString = function(name, def) {
  return this.getFilterParam(name, def).toString();   
};


/**
 * Nahraje paramtry z URL.
 * 
 * @param {Object} params 
 */

ParametricSearch.prototype.setParams = function(params) {
  this._params = params;
  this._parseFilter();
};


/**
 * Vraci pocet polozek na stranku.
 * 
 * @return {Number}
 */

ParametricSearch.prototype.getLimit = function() {
  return this._limit;    
};


/**
 * Vraci aktualni cislo stranky.
 * 
 * Nejmensi cislo stranky je 1, pokud je cislo stranky nizsi, je vracena 1.
 * 
 * @return {Number}
 */

ParametricSearch.prototype.getPage = function() {
  var offset = this._params.offset;
  if (this._isUndefined(offset)) return 1;
  var page = (offset / this.getLimit()) + 1; 
  if (page < 1) return 1;
  if (offset % this.getLimit() !== 0) return 1;
  return page;
};


/**
 * Vrati cislo zaznamu, od ktereho se maji vracet vysledky.
 * 
 * @return {Number}
 */

ParametricSearch.prototype.getOffset = function() {
  if (this.getPage() === 1) return 0;
  return this._params.offset;
};


/**
 * Vraci sloupec, podle ktereho se ma radit. 
 * Neni-li predan jako parametr, vezme se prvni z testovanych sloupcu.
 * 
 * @return {String}
 */

ParametricSearch.prototype.getOrder =  function() {
  var key = this._orderColumns.indexOf(this._params.order);
  if (~key) {
    return this._orderColumns[key];
  } else {
    return this._orderColumns[0];  
  }
};


/**
 * Projde vsechny parametry v parametru filter a vytvori z nich objekt.
 * 
 * Priklad URL:
 *   /abc?order=price&filter=aaa:2@bbb:7,3
 * 
 *   ps.getParams() vrati {order: price, filter: {aaa: ['2'], bbb: ['7', '3']}}
 */

ParametricSearch.prototype._parseFilter = function() {
  var params = {};
  var filter = this._params.filter;
  if (this._isString(filter)) {
    filter.split('@').forEach(function(rule){
      var parts = rule.split(':');
      if (parts.length !== 2) return;
      params[parts[0]] = parts[1].split(',');
    });
  } 
  this._params.filter = params; 
};


ParametricSearch.prototype._isUndefined = function(val) {
  return typeof val === 'undefined';    
};


ParametricSearch.prototype._isString = function(val) {
  return typeof val === 'string';    
};