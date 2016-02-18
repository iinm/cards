/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.shell = (function() {
  "use strict";
  var
  data = { index: null },
  state = {
    anchor_map: {}
  },
  
  init,
  changeAnchorPart, onHashchange,
  setNavAnchor, setEditorAnchor, setContentAnchor,
  createCard, requestAnnot
  ;  // var

  changeAnchorPart = function(kv_map) {
    var anchor_map_update, key;
    anchor_map_update = cards.util.cloneObj(state.anchor_map);
    for (key in kv_map) {
      if (kv_map.hasOwnProperty(key)) {
        anchor_map_update[key] = kv_map[key];
      }
    }
    cards.util.setAnchor(anchor_map_update);
  };

  setNavAnchor = function(nav_state) {
    changeAnchorPart({
      nav: nav_state.self,
      annot_targets: (nav_state.annot_targets.len() > 0 ? 'true' : 'false'),
      q: nav_state.search_input
    });
  };

  setContentAnchor = function(coll_id) {
    changeAnchorPart({ content: coll_id, nav: 'closed' });
  };

  requestAnnot = function(card_array, annot_type) {
    // card_array: array of model/models.card
    // annot_type: 'tag' of 'note'
    console.log('annot requested');
    cards.nav.annotate(card_array, annot_type);
  };

  setEditorAnchor = function(editor_state) {
    changeAnchorPart({ editor: editor_state });
  };

  onHashchange = function(event) {
    var
    anchor_map = cards.util.makeAnchorMap(),
    valid = true, current_coll, title_icon
    ;
    console.log(anchor_map);

    // validate
    if (['index', 'annot', 'closed'].indexOf(anchor_map.nav) === -1) {
      valid = false;
      anchor_map.nav = 'closed';
    }
    if (['true', 'false'].indexOf(anchor_map.annot_targets) === -1) {
      valid = false;
      anchor_map.annot_targets = 'false';
    }
    if (['opened', 'closed'].indexOf(anchor_map.editor) === -1) {
      valid = false;
      anchor_map.editor = 'closed';
    }
    if (!data.index.get(anchor_map.content)) {
      valid = false;
      anchor_map.content = 'special:all';
    }

    if (!valid) {
      changeAnchorPart(anchor_map);
    }

    cards.nav.setNavState(anchor_map.nav, anchor_map.annot_targets);
    cards.editor.setEditorState(anchor_map.editor);
    current_coll = data.index.get(anchor_map.content);
    cards.content.setColl(current_coll);
    switch (current_coll.get('type')) {
    case 'tag':
      title_icon = '<i class="fa fa-tag"></i>';
      break;
    case 'note':
      title_icon = '<i class="fa fa-book"></i>';
      break;
    default:
      title_icon = '<i class="fa fa-circle-o"></i>';
    }
    cards.nav.setTitle(
      title_icon + '&nbsp;&nbsp' +
      data.index.get(anchor_map.content).get('name')
    );

    // update
    state.anchor_map = anchor_map;
  };

  createCard = function(data_) {
    var card, coll;
    card = cards.model.createCard(data_);
    coll = data.index.get(state.anchor_map.content);
    if (state.anchor_map.content
        && ['tag', 'note'].indexOf(coll.get('type')) > -1
    ) {
      card.get('colls').add(coll);
    }
    console.log('new card');
    return card;
  };

  init = function(container) {
    var nav_el = document.querySelector('.cards-nav');
    // animate while initializing model
    nav_el.classList.add('annot-saving');

    cards.model.init().then(function() {
      data.index = cards.model.getIndex();

      cards.nav.configure({
        set_nav_anchor: setNavAnchor,
        set_content_anchor: setContentAnchor,
        index: data.index,
        create_coll: cards.model.createColl,
        remove_editor_coll: cards.editor.removeColl,
        request_move: cards.content.moveCards,
        cancel_move: cards.content.endMove,
        get_current_coll: function() {
          return data.index.get(state.anchor_map.content);
        }
      });
      cards.nav.init(container);
      nav_el.classList.remove('annot-saving');

      cards.content.configure({
        set_edit_target: cards.editor.setEditTarget,
        set_annot_target: cards.nav.setAnnotTarget
      });
      cards.content.init(container);

      cards.editor.configure({
        set_editor_anchor: setEditorAnchor,
        create_card: createCard,
        request_annot: requestAnnot
      });
      cards.editor.init(container);

      //
      window.addEventListener('hashchange', onHashchange);
      onHashchange();
      //
      window.addEventListener('beforeunload', function(event) {
        // Ref: https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
        var msg;
        if (cards.editor.getDraft()) {
          msg = 'Discard draft?';
          event.returnValue = msg;  // Gecko, Trident, Chrome 34+
          return msg; // Gecko, WebKit, Chrome <34
        }
      });
    });
  }; 

  return { init: init };
}());
