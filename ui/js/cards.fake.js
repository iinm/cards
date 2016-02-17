/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, Promise */

cards.fake = (function() {
  "use strict";
  var
  cards_ = {}, colls = {}, card_ids, coll_ids,
  getCard, getCards, getCollections,
  saveCard
  ;

  card_ids = [
    'card_01', 'card_02', 'card_03', 'card_04', 'card_05', 'card_06', 'card_07'
  ];
  cards_ = {
    card_01: {
      title: 'Episode I: The Phantom Menace',
      body: 'Turmoil has engulfed the Galactic Republic. The taxation of trade routes to outlying star systems is in dispute.',
      id: 'card_01',
      coll_ids: ['tag_06', 'note_04']
    },
    card_02: {
      title: 'Episode II: Attack of the Clones',
      body: 'There is unrest in the Galactic Senate. Several thousand solar systems have declared their intentions to leave the Republic.',
      id: 'card_02',
      coll_ids: ['tag_06', 'note_04']
    },
    card_03: {
      title: 'Episode III: Revenge of the Sith',
      body: 'War! The Republic is crumbling under attacks by the ruthless Sith Lord, Count Dooku. There are heroes on both sides. Evil is everywhere.',
      id: 'card_03',
      coll_ids: ['tag_06', 'note_04']
    },
    card_04: {
      title: 'Episode IV: A New Hope',
      body: 'It is a period of civil war. Rebel spaceships, striking from a hidden base, have won their first victory against the evil Galactic Empire.',
      id: 'card_04',
      coll_ids: ['tag_06', 'note_04']
    },
    card_05: {
      title: 'Episode V: The Empire Strikes Back',
      body: 'It is a dark time for the Rebellion. Although the Death Star has been destroyed, Imperial troops have driven the Rebel forces from their hidden base and pursued them across the galaxy.',
      id: 'card_05',
      coll_ids: ['tag_06', 'note_04']
    },
    card_06: {
      title: 'Episode VI: Return of the Jedi',
      body: 'Luke Skywalker has returned to his home planet of Tatooine in an attempt to rescue his friend Han Solo from the clutches of the vile gangster Jabba the Hutt.',
      id: 'card_06',
      coll_ids: ['tag_06', 'note_04']
    },
    card_07: {
      title: 'Episode VII: The Force Awakens',
      body: 'Luke Skywalker has vanished. In his absence, the sinister FIRST ORDER has risen from the ashes of the Empire and will not rest until Skywalker, the last Jedi, has been destroyed.',
      id: 'card_07',
      coll_ids: ['tag_06', 'note_04']
    }
  };

  coll_ids = [
    'tag_01', 'tag_02', 'tag_03', 'tag_04', 'tag_05', 'tag_06',
    'note_01', 'note_02', 'note_03', 'note_04'
  ];
  colls = {
    tag_01: { name: 'HTML', id: 'tag_01', type: 'tag' },
    tag_02: { name: 'CSS', id: 'tag_02', type: 'tag' },
    tag_03: { name: 'JavaScript', id: 'tag_03', type: 'tag' },
    tag_04: { name: 'Ruby', id: 'tag_04', type: 'tag' },
    tag_05: { name: 'Rails', id: 'tag_05', type: 'tag' },
    tag_06: { name: 'Star Wars', id: 'tag_06', type: 'tag' },
    note_01: {
      name: 'Rails環境構築手順', id: 'note_01', type: 'note', card_ids: []
    },
    note_02: {
      name: 'Rails cheat sheet', id: 'note_02', type: 'note', card_ids: []
    },
    note_03: {
      name: 'サーバ設定ログ（長いタイトルを表示するテスト）', id: 'note_03', type: 'note', card_ids: []
    },
    note_04: {
      name: 'Star Wars Opening', id: 'note_04', type: 'note',
      card_ids: [
        'card_01', 'card_02', 'card_03', 'card_04', 'card_05',
        'card_06', 'card_07'
      ]
    }
  };

  getCollections = function() {
    var i, reversed = [];
    for (i = coll_ids.length - 1; i >= 0; i--) {
      reversed.push(colls[coll_ids[i]]);
    }
    return reversed;
  };

  getCards = function(coll_id) {
    var promise;
    promise = new Promise(
      function(resolve, reject) {
        var i, card_array_ = [];
        if (coll_id === 'special:all' || colls[coll_id].type === 'tag') {
          for (i = 0; i < card_ids.length; i++) {
            if (coll_id === 'special:all'
                || cards_[card_ids[i]].coll_ids.indexOf(coll_id) > -1
               ) {
              card_array_.push(cards_[card_ids[i]]);
            }
          }
          card_array_.reverse();
        }
        else {  // note
          colls[coll_id].card_ids.forEach(function(card_id) {
            card_array_.push(cards_[card_id]);
          });
        }

        setTimeout(function() {
          resolve(card_array_);
        }, 1000);
      }
    );
    return promise;
  };

  getCard = function(card_id) {
    return cards_[card_id];
  };

  saveCard = function(data_) {
    var promise;
    promise = new Promise(
      function(resolve, reject) {
        // TODO: handle error
        if (!data_.id) {  // new card
          data_.id = 'card_' + card_ids.length;
          card_ids.push(data_);
        }
        else {  // update
          // if title or body is changed -> change order
          if (data_.title !== cards_[data_.id].title
              || data_.body !== cards_[data_.id].body
             ) {
            card_ids.splice(card_ids.indexOf(data_.id), 1);
            card_ids.push(data_.id);
          }
          //
          cards_[data_.id].coll_ids.forEach(function(coll_id) {
            if (colls[coll_id].type === 'note'
                && data_.coll_ids.indexOf(coll_id) === -1
               ) {
              // remove card from note
              colls[coll_id].card_ids.splice(
                colls[coll_id].card_ids.indexOf(data_.id), 1
              );
            }
          });
        }
        cards_[data_.id] = data_;

        // update notes
        data_.coll_ids.forEach(function(coll_id) {
          var coll = colls[coll_id];
          if (coll.type === 'note' && coll.card_ids.indexOf(data_.id) === -1) {
            coll.card_ids.push(data_.id);
          }
        });

        setTimeout(function() {
          resolve(data_);
        }, 1000);
      }
    );
    return promise;
  };

  return {
    getCard: getCard, getCards: getCards,
    getCollections: getCollections,
    saveCard: saveCard
  };
}());
