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
  init, getIndex, createCard, saveCard
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
    // create colls
    data.index = cards.model_util.createCollection(models.coll);
    data.index.add(models.coll.create({
      id: 'special:all', type: 'special:all', name: 'Cards'
    }));
    cards.fake.getCollections().forEach(function(data_) {
      var coll = models.coll.create(data_);
      // create cards
      data_.card_ids.forEach(function(card_id) {
        coll.get('cards').create(cards.fake.getCard(card_id));
        //coll.get('cards').get(card_id).get('colls').add(coll);
      });
      data.index.add(coll);
    });

    // create cards for special:all
    cards.fake.getCards().forEach(function(data_) {
      data.index.get('special:all').get('cards').create(data_);
    });
  };

  getIndex = function() {
    return data.index;
  };

  createCard = function(data_) {
    return models.card.create(data_);
  };

  saveCard = function(card) {
    var data_, coll_ids = [];
    card.get('colls').each(function(coll) {
      coll_ids.push(coll.get('id'));
    });
    data_ = {
      title: card.get('title'),
      body: card.get('body'),
      coll_ids: coll_ids
    };

    data_ = cards.fake.saveCard(data_);
    if (!data_) {
      return null;
    }

    // update collection
    // TODO: if card id exists, ...
    card = models.card.create(data_);
    data_.coll_ids.forEach(function(coll_id) {
      var idx = ((data.index.get(coll_id).get('type') === 'tag') ? 0 : null);
      data.index.get(coll_id).get('cards').add(card, idx);
    });
    data.index.get('special:all').get('cards').add(card, 0);

    return card;
  };

  return {
    init: init,
    models: models,
    getIndex: getIndex,
    createCard: createCard, saveCard: saveCard
  };
}());
