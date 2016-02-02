/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.editor = (function() {
  "use strict";
  var
  config = {
    self_selector: '.cards-editor',
    set_editor_anchor: null,
    save_card: null
  },
  
  state = {
    self: 'closed'
  },

  dom = {},

  init, configure, setDomMap,
  setEditorState, onClickToggleEditor,
  onClickSaveCard
  ;  // var

  setDomMap = function(container) {
    dom.self = container.querySelector(config.self_selector);
    dom.editor_trigger = dom.self.querySelector('.editor-trigger');
    //dom.control = dom.self.querySelector('.cards-editor-control');
    dom.content = dom.self.querySelector('.cards-editor-content');
    dom.content_title = dom.self.querySelector('.title-input');
    dom.content_body = dom.self.querySelector('.body-input');
    dom.save_trigger = dom.self.querySelector('.save');
  };

  configure = function(kv_map) {
    cards.util.updateObj(config, kv_map);
  };

  init = function(container) {
    // set dom map
    setDomMap(container);

    // set event handler
    dom.editor_trigger.addEventListener('click', onClickToggleEditor, false);
    dom.save_trigger.addEventListener('click', onClickSaveCard, false);
  };

  onClickSaveCard = function(event) {
    // TODO
    var data;
    event.preventDefault();
    data = {
      title: dom.content_title.innerHTML,
      body: dom.content_body.innerHTML
    };
    console.log(data);
  };

  setEditorState = function(editor_state) {
    if (editor_state === state.self) {
      return;
    }
    switch (editor_state) {
    case 'opened':
      dom.self.classList.add('cards-editor-opened');
      dom.content_title.setAttribute('contenteditable', 'true');
      dom.content_body.setAttribute('contenteditable', 'true');

      state.self = 'opened';
      break;

    case 'closed':
      dom.self.classList.remove('cards-editor-opened');
      dom.content_title.setAttribute('contenteditable', 'false');
      dom.content_body.setAttribute('contenteditable', 'false');

      state.self = 'closed';
      break;

    default:
      //
    }
  };

  onClickToggleEditor = function(event) {
    event.preventDefault();
    if (state.self === 'opened') {
      config.set_editor_anchor('closed');
    } else if (state.self === 'closed') {
      config.set_editor_anchor('opened');
    }
  };

  return {
    configure: configure,
    init: init,
    setEditorState: setEditorState
  };
}());
