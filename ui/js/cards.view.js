/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.view = {};

cards.view.item = (function() {
  "use strict";
  var
  config = {
    tmpl_id: 'tmpl-item',
    tmpl: null
  },
  create
  ;

  create = function() {
    var el, self = { state: { checked: false } }, toggleCheck;

    if (!config.tmpl) {
      config.tmpl = document.getElementById(config.tmpl_id).innerText.trim();
    }

    toggleCheck = function(event) {
      if (!self.state.checked) {
        el.classList.add('checked');
        self.state.checked = true;
      } else {
        el.classList.remove('checked');
        self.state.checked = false;
      }
    };

    el = cards.util.createElement(config.tmpl);
    el.querySelector('.item-check-trigger').addEventListener(
      'click', toggleCheck, false
    );
    return el;
  };

  return { create: create };
}());
