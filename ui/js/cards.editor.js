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
  onClickSaveCard,
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

    // create draft
    data.draft = config.create_card({});
    data.draft.get('colls').on('add', function(coll) {
      console.log(coll.get('name') + ' is added.');
      renderMeta();
    });
    data.draft.get('colls').on('remove', function(coll) {
      console.log(coll.get('name') + ' is removed.');
      renderMeta();
    });

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
    var data_, coll_ids = [];
    event.preventDefault();
    data.draft.get('colls').each(function(coll) {
      coll_ids.push(coll.get('id'));
    });
    data_ = {
      title: dom.content_title.innerHTML,
      body: dom.content_body.innerHTML,
      coll_ids: coll_ids
    };

    if (data_.title.trim().length === 0 && data_.body.trim().length === 0) {
      // skip if body is empty
      return;
    }

    console.log(cards.fake.saveCard(data_));
    // TODO: update related collections
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

      state.self = 'opened';
      break;

    case 'closed':
      dom.self.classList.remove('opened');
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
