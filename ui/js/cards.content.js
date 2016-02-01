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

  state = {
    self: null,
    coll: null  // cards.model/models.coll
  },

  dom = {},

  init, setColl, render
  ;  // var

  init = function(container) {
    dom.self = container.querySelector(config.self_selector);
  }; 

  setColl = function(coll) {
    if (coll.get('id') === state.self) {
      return;
    }
    state.coll = coll;
    state.self = coll.get('id');
    render();
  };

  render = function() {
    dom.self.innerHTML = null;
    state.coll.get('cards').each(function(model) {
      dom.self.appendChild(cards.view.card.create(model).render().el);
    });
  };

  return {
    init: init,
    setColl: setColl,
    render: render
  };
}());
