/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, Promise */

cards.model = (function() {
  var
  models = {},
  data = { index: null, cards: null, all: null },
  init, getIndex, createCard, createColl
  ;

  // define models
  models.card = (function() {
    var base_model, create;
    base_model = cards.model_util.createModel(function () {
      return {
        id: null,
        title: '', body: '',
        colls: cards.model_util.createCollection(models.coll),
        checked: false
      };
    });

    create = function(data_) {
      var self = base_model.create(data_);

      self.save = function() {
        var promise, update_models, is_changed;

        is_changed = function(data_) {
          var i, card, changed = false;
          card = data.cards.get(data_.id);
          if (!card) {  // new
            changed = true;
          }
          else {
            // check change
            if (card.get('title') !== data_.title
                || card.get('body') !== data_.body
                || card.get('colls').len() !== data_.coll_ids.length
               ) {
              changed = true;
            }
            for (i = 0; i < data_.coll_ids.length; i++) {
              if (!card.get('colls').get(data_.coll_ids[i])) {
                changed = true;
                break;
              }
            }
          }
          return changed;
        };

        update_models = function(data_) {
          var card, changed = false; 
          card = data.cards.get(data_.id);
          if (!card) {  // no id -> new card
            data.cards.create(data_);
          } else {  // update
            // check change
            if (card.get('title') !== data_.title
                || card.get('body') !== data_.body
                // ignore tag change
               ) {
              changed = true;
            }
            data.cards.get(data_.id).set(data_);
          }
          card = data.cards.get(data_.id);
          console.log(data_);

          // update relations
          card.get('colls').each(function(coll) {
            if (data_.coll_ids.indexOf(coll.get('id')) === -1) {
              // remove coll from card
              card.get('colls').remove(coll.get('id'));
              // remove card from coll
              coll.get('cards').remove(card.get('id'));
            }
          });
          
          data_.coll_ids.forEach(function(coll_id) {
            var idx, coll;
            coll = data.index.get(coll_id);
            if (!coll.get('cards').get(card.get('id')) || changed) {
              // add card to coll
              idx = ((coll.get('type') === 'tag') ? 0 : null);
              coll.get('cards').add(card, idx);
              // add coll to card
              card.get('colls').add(coll);
            }
          });

          if (!data.all.get('cards').get(card.get('id')) || changed) {
            data.all.get('cards').add(card, 0);
          }

          return card;
        };  // update_models

        promise = new Promise(function(resolve, reject) {
          var data_, coll_ids = [];

          // 1. save to (fake) storage
          self.get('colls').each(function(coll) {
            coll_ids.push(coll.get('id'));
          });
          data_ = {
            id: self.get('id'),
            title: self.get('title'),
            body: self.get('body'),
            coll_ids: coll_ids
          };

          if (is_changed(data_)) {
            cards.fake.saveCard(data_).then(function(data_) {
              var card = update_models(data_);
              resolve(card);
            });
          }
          else {
            resolve(self);
          }
        });

        return promise;
      };  // .save

      self.destroy = function() {
        var promise;
        promise = new Promise(function(resolve, reject) {
          // delete from fake storage
          cards.fake.deleteCard(self.get('id')).then(function(card_id) {
            // update models
            self.get('colls').each(function(coll) {
              coll.get('cards').remove(card_id);
            });
            data.index.get('special:all').get('cards').remove(card_id);
            data.cards.remove(card_id);

            resolve(self);
          });
        });
        return promise;
      };

      // update constructor
      self.set_create(create);

      return self;
    };  // create

    return { create: create };
  }());  // model.card

  models.coll = (function() {
    var base_model, create;
    base_model = cards.model_util.createModel(function() {
      return {
        id: null,
        type: '',  // tag or note
        name: '',
        annot_check: null,  // used by annotator, 'checked' or 'partial'
        cards: cards.model_util.createCollection(models.card),
        fetched: false
      };
    });

    create = function(data_) {
      var self = base_model.create(data_);

      self.fetch_cards = function() {
        var promise, add_cards;

        add_cards = function(card_array) {
          card_array.forEach(function(data_) {
            var card = data.cards.get(data_.id);
            if (!card) {
              card = data.cards.create(data_);
              data_.coll_ids.forEach(function(coll_id) {
                card.get('colls').add(data.index.get(coll_id));
              });
            }
            self.get('cards').add(card);
          });
          self.set({ fetched: true });
        };

        promise = new Promise(function(resolve, reject) {
          if (self.get('fetched')) {
            return;
          }
          console.log('fetch: ' + self.get('name'));
          cards.fake.getCards(self.get('id')).then(function(card_array) {
            add_cards(card_array);
            resolve();
          });
        });

        return promise;
      };  // .fetch_cards

      self.save = function() {
        var promise;
        promise = new Promise(function(resolve, reject) {
          var data_, card_ids = [];

          data_ = {
            id: self.get('id'),
            type: self.get('type'),
            name: self.get('name')
          };

          if (self.get('type') === 'note' && self.get('fetched')) {
            // save order
            self.get('cards').each(function(card) {
              card_ids.push(card.get('id'));
            });
            data_.card_ids = card_ids;
          }

          // save to fake storage
          cards.fake.saveColl(data_).then(function(data_) {
            // update models
            var coll = data.index.get(data_.id);
            if (coll) {
              coll.set(data_);
            } else {  // new coll
              coll = self;
              coll.set(data_);
              data.index.add(self, 0);
            }
            //
            resolve(coll);
          });
        });
        return promise;
      };  // .save

      self.destroy = function() {
        var promise;
        promise = new Promise(function(resolve, reject) {
          // delete from fake storage
          cards.fake.deleteColl(self.get('id')).then(function(coll_id) {
            // update models
            console.log(coll_id);
            //self.get('cards').each(function(card) {
            // TODO: check
            data.cards.each(function(card) {
              card.get('colls').remove(coll_id);
            });
            data.index.remove(coll_id);

            resolve(self);
          });
        });
        return promise;
      };  // .destroy

      // update constructor
      self.set_create(create);

      return self;
    };  // create

    return { create: create };
  }());  // model.coll

  init = function() {
    var promise;
    promise = new Promise(function(resolve, reject) {
      // create colls
      data.index = cards.model_util.createCollection(models.coll);
      data.cards = cards.model_util.createCollection(models.card);

      // create special coll
      data.all = models.coll.create({
        id: 'special:all', type: 'special:all', name: 'Cards'
      });
      data.index.add(data.all);

      // create colls (tags and notes)
      cards.fake.getCollections()
        .then(function(coll_array) {
          coll_array.forEach(function(data_) {
            var coll = models.coll.create(data_);
            data.index.add(coll);
          });
          return Promise.resolve();
        })
        .then(resolve);
    });
    return promise;
  };

  getIndex = function() {
    return data.index;
  };

  createCard = function(data_) {
    return models.card.create(data_);
  };

  createColl = function(data_) {
    return models.coll.create(data_);
  };

  return {
    init: init,
    models: models,
    getIndex: getIndex,
    createCard: createCard,
    createColl: createColl
  };
}());
