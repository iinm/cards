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
      annot_checked: false,  // used by annotator
      cards: null
    })
  },
  data = { index: null },
  init, getIndex, createCard
  ;

  init = function() {
    var coll_all;
    // create coll
    data.index = cards.model_util.createCollection(models.coll);
    data.index.add(models.coll.create({
      id: 'special:all', type: 'special:all', name: 'Cards'
    }));
    cards.fake.getCollections().forEach(function(coll) {
      data.index.add(models.coll.create(coll));
    });

    // create and cards
    coll_all = cards.model_util.createCollection(models.card);
    cards.fake.getCards().forEach(function(data) {
      coll_all.create(data);
    });
    data.index.get('special:all').set({ cards: coll_all });
  };

  getIndex = function() {
    return data.index;
  };

  createCard = function(data) {
    return models.card.create(data);
  };

  return {
    init: init,
    models: models,
    getIndex: getIndex,
    createCard: createCard
  };
}());
