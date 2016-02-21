/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, getComputedStyle, Promise*/

cards.util = (function() {
  "use strict";
  var
  cloneObj, updateObj, cloneUpdateObj,
  createElements, appendChildren, createElement, escape, unescape,
  getPxPerEm,
  formatTmpl,
  makeAnchorMap, setAnchor,
  $http
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

  escape = function(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  unescape = function(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent;
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
    //window.location.replace(window.location.pathname + '#' + kvs.join('&'));
  };

  // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
  // A-> $http function is implemented in order to follow the standard Adapter pattern
  $http = function(url) {
    // A small example of object
    var core = {

      // Method that performs the ajax request
      ajax : function (method, url, args) {

        // Creating a promise
        var promise = new Promise( function (resolve, reject) {

          // Instantiates the XMLHttpRequest
          var
          client = new XMLHttpRequest(), uri = url,
          key, argcount = 0
          ;

          if (args && (method === 'POST' || method === 'PUT')) {
            uri += '?';
            for (key in args) {
              if (args.hasOwnProperty(key)) {
                if (argcount++) {
                  uri += '&';
                }
                uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
              }
            }
          }

          //client.open(method, uri);
          //client.send();

          client.onload = function () {
            if (this.status >= 200 && this.status < 300) {
              // Performs the function "resolve" when this.status is equal to 2xx
              resolve(this.response);
            } else {
              // Performs the function "reject" when this.status is different than 2xx
              reject(this.statusText);
            }
          };

          client.onerror = function () {
            reject(this.statusText);
          };

          client.open(method, uri);
          client.send();
        });

        // Return the promise
        return promise;
      }
    };

    // Adapter pattern
    return {
      'get' : function(args) {
        return core.ajax('GET', url, args);
      },
      'post' : function(args) {
        return core.ajax('POST', url, args);
      },
      'put' : function(args) {
        return core.ajax('PUT', url, args);
      },
      'delete' : function(args) {
        return core.ajax('DELETE', url, args);
      }
    };
  };  // $http

  return {
    cloneObj: cloneObj,
    updateObj: updateObj,
    cloneUpdateObj: cloneUpdateObj,
    
    createElements: createElements,
    appendChildren: appendChildren,
    createElement: createElement,
    escape: escape, unescape: unescape,
    getPxPerEm: getPxPerEm,
    formatTmpl: formatTmpl,

    makeAnchorMap: makeAnchorMap,
    setAnchor: setAnchor,

    $http: $http
  };
}());
