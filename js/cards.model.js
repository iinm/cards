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
  data = {
    index: null,  // index of coll
    cards: null,  // cache to share card model
    all: null  // top
  },
  init, getIndex, createCard, createColl, getSearch
  ;

  // define models
  models.card = (function() {
    var base_model, create;
    base_model = cards.model_util.createModel(function () {
      return {
        id: null,
        title: '', body: '', created_date: '01/01',
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
            // apply clone change
            data.cards.get(data_.id).set(data_);
          }
          card = data.cards.get(data_.id);

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
            if (!coll.get('cards').get(card.get('id'))
                || (changed && coll.get('type') !== 'note')
               ) {
              // Note: when body is changed, bring card to the top of coll
              // add card to coll
              if (coll.get('fetched')) {
                // Note: fetchしてないのに追加すると，fetchした時にレンダリングされない
                idx = ((coll.get('type') === 'tag') ? 0 : null);
                coll.get('cards').add(card, idx);
              }
              // add coll to card
              card.get('colls').add(coll);
            }
            // bring to top of index
            data.index.add(coll, 0);
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
              console.log('save card', data_);
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
            // remove from special colls
            data.index.get('special:all').get('cards').remove(card_id);
            data.search.get('cards').remove(card_id);
            data.cards.remove(card_id);

            resolve(self);
          });
        });
        return promise;
      };

      // override constructor for clone method
      self.set_create(create);

      return self;
    };  // create

    return { create: create };
  }());  // models.card

  models.coll = (function() {
    var base_model, create;
    base_model = cards.model_util.createModel(function() {
      return {
        id: null,
        type: '',  // tag or note
        name: '',
        annot_check: null,  // used by annotator, 'checked' or 'partial'
        cards: cards.model_util.createCollection(models.card),
        fetched: null,  // save last fetched card id
        match_search_input: null,
        match_annot_search_input: null
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
        };

        promise = new Promise(function(resolve, reject) {
          var last, last_card_id;
          last = self.get('cards').last();
          last_card_id = (last ? last.get('id') : null);
          if (self.get('fetched') === 'all') {
              resolve();
          }
          else {
            console.log('fetch: ' + self.get('name'), last_card_id);
            //cards.fake.getCards(self.get('id'), last_card_id).then(
            cards.gdrive.getCards(self.get('id'), last_card_id).then(
              function(card_array) {
                add_cards(card_array);
                if (card_array.length === 0 || self.get('type') === 'note') {
                  self.set({ fetched: 'all' });
                } else {
                  self.set({ fetched: 'partial' });
                }
                resolve();
              }
            );
          }
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
            console.log('save coll', data_);
            // update models
            var coll = data.index.get(data_.id);
            if (coll) {
              // apply clone change
              coll.set(data_);
              // add to re-render colls in card view
              // Note: not efficient
              data.cards.each(function(card) {
                if (card.get('colls').get(coll.get('id'))) {
                  card.get('colls').add(coll);
                }
              });
              // WARNING: .save doesn't reset coll.get('cards')
              //if (data_.type === 'note' && self.get('fetched')) {
              //  coll.get('cards').reset();
              //  self.get('cards').each(function(card) {
              //    coll.get('cards').add(card);
              //  });
              //}
            } else {  // new coll
              coll = self;
              coll.set(data_);
              //data.index.add(self, 0);  // bring top
              data.index.add(self);  // append
            }
            //
            resolve(coll);
          });
        });
        return promise;
      };  // .save

      // override
      self.destroy_ = self.destroy;
      self.destroy = function() {
        var promise;
        promise = new Promise(function(resolve, reject) {
          // delete from fake storage
          cards.fake.deleteColl(self.get('id')).then(function(coll_id) {
            self.destroy_();
            // update models
            // Note: fetchされていないと，special:allが更新されないので，
            // data.cardsから更新する
            //self.get('cards').each(function(card) {
            data.cards.each(function(card) {
              card.get('colls').remove(coll_id);
            });
            data.index.remove(coll_id);

            resolve(self);
          });
        });
        return promise;
      };  // .destroy

      // override constructor for clone method
      self.set_create(create);

      return self;
    };  // create

    return { create: create };
  }());  // models.coll

  models.search = (function() {
    var base_model, create;
    base_model = cards.model_util.createModel(function() {
      return {
        searching: false,
        fetched: null,  // if result is fetched; 'partial' or 'all'
        query: null,
        cards: cards.model_util.createCollection(models.card)
      };
    });

    create = function(data_) {
      var self = base_model.create(data_);

      self.search = function(query) {
        var promise;
        promise = new Promise(function(resolve, reject) {
          var last, last_card_id;
          last = self.get('cards').last();
          last_card_id = (last ? last.get('id') : null);

          if (query === null) {
            self.get('cards').reset();
            self.set({ query: query });
            resolve();
          }
          else if (query === self.get('query') && self.get('fetched') === 'all') {
            resolve();
          }
          else {
            if (query !== self.get('query')) {
              self.get('cards').reset();
              self.set({ fetched: null });
            }
            self.set({ searching: true });
            cards.fake.search(query, last_card_id).then(function(data_array) {
              self.set({
                searching: false, query: query,
                fetched: ((data_array.length === 0) ? 'all' : 'partial')
              });
              data_array.forEach(function(data_) {
                var card = data.cards.get(data_.id);
                if (!card) {
                  card = data.cards.create(data_);
                  data_.coll_ids.forEach(function(coll_id) {
                    card.get('colls').add(data.index.get(coll_id));
                  });
                }
                self.get('cards').add(card);
              });
              resolve();
            });
          }
        });
        return promise;
      };
      
      return self;
    };

    return { create: create };
  }());  // models.search

  init = function() {
    var promise;
    promise = new Promise(function(resolve, reject) {
      // create colls
      data.index = cards.model_util.createCollection(models.coll);
      data.cards = cards.model_util.createCollection(models.card);
      // create search model
      data.search = models.search.create();

      // create special coll
      data.all = models.coll.create({
        id: 'special:all', type: 'special:all', name: 'Cards'
      });
      data.index.add(data.all);

      // create colls (tags and notes)
      //cards.fake.getCollections()
      cards.gdrive.getColls()
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

  getSearch = function() {
    return data.search;
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
    getSearch: getSearch,
    createCard: createCard,
    createColl: createColl
  };
}());
