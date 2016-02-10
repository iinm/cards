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
    create_card: null,
    save_card: null,
    request_annot: null
  },

  data = { draft: null },
  state = { self: 'closed' },
  dom = {},

  init, configure, setDomMap,
  setEditorState, onClickToggleEditor,
  onClickSaveCard, setEditTarget,
  renderMeta
  ;  // var

  setDomMap = function(container) {
    dom.self = container.querySelector(config.self_selector);
    dom.editor_trigger = dom.self.querySelector('.editor-trigger');
    dom.control = dom.self.querySelector('.cards-editor-control');
    //dom.content_meta = dom.self.querySelector('.cards-editor-meta');
    dom.content_colls = dom.self.querySelector('.colls');
    dom.content_title = dom.self.querySelector('.title-input');
    dom.content_body = dom.self.querySelector('.body-input');
  };

  configure = function(kv_map) {
    cards.util.updateObj(config, kv_map);
  };

  init = function(container) {
    // set dom map
    setDomMap(container);

    // set event handler
    dom.editor_trigger.addEventListener('click', onClickToggleEditor, false);
    dom.control.querySelector('.save').addEventListener(
      'click', onClickSaveCard, false
    );
    dom.control.querySelector('.add-tag').addEventListener(
      'click', function(event) {
        event.preventDefault();
        config.request_annot([data.draft], 'tag');
      }, false
    );
    dom.control.querySelector('.add-to-note').addEventListener(
      'click', function(event) {
        event.preventDefault();
        config.request_annot([data.draft], 'note');
      }, false
    );
  };

  setEditTarget = function(card) {
    if (!card) {
      dom.content_title.innerHTML = null;
      dom.content_body.innerHTML = null;
      dom.content_colls.innerHTML = null;
      data.draft = null;
      console.log('draft discard');
      return;
    }
    
    if (data.draft) {
      data.draft.get('colls').off('add', renderMeta);
      data.draft.get('colls').off('remove', renderMeta);
    }

    data.draft = card;
    dom.content_title.innerHTML = card.get('title');
    dom.content_body.innerHTML = card.get('body');
    renderMeta();
    config.set_editor_anchor('opened');

    data.draft.get('colls').on('add', renderMeta);
    data.draft.get('colls').on('remove', renderMeta);
  };

  renderMeta = function() {
    dom.content_colls.innerHTML = null;
    data.draft.get('colls').each(function(coll) {
      var icon = ((coll.get('type') === 'tag') ? 'tag' : 'book');
      dom.content_colls.appendChild(
        cards.util.createElement(
          cards.util.formatTmpl(
            '<li><i class="fa fa-{{icon}}"></i>&nbsp;{{name}}</li>',
            { icon: icon, name: coll.get('name') }
          )
        )
      );
    });
  };

  onClickSaveCard = function(event) {
    var card;
    event.preventDefault();

    if (dom.content_title.innerHTML.trim().length === 0
        && dom.content_body.innerHTML.trim().length === 0
       ) {
      // skip if body is empty
      return;
    }

    data.draft.set({
      title: dom.content_title.innerHTML,
      body: dom.content_body.innerHTML
    });

    card = config.save_card(data.draft);
    if (card) {
      setEditTarget(null);
      config.set_editor_anchor('closed');
    }
  };

  setEditorState = function(editor_state) {
    if (editor_state === state.self) {
      return;
    }
    switch (editor_state) {
    case 'opened':
      dom.self.classList.add('opened');
      dom.content_title.setAttribute('contenteditable', 'true');
      dom.content_body.setAttribute('contenteditable', 'true');

      // create new card
      if (!data.draft) {
        setEditTarget(config.create_card({}));
      }

      state.self = 'opened';
      break;

    case 'closed':
      dom.self.classList.remove('opened');
      dom.content_title.setAttribute('contenteditable', 'false');
      dom.content_body.setAttribute('contenteditable', 'false');

      if (dom.content_title.innerHTML.trim().length === 0
          && dom.content_body.innerHTML.trim().length === 0
          //&& data.draft.get('colls').len() === 0
         ) {
        // remove draft
        setEditTarget(null);
      }

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
    setEditorState: setEditorState,
    setEditTarget: setEditTarget
  };
}());
