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
    coll: null,  // cards.model/models.coll
    card_id2view: {}
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
      state.coll.get('cards').off('remove', onRemoveItem);
    }
    state.coll = coll;
    console.log(state.coll.get('name'));
    state.coll.get('cards').on('add', onAddRenderItem);
    state.coll.get('cards').on('remove', onRemoveItem);
    render();
  };

  render = function() {
    //dom.self.innerHTML = null;
    Object.keys(state.card_id2view).forEach(function(card_id) {
      state.card_id2view[card_id].destroy();
    });
    state.card_id2view = {};
    
    state.coll.get('cards').each(function(model) {
      var card_view = cards.view.card.create(model);
      state.card_id2view[model.get('id')] = card_view;
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
    state.card_id2view[card.get('id')] = card_view;

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
    console.log('remove card view');
    //dom.self.querySelector('#' + card.get('id')).remove();
    state.card_id2view[card.get('id')].destroy();
    delete state.card_id2view[card.get('id')];
  };

  return {
    init: init,
    configure: configure,
    setColl: setColl,
    render: render
  };
}());
