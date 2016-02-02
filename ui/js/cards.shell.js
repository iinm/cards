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
  setNavAnchor, setEditorAnchor, saveCard, requestAnnot
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
      q: nav_state.search_input
    });
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

  saveCard = function(data) {
    // TODO: save or create?
    data.index.get(anchor_map.content).create(data);
  };

  onHashchange = function(event) {
    var
    anchor_map = cards.util.makeAnchorMap(),
    valid = true
    ;
    console.log(anchor_map);

    // validate
    if (!anchor_map.content) {
      anchor_map.content = 'all';
    }
    if (['index', 'annot', 'closed'].indexOf(anchor_map.nav) === -1) {
      valid = false;
      anchor_map.nav = 'closed';
    }
    if (['opened', 'closed'].indexOf(anchor_map.editor) === -1) {
      valid = false;
      anchor_map.editor = 'closed';
    }

    if (!valid) {
      changeAnchorPart(anchor_map);
      return false;
    }

    cards.nav.setNavState(anchor_map.nav);
    cards.editor.setEditorState(anchor_map.editor);

    // update
    state.anchor_map = anchor_map;
    return false;
  };

  init = function(container) {
    cards.model.init();
    data.index = cards.model.getIndex();

    cards.nav.configure({ set_nav_anchor: setNavAnchor, index: data.index });
    cards.nav.init(container);

    cards.content.init(container);
    cards.content.setColl(data.index.get('special:all'));

    cards.editor.configure({
      set_editor_anchor: setEditorAnchor,
      create_card: cards.model.createCard,
      save_card: saveCard,
      request_annot: requestAnnot
    });
    cards.editor.init(container);

    //
    window.addEventListener('hashchange', onHashchange);
    onHashchange();
  }; 

  return { init: init };
}());
