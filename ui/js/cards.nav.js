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
    tmpl_index: null
  },

  state = {
    self: 'closed',
    search_box: 'closed',
    search_input: ''
  },

  dom = {},

  init, configure, setDomMap,
  renderIndex,
  setNavState, onClickToggleNav
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
        cards.util.cloneUpdateObj(state, { self: 'opened' })
      );
    }, false);

    //dom.annot_closer.addEventListener('click', function(event) {
    //  event.preventDefault();
    //  dom.self.classList.remove('annot-opened');
    //}, false);

    // template
    config.tmpl_index = document.getElementById('tmpl-nav-index').text.trim();
    renderIndex();
  };

  renderIndex = function() {
    var tag_index_el, note_index_el, tag_list, note_list;

    // get list
    tag_list = cards.fake.getTagList();
    note_list = cards.fake.getNoteList();

    // init
    dom.content.innerHTML = null;

    // notes
    // TODO: sort by created date
    note_index_el = cards.util.createElement(
      cards.util.formatTmpl(config.tmpl_index, { title: 'Notes'})
    );
    note_list.forEach(function(note) {
      note_index_el.appendChild(
        cards.util.createElement(
          cards.util.formatTmpl(
            '<li><i class="fa fa-book"></i>&nbsp; {{name}}</li>', note
          )
        )
      );
    });
    // tags
    // TODO: sort by num. of cards
    tag_index_el = cards.util.createElement(
      cards.util.formatTmpl(config.tmpl_index, { title: 'Tags'})
    );
    tag_list.forEach(function(tag) {
      tag_index_el.appendChild(
        cards.util.createElement(
          cards.util.formatTmpl(
            '<li><i class="fa fa-tag"></i>&nbsp; {{name}}</li>', tag
          )
        )
      );
    });

    // render
    dom.content.appendChild(note_index_el);
    dom.content.appendChild(tag_index_el);
  };

  onClickToggleNav = function(event) {
    var new_state = cards.util.cloneObj(state);
    event.preventDefault();
    if (state.self === 'closed') {
      new_state.self = 'opened';
    } else if (state.self === 'opened') {
      new_state.self = 'closed';
    }
    config.set_nav_anchor(new_state);
  };

  setNavState = function(nav_state) {
    if (nav_state === state.self) {
      return;
    }
    switch (nav_state) {
    case 'opened':
      dom.self.classList.add('opened');
      state.self = 'opened';
      break;

    case 'closed':
      dom.self.classList.remove('opened');
      state.self = 'closed';
      break;

    default:
      //
    }
  };

  return {
    configure: configure,
    init: init,
    setNavState: setNavState
  };
}());
