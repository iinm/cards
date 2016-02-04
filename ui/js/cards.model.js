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
  data = { index: null, cards: null },
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
    data.cards = cards.model_util.createCollection(models.card);

    // create special coll
    data.index.add(
      models.coll.create({
        id: 'special:all', type: 'special:all', name: 'Cards'
      })
    );

    // cache all cards
    cards.fake.getCards().forEach(function(data_) {
      data.cards.create(data_);
    });
    
    // add cards to special:all
    cards.fake.getCards().forEach(function(data_) {
      data.index.get('special:all').get('cards').add(data.cards.get(data_.id));
    });

    // create colls add cards
    cards.fake.getCollections().forEach(function(data_) {
      var coll = models.coll.create(data_);
      data_.card_ids.forEach(function(card_id) {
        if (!data.cards.get(card_id)) {
          data.cards.create(cards.fake.getCard(card_id));
        }
        coll.get('cards').add(data.cards.get(card_id));
      });
      data.index.add(coll);
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

    // save to fake storage
    card.get('colls').each(function(coll) {
      coll_ids.push(coll.get('id'));
    });
    data_ = {
      title: card.get('title'),
      body: card.get('body'),
      coll_ids: coll_ids
    };

    data_ = cards.fake.saveCard(data_);
    if (!data_) {  // failed to save
      return null;
    }

    // update models
    if (!data.cards.get(data_.id)) {
      data.cards.create(data_);
    } else {
      data.cards.get(data_.id).set(data_);
    }
    card = data.cards.get(data_.id);

    data_.coll_ids.forEach(function(coll_id) {
      var idx, coll;
      coll = data.index.get(coll_id);
      if (!coll.get('cards').get(card.get('id'))) {
        idx = ((data.index.get(coll_id).get('type') === 'tag') ? 0 : null);
        data.index.get(coll_id).get('cards').add(card, idx);
      }
    });
    if (!data.index.get('special:all').get('cards').get(card.get('id'))) {
      data.index.get('special:all').get('cards').add(card, 0);
    }

    return card;
  };

  return {
    init: init,
    models: models,
    getIndex: getIndex,
    createCard: createCard, saveCard: saveCard
  };
}());
