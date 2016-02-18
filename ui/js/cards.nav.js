/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, Promise */

cards.nav = (function() {
  "use strict";
  var
  config = {
    self_selector: '.cards-nav',
    set_nav_anchor: null,
    set_content_anchor: null,
    index: null,  // collection of cards.model/models.coll
    create_coll: null,
    remove_editor_coll: null,
    get_current_coll: null
  },

  state = {
    self: 'closed',
    search_input: '',
    annot_targets: null
  },

  dom = {},
  view = {},

  init, configure, setDomMap,
  setTitle, setNavState, onClickToggleNav,
  updateAnnotTrigger, setAnnotTarget, annotate
  ;  // var

  setDomMap = function(container) {
    dom.self = container.querySelector(config.self_selector);
    dom.title = container.querySelector('.cards-nav-head .title');
    dom.nav_trigger = dom.self.querySelector('.nav-trigger');
    dom.annot_closer = dom.self.querySelector('.nav-annot-closer');
    dom.search_box = dom.self.querySelector('.search-input');
    dom.content = dom.self.querySelector('.cards-nav-content');
    dom.annotator = dom.self.querySelector('.cards-nav-annotator');
    dom.target_indicator = dom.self.querySelector('.annot-target-indicator');
    dom.annot_trigger = dom.self.querySelector('.annot-trigger');
  };

  configure = function(kv_map) {
    cards.util.updateObj(config, kv_map);
  };

  init = function(container) {
    // set dom map
    setDomMap(container);

    // set event handlers
    dom.nav_trigger.addEventListener('click', onClickToggleNav);
    dom.title.addEventListener('click', function(event) {
      event.preventDefault();
      config.set_nav_anchor(
        cards.util.cloneUpdateObj(state, { self: 'index' })
      );
    }, false);

    dom.annot_closer.addEventListener('click', function(event) {
      var promises = [];
      event.preventDefault();

      state.annot_targets.as_array().forEach(function(card_clone) {
        promises.push(card_clone.save());
      });

      dom.self.classList.add('annot-saving');
      Promise.all(promises).then(function(card_array) {
        dom.self.classList.remove('annot-saving');
        config.set_nav_anchor(
          cards.util.cloneUpdateObj(state, { self: 'closed' })
        );
      });
    }, false);

    dom.annot_trigger.querySelector('.delete').addEventListener(
      'click',
      function(event) {
        var yn, promises = [];
        event.preventDefault();
        yn = window.confirm(
          'Delete ' + state.annot_targets.len() + ' card'
            + ((state.annot_targets.len() > 1) ? 's.' : '.')
        );
        if (yn !== true) {
          return;
        }
        state.annot_targets.as_array().forEach(function(card_clone) {
          promises.push(card_clone.destroy());
        });
        dom.self.classList.add('annot-saving');
        Promise.all(promises).then(function(card_array) {
          dom.self.classList.remove('annot-saving');
        });
      },
      false
    );

    dom.annot_trigger.querySelector('.move').addEventListener(
      'click',
      function(event) {
        event.preventDefault();
        dom.self.classList.add('annot-move-mode');
        // TODO: move
      },
      false
    );

    dom.self.querySelector('.annot-move-control .annot-move-cancel')
      .addEventListener('click', function(event) {
        event.preventDefault();
        dom.self.classList.remove('annot-move-mode');
      });

    dom.annot_trigger.querySelector('.add-tag').addEventListener(
      'click',
      function(event) {
        event.preventDefault();
        annotate(state.annot_targets, 'tag');
      }, false
    );

    dom.annot_trigger.querySelector('.add-to-note').addEventListener(
      'click',
      function(event) {
        event.preventDefault();
        annotate(state.annot_targets, 'note');
      }, false
    );

    dom.annot_trigger.querySelector('.clear-check').addEventListener(
      'click',
      function(event) {
        var coll = config.get_current_coll(), card_id;
        event.preventDefault();
        while (state.annot_targets.len() > 0) {
          //state.annot_targets.at(0).set({ checked: false });
          card_id = state.annot_targets.at(0).get('id');
          coll.get('cards').get(card_id).set({ checked: false });
        }
      }, false
    );

    // render index
    view.index = cards.view.index.create(config.index);
    view.index.configure({
      set_content_anchor: config.set_content_anchor,
      create_coll: config.create_coll,
      remove_editor_coll: config.remove_editor_coll
    });
    dom.content.appendChild(view.index.render().el);

    // render annotator's index
    view.annot_index = cards.view.annot_index.create(config.index);
    view.annot_index.configure({ create_coll: config.create_coll });
    dom.annotator.appendChild(view.annot_index.render().el);

    // init annot targets
    state.annot_targets = cards.model_util.createCollection(
      cards.model.models.card
    );
    state.annot_targets.on('add', updateAnnotTrigger);
    state.annot_targets.on('remove', updateAnnotTrigger);
  };

  updateAnnotTrigger = function() {
    dom.target_indicator.innerHTML = String(state.annot_targets.len());
    if (state.annot_targets.len() > 0) {
      dom.self.classList.add('annot-trigger-opened');
      if (config.get_current_coll().get('type') !== 'note') {
        dom.self.classList.add('content-is-not-note');
      }
    } else {
      dom.self.classList.remove('annot-trigger-opened');
      setTimeout(function() {
        dom.self.classList.remove('content-is-not-note');
      }, 250);
    }
  };

  setAnnotTarget = function(card) {
    if (card.get('checked')) {
      // use clone
      state.annot_targets.add(card.clone());
    } else {
      state.annot_targets.remove(card.get('id'));
    }
  };

  annotate = function(cards_, annot_type) {
    view.annot_index.setState(cards_, annot_type);
    config.set_nav_anchor(
      cards.util.cloneUpdateObj(state, { self: 'annot' })
    );
  };

  setTitle = function(title) {
    dom.title.innerHTML = title;
  };

  onClickToggleNav = function(event) {
    var new_state = cards.util.cloneObj(state);
    event.preventDefault();
    if (state.self === 'closed') {
      new_state.self = 'index';
    } else if (state.self === 'index') {
      new_state.self = 'closed';
    }
    config.set_nav_anchor(new_state);
  };

  setNavState = function(nav_state) {
    if (nav_state === state.self) {
      return;
    }
    switch (nav_state) {
    case 'index':
      dom.self.classList.remove('annot-opened');
      dom.content.style.display = 'block';
      dom.self.classList.add('opened');
      state.self = 'index';
      break;

    case 'annot':
      if (!dom.self.classList.contains('opened')) {
        dom.content.style.display = 'none';
      }
      dom.self.classList.add('opened', 'annot-opened');
      state.self = 'annot';
      break;

    case 'closed':
      dom.self.classList.remove('opened', 'annot-opened');
      state.self = 'closed';
      break;

    default:
      //
    }
  };

  return {
    configure: configure,
    init: init,
    setNavState: setNavState,
    setTitle: setTitle,
    setAnnotTarget: setAnnotTarget,
    updateAnnotTrigger: updateAnnotTrigger,
    annotate: annotate
  };
}());
