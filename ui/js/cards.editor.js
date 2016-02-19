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
    request_annot: null
  },

  data = { draft: null },
  state = { self: 'closed' },
  dom = {},

  init, configure, setDomMap,
  onClickToggleEditor, onClickSaveCard,
  setEditorState, setEditTarget, getDraft,
  removeColl, renderMeta
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
        var annot_targets;
        event.preventDefault();
        annot_targets = cards.model_util.createCollection(
          cards.model.models.card
        );
        annot_targets.add(data.draft);
        config.request_annot(annot_targets, 'tag');
      }, false
    );
    dom.control.querySelector('.add-to-note').addEventListener(
      'click', function(event) {
        var annot_targets;
        event.preventDefault();
        annot_targets = cards.model_util.createCollection(
          cards.model.models.card
        );
        annot_targets.add(data.draft);
        config.request_annot(annot_targets, 'note');
      }, false
    );
  };

  removeColl = function(coll_id) {
    // draftはcollから見えないので，collが削除，変更された時にこれを使って，
    // draft.get('colls')を更新する．
    if (data.draft) {
      data.draft.get('colls').remove(coll_id);
    }
  };

  setEditTarget = function(card) {
    if (data.draft) {
      data.draft.get('colls').off('add', renderMeta);
      data.draft.get('colls').off('remove', renderMeta);
    }

    if (!card) {
      dom.content_title.innerHTML = null;
      dom.content_body.innerHTML = null;
      dom.content_colls.innerHTML = null;
      data.draft = null;
      console.log('draft discard');
      return;
    }

    // make copy
    data.draft = card.clone();

    dom.content_title.innerHTML = data.draft.get('title');
    dom.content_body.innerHTML = data.draft.get('body');
    renderMeta();
    config.set_editor_anchor('opened');

    data.draft.get('colls').on('add', renderMeta);
    data.draft.get('colls').on('remove', renderMeta);
  };

  renderMeta = function() {
    var coll_array = [];
    dom.content_colls.innerHTML = null;
    // sort: note -> tag
    data.draft.get('colls').each(function(coll) {
      if (coll.get('type') === 'note') {
        coll_array.push(coll);
      }
    });
    data.draft.get('colls').each(function(coll) {
      if (coll.get('type') === 'tag') {
        coll_array.push(coll);
      }
    });
    coll_array.forEach(function(coll) {
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
    event.preventDefault();

    if (dom.content_title.innerHTML.trim().length === 0
        && dom.content_body.innerHTML.trim().length === 0
       ) {
      // skip if body is empty
      config.set_editor_anchor('closed');
      return;
    }

    data.draft.set({
      title: dom.content_title.innerHTML,
      body: dom.content_body.innerHTML
    });

    dom.self.classList.add('saving');
    data.draft.save().then(function(card) {
      if (card) {
        setEditTarget(null);
        dom.self.classList.remove('saving');
        config.set_editor_anchor('closed');
      }
    });
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

  getDraft = function() { return data.draft; };

  return {
    configure: configure,
    init: init,
    setEditorState: setEditorState,
    setEditTarget: setEditTarget,
    getDraft: getDraft,
    removeColl: removeColl
  };
}());
