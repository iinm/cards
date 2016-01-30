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
    self: null
  },

  dom = {},

  init, render
  ;  // var

  init = function(container) {
    dom.self = container.querySelector(config.self_selector);
  }; 

  render = function(collection_id) {
    var card_models;

    if (collection_id === state.self) {
      return;
    }

    card_models = cards.fake.getCards();
    console.log('render');
    dom.self.innerHTML = null;
    card_models.forEach(function(model) {
      dom.self.appendChild(cards.view.item.create({ model: model }));
    });
    state.self = collection_id;
  };

  return {
    init: init,
    render: render
  };
}());
