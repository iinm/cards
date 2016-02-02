/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.nav = (function() {
  "use strict";
  var
  config = {
    self_selector: '.cards-nav',
    set_nav_anchor: null,
    index: null  // collection of cards.model/models.coll
  },

  state = {
    self: 'closed',
    search_input: ''
  },

  dom = {},
  view = {},

  init, configure, setDomMap,
  renderIndex,
  setNavState, onClickToggleNav,
  annotate
  ;  // var

  setDomMap = function(container) {
    dom.self = container.querySelector(config.self_selector);
    dom.title = container.querySelector('.cards-nav-head .title');
    dom.nav_trigger = dom.self.querySelector('.nav-trigger');
    dom.annot_closer = dom.self.querySelector('.nav-annot-closer');
    dom.search_box = dom.self.querySelector('.search-input');
    dom.content = dom.self.querySelector('.cards-nav-content');
    dom.annotator = dom.self.querySelector('.cards-nav-annotator');
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
      event.preventDefault();
      config.set_nav_anchor(
        cards.util.cloneUpdateObj(state, { self: 'closed' })
      );
    }, false);

    renderIndex();

    view.annot_index = cards.view.annot_index.create(config.index);
    dom.annotator.appendChild(view.annot_index.render().el);

    // test
    //for (var i = 0; i < config.index.len(); i++) {
    //  var instance = config.index.at(i);
    //config.index.each(function(instance) {
    //  console.log('-- ' + instance.get('id'));
    //  console.log(instance.get('name'));
    //  console.log(instance.get('type'));
    //});
  };

  annotate = function(card_array, annot_type) {
    view.annot_index.setState(card_array, annot_type);
    config.set_nav_anchor(
      cards.util.cloneUpdateObj(state, { self: 'annot' })
    );
  };

  renderIndex = function() {
    dom.content.innerHTML = null;
    dom.content.appendChild(cards.view.index.create(config.index).render().el);
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
    annotate: annotate
  };
}());
