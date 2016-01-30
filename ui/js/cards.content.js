/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.content = (function() {
  "use strict";
  var
  config = {
    self_selector: '.cards-content'
  },

  dom = {},

  init
  ;  // var

  init = function(container) {
    dom.self = container.querySelector(config.self_selector);
  }; 

  return { init: init };
}());
