/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.fake = (function() {
  "use strict";
  var
  card_list, colls,
  getCards, getCollections,
  saveCard
  ;

  card_list = [
    {
      title: 'Episode I: The Phantom Menace',
      body: 'Turmoil has engulfed the Galactic Republic. The taxation of trade routes to outlying star systems is in dispute.',
      id: 'card_01',
      coll_ids: ['tag_06', 'tag_04']
    },
    {
      title: 'Episode II: Attack of the Clones',
      body: 'There is unrest in the Galactic Senate. Several thousand solar systems have declared their intentions to leave the Republic.',
      id: 'card_02',
      coll_ids: ['tag_06', 'tag_04']
    },
    {
      title: 'Episode III: Revenge of the Sith',
      body: 'War! The Republic is crumbling under attacks by the ruthless Sith Lord, Count Dooku. There are heroes on both sides. Evil is everywhere.',
      id: 'card_03',
      coll_ids: ['tag_06', 'tag_04']
    },
    {
      title: 'Episode IV: A New Hope',
      body: 'It is a period of civil war. Rebel spaceships, striking from a hidden base, have won their first victory against the evil Galactic Empire.',
      id: 'card_04',
      coll_ids: ['tag_06', 'tag_04']
    },
    {
      title: 'Episode V: The Empire Strikes Back',
      body: 'It is a dark time for the Rebellion. Although the Death Star has been destroyed, Imperial troops have driven the Rebel forces from their hidden base and pursued them across the galaxy.',
      id: 'card_05',
      coll_ids: ['tag_06', 'tag_04']
    },
    {
      title: 'Episode VI: Return of the Jedi',
      body: 'Luke Skywalker has returned to his home planet of Tatooine in an attempt to rescue his friend Han Solo from the clutches of the vile gangster Jabba the Hutt.',
      id: 'card_06',
      coll_ids: ['tag_06', 'tag_04']
    },
    {
      title: 'Episode VII: The Force Awakens',
      body: 'Luke Skywalker has vanished. In his absence, the sinister FIRST ORDER has risen from the ashes of the Empire and will not rest until Skywalker, the last Jedi, has been destroyed.',
      id: 'cards_07',
      coll_ids: ['tag_06', 'tag_04']
    }
  ];

  colls = {
    tag_01: { name: 'HTML', id: 'tag_01', type: 'tag', card_ids: [] },
    tag_02: { name: 'CSS', id: 'tag_02', type: 'tag', card_ids: [] },
    tag_03: { name: 'JavaScript', id: 'tag_03', type: 'tag', card_ids: [] },
    tag_04: { name: 'Ruby', id: 'tag_04', type: 'tag', card_ids: [] },
    tag_05: { name: 'Rails', id: 'tag_05', type: 'tag', card_ids: [] },
    tag_06: { name: 'Star Wars', id: 'tag_06', type: 'tag', card_ids: [] },
    note_01: {
      name: 'Rails環境構築手順', id: 'note_01', type: 'note', card_ids: []
    },
    note_02: {
      name: 'Rails cheat sheet', id: 'note_02', type: 'note', card_ids: []
    },
    note_03: {
      name: 'サーバ設定ログ', id: 'note_03', type: 'note', card_ids: []
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
    var coll_list = [];
    Object.keys(colls).forEach(function(coll_id) {
      coll_list.push(colls[coll_id]);
    });
    return coll_list;
  };

  getCards = function() {
    return card_list;
  };

  saveCard = function(data) {
    if (!data.id) {
      data.id = 'card_' + card_list.length;
    }
    card_list.push(data);
    data.coll_ids.forEach(function(coll_id) {
      colls[coll_id].card_ids.push(data.id);
    });
    return data;
  };

  return {
    card_list: card_list, colls: colls,
    getCards: getCards,
    getCollections: getCollections,
    saveCard: saveCard
  };
}());
