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
    coll: null,  // cards.model.models.coll
    card_id2view: {}
  },

  dom = {},

  init, configure,
  setColl, render, createCardView, onAddItem, onRemoveItem,
  onScroll
  ;  // var

  configure = function(kv_map) {
    cards.util.updateObj(config, kv_map);
  };

  init = function(container) {
    dom.self = container.querySelector(config.self_selector);
    dom.cards = dom.self.querySelector('.cards-content-cards');
  }; 

  setColl = function(coll) {
    if (state.coll !== null && coll.get('id') === state.coll.get('id')) {
      return;
    }
    if (state.coll !== null) {
      // TODO: これどうにかならない？
      state.coll.get('cards').off('add', onAddItem);
      state.coll.get('cards').off('remove', onRemoveItem);
    }
    state.coll = coll;
    console.log(state.coll.get('name'));
    state.coll.get('cards').on('add', onAddItem);
    state.coll.get('cards').on('remove', onRemoveItem);
    render();
  };

  createCardView = function(card) {
    var card_view = cards.view.card.create(card);
    state.card_id2view[card.get('id')] = card_view;
    card_view.configure({
      set_edit_target: config.set_edit_target,
      set_annot_target: config.set_annot_target
    });
    return card_view;
  };

  render = function() {
    dom.self.removeEventListener('scroll', onScroll);
    // destroy previous collection
    Object.keys(state.card_id2view).forEach(function(card_id) {
      state.card_id2view[card_id].destroy();
    });
    state.card_id2view = {};
    
    if (state.coll.get('fetched')) {
      state.coll.get('cards').each(function(card) {
        var card_view = createCardView(card);
        dom.cards.appendChild(card_view.render().el);
      });
      // load more cards when scroll to bottom
      dom.self.addEventListener('scroll', onScroll, false);
    }
    else {
      dom.self.classList.add('init-loading');
      state.coll.fetch_cards().then(function() {
        dom.self.scrollTop = 0;
        dom.self.classList.remove('init-loading');
      });
      // load more cards when scroll to bottom
      dom.self.addEventListener('scroll', onScroll, false);
    }
  };

  onScroll = function(event) {
    // TODO: load more cards
    //console.log(dom.self.scrollTop);
    //console.log(dom.self.scrollHeight - dom.self.clientHeight);
  };

  onAddItem = function(card, idx) {
    var sibling, card_view, card_el;

    card_view = state.card_id2view[card.get('id')];
    if (card_view) {
      card_view.destroy();
    }

    card_view = createCardView(card);
    card_el = card_view.render().el;

    if ((typeof idx) !== 'number') {
      dom.cards.appendChild(card_el);
    } else {
      sibling = dom.cards.querySelector('.cards-item');
      if (sibling) {
        dom.cards.insertBefore(card_el, sibling);
      } else {
        dom.self.appendChild(card_el);
      }
    }
    //card_el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card_el.scrollIntoView();
  };

  onRemoveItem = function(card) {
    console.log('remove card view');
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
