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
    self_selector: '.cards-content',
    set_edit_target: null,
    set_annot_target: null
  },

  state = {
    coll: null  // cards.model/models.coll
  },

  dom = {},

  init, configure,
  setColl, render, onAddRenderItem, onRemoveItem
  ;  // var

  configure = function(kv_map) {
    cards.util.updateObj(config, kv_map);
  };

  init = function(container) {
    dom.self = container.querySelector(config.self_selector);
  }; 

  setColl = function(coll) {
    if (state.coll !== null && coll.get('id') === state.coll.get('id')) {
      return;
    }
    if (state.coll !== null) {
      // TODO: これどうにかならない？
      state.coll.get('cards').off('add', onAddRenderItem);
      state.coll.get('cards').off('add', onAddRenderItem);
      state.coll.get('cards').off('remove', onRemoveItem);
    }
    state.coll = coll;
    state.coll.get('cards').on('add', onAddRenderItem);
    state.coll.get('cards').on('remove', onRemoveItem);
    render();
  };

  render = function() {
    dom.self.innerHTML = null;
    state.coll.get('cards').each(function(model) {
      var card_view = cards.view.card.create(model);
      card_view.configure({
        set_edit_target: config.set_edit_target,
        set_annot_target: config.set_annot_target
      });
      dom.self.appendChild(card_view.render().el);
    });
  };

  onAddRenderItem = function(card) {
    var sibling, card_view, card_el;
    card_view = cards.view.card.create(card);
    card_view.configure({
      set_edit_target: config.set_edit_target,
      set_annot_target: config.set_annot_target
    });
    card_el = card_view.render().el;

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

  onRemoveItem = function(card) {
    // TODO: ちょっと気持ち悪い
    dom.self.querySelector('#' + card.get('id')).remove();
  };

  return {
    init: init,
    configure: configure,
    setColl: setColl,
    render: render
  };
}());
