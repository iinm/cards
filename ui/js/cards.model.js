/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.model = (function() {
  var
  models = {
    card: cards.model_util.createModel({
      id: null,
      title: '', body: '',
      tags: [], notes: [],
      checked: false
    }),

    coll: cards.model_util.createModel({
      id: null,
      type: '',  // tag or note
      name: '',
      cards: null
    })
  },
  data = { index: null },
  init, getIndex
  ;

  init = function() {
    data.index = cards.model_util.createCollection(models.coll);
    cards.fake.getCollections().forEach(function(coll) {
      data.index.add(models.coll.create(coll));
    });
  };

  getIndex = function() {
    return data.index;
  };

  return {
    init: init,
    getIndex: getIndex
  };
}());
