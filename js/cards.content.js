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
    set_annot_target: null,
    on_click_move_cards: null
  },

  state = {
    coll: null,  // cards.model.models.coll
    card_id2view: {},
    loading: false
  },

  dom = {},

  init, configure,
  setColl, render, renderNoScroll, createCardView, onAddItem, onRemoveItem,
  moveCards, endMove,
  onScroll
  ;  // var

  configure = function(kv_map) {
    cards.util.updateObj(config, kv_map);
  };

  init = function(container) {
    dom.self = container.querySelector(config.self_selector);
    dom.cards = dom.self.querySelector('.cards-content-cards');
    // event handler
    // load more cards when scroll to bottom
    dom.self.addEventListener('scroll', onScroll, false);
    //dom.self.removeEventListener('scroll', onScroll);

  }; 

  setColl = function(coll) {
    if (state.coll !== null && coll.get('id') === state.coll.get('id')) {
      return;
    }

    if (state.coll !== null) {
      state.coll.get('cards').off('add', onAddItem);
      state.coll.get('cards').off('remove', onRemoveItem);
      state.coll.off('change:name', renderNoScroll);
    }

    state.coll = coll;
    console.log('content:', state.coll.get('id'), state.coll.get('name'));
    state.coll.get('cards').on('add', onAddItem);
    state.coll.get('cards').on('remove', onRemoveItem);
    state.coll.on('change:name', renderNoScroll);
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

  renderNoScroll = function() { render(false); };

  render = function(scroll_top) {
    if (scroll_top === undefined) {
      scroll_top = true;
    }
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
      if (scroll_top) {
        dom.self.scrollTop = 0;
      }
      onScroll();
    }
    else {
      state.loading = true;
      dom.self.classList.add('init-loading');
      state.coll.fetch_cards().then(function() {
        dom.self.scrollTop = 0;
        state.loading = false;
        dom.self.classList.remove('init-loading');
        onScroll();
      });
    }
  };

  onScroll = function(event) {
    var hidden_height = dom.self.scrollHeight - dom.self.clientHeight;
    //console.log(dom.self.scrollTop, hidden_height);
    if ((hidden_height - dom.self.scrollTop) < 20 || hidden_height === 0) {
      if (state.loading || state.coll.get('fetched') === 'all') {
        return;
      }
      console.log('load more');
      state.loading = true;
      dom.self.classList.add('loading');
      state.coll.fetch_cards().then(function() {
        state.loading = false;
        dom.self.classList.remove('loading');
        onScroll();
      });
    }
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
    }
    else if (idx === 0) {
      sibling = dom.cards.querySelector('.cards-item');
      if (sibling) {
        dom.cards.insertBefore(card_el, sibling);
      } else {
        dom.self.appendChild(card_el);
      }
    }
    else {  // idx > 0
      sibling = dom.cards.querySelectorAll('.cards-item')[idx];
      dom.cards.insertBefore(card_el, sibling);
    }

    // scroll into view
    //card_el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (idx === 0) {
      dom.self.scrollTop = 0;
    } else if ((typeof idx) !== 'number' && state.coll.get('type') === 'note') {
      card_el.scrollIntoView();
    }
    setTimeout(function() { card_el.classList.add('blink'); }, 300);
    setTimeout(function() { card_el.classList.remove('blink'); }, 600);
  };

  onRemoveItem = function(card) {
    var card_view = state.card_id2view[card.get('id')];
    card.set({ checked: false });
    // animation
    card_view.el.classList.add('blink-red');
    setTimeout(function() { card_view.el.classList.remove('blink-red'); }, 300);
    setTimeout(function() {
      card_view.destroy();
      delete state.card_id2view[card.get('id')];
    }, 600);
    //card_view.destroy();
    //delete state.card_id2view[card.get('id')];
  };

  endMove = function() {
    dom.self.classList.remove('annot-move-mode');
    dom.self.removeEventListener('click', config.on_click_move_cards);
  };

  moveCards = function(params) {
    config.on_click_move_cards = function(event) {
      var
      insert_target = event.target,
      targets = [], coll_clone, i, insert_target_id, card
      ;
      event.preventDefault();

      if (!insert_target.classList.contains('cards-item')) {
        insert_target = insert_target.parentNode;
        if (!insert_target.classList.contains('cards-item')) {
          return;
        }
      }
      insert_target_id = insert_target.getAttribute('card-id');
      // use clone to update
      coll_clone = state.coll.clone();
      // sort move targets and find insert_target_idx
      for (i = 0; i < coll_clone.get('cards').len(); i++) {
        card = coll_clone.get('cards').at(i);
        if (params.targets.get(card.get('id'))) {
          targets.push(card);
        }
      }

      // update clone
      targets.forEach(function(card) {
        coll_clone.get('cards').add(
          card, coll_clone.get('cards').indexOf(insert_target_id)
        );
      });

      params.start_sync();
      coll_clone.save().then(function(coll) {
        // update real model (not clone!)
        targets.forEach(function(card) {
          state.coll.get('cards').add(
            card, state.coll.get('cards').indexOf(insert_target_id)
          );
        });
        endMove();
        params.end_sync();
      });
    };

    dom.self.classList.add('annot-move-mode');
    dom.self.addEventListener('click', config.on_click_move_cards, false);
  };

  return {
    init: init,
    configure: configure,
    setColl: setColl,
    render: render,
    moveCards: moveCards, endMove: endMove
  };
}());
