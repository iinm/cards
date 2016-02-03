/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.model = (function() {
  var
  models = {},
  data = { index: null },
  init, getIndex, createCard
  ;

  // define models
  models.card = cards.model_util.createModel(function () {
    return {
      id: null,
      title: '', body: '',
      colls: cards.model_util.createCollection(models.coll),
      checked: false
    };
  });

  models.coll = cards.model_util.createModel(function() {
    return {
      id: null,
      type: '',  // tag or note
      name: '',
      annot_check: null,  // used by annotator, 'checked' or 'partial'
      cards: cards.model_util.createCollection(models.card)
    };
  });

  init = function() {
    var coll_all;
    // create coll
    data.index = cards.model_util.createCollection(models.coll);
    data.index.add(models.coll.create({
      id: 'special:all', type: 'special:all', name: 'Cards'
    }));
    cards.fake.getCollections().forEach(function(data_) {
      var coll = models.coll.create(data_);
      data_.card_ids.forEach(function(card_id) {
        coll.get('cards').create(cards.fake.getCard(card_id));
      });
      data.index.add(coll);
    });

    // create and cards
    cards.fake.getCards().forEach(function(data_) {
      data.index.get('special:all').get('cards').create(data_);
      //data_.coll_ids.forEach(function(coll_id) {
      //  data.index.get(coll_id).get('cards').create(data_);
      //});
    });
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
