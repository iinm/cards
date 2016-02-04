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
    coll: null  // cards.model/models.coll
  },

  dom = {},

  init, setColl, render, onAddRenderItem
  ;  // var

  init = function(container) {
    dom.self = container.querySelector(config.self_selector);
  }; 

  setColl = function(coll) {
    if (state.coll !== null && coll.get('id') === state.coll.get('id')) {
      return;
    }
    if (state.coll !== null) {
      state.coll.get('cards').off('add', onAddRenderItem);
    }
    state.coll = coll;
    state.coll.get('cards').on('add', onAddRenderItem);
    render();
  };

  render = function() {
    dom.self.innerHTML = null;
    state.coll.get('cards').each(function(model) {
      dom.self.appendChild(cards.view.card.create(model).render().el);
    });
  };

  onAddRenderItem = function(card) {
    var sibling, card_el = cards.view.card.create(card).render().el;
    if (state.coll.get('type') === 'note') {
      dom.self.appendChild(card_el);
    } else {
      sibling = dom.self.querySelector('.cards-item');
      if (sibling) {
        dom.self.insertBefore(card_el, sibling);
      } else {
        dom.self.appendChild(card_el);
      }
    }
    //card_el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card_el.scrollIntoView();
  };

  return {
    init: init,
    setColl: setColl,
    render: render
  };
}());
