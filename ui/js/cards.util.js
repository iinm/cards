/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, getComputedStyle*/

cards.util = (function() {
  "use strict";
  var
  cloneObj, updateObj, cloneUpdateObj,
  createElements, appendChildren, createElement,
  getPxPerEm,
  formatTmpl,
  makeAnchorMap, setAnchor
  ;

  cloneObj = function(obj) {
    var obj_clone = {}, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj_clone[key] = obj[key];
      }
    }
    return obj_clone;
  };

  updateObj = function(obj, kvs_update) {
    var key;
    for (key in kvs_update) {
      if (kvs_update.hasOwnProperty(key) && obj.hasOwnProperty(key)) {
        obj[key] = kvs_update[key];
      }
    }
  };

  cloneUpdateObj = function(obj, kvs_update) {
    var obj_clone = cloneObj(obj);
    updateObj(obj_clone, kvs_update);
    return obj_clone;
  };

  createElements = function(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes;
  };

  appendChildren = function(elems, parent) {
    while (elems.length > 0) {
      parent.appendChild(elems[0]);
    }
  };

  createElement = function(html) {
    return createElements(html)[0];
  };

  getPxPerEm = function(el) {
    return getComputedStyle(el, "").fontSize.match(/(\d*(\.\d*)?)px/)[1];
  };

  formatTmpl = function(tmpl, kvs) {
    var key;
    for (key in kvs) {
      if (kvs.hasOwnProperty(key)) {
        tmpl = tmpl.replace('{{' + key + '}}', kvs[key]);
      }
    }
    return tmpl;
  };

  makeAnchorMap = function() {
    var anchor_map = {};
    window.location.hash.substring(1).split('&').forEach(function(key_value) {
      if (key_value !== '') {
        key_value = key_value.split('=');
        anchor_map[key_value[0]] = key_value[1];
      }
    });
    return anchor_map;
  };

  setAnchor = function(anchor_map) {
    var key, kvs = [];
    for (key in anchor_map) {
      if (anchor_map.hasOwnProperty(key)) {
        kvs.push(key + '=' + anchor_map[key]);
      }
    }
    window.location.hash = '#' + kvs.join('&');
  };

  return {
    cloneObj: cloneObj,
    updateObj: updateObj,
    cloneUpdateObj: cloneUpdateObj,
    
    createElements: createElements,
    appendChildren: appendChildren,
    createElement: createElement,
    getPxPerEm: getPxPerEm,
    formatTmpl: formatTmpl,

    makeAnchorMap: makeAnchorMap,
    setAnchor: setAnchor
  };
}());
