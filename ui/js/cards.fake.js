/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.fake = (function() {
  "use strict";
  var getTagList, getNoteList, getCards;

  getTagList = function() {
    return [
      { name: 'HTML', _id: 'tag_01' },
      { name: 'CSS', _id: 'tag_02' },
      { name: 'JavaScript', _id: 'tag_03' },
      { name: 'Ruby', _id: 'tag_04' },
      { name: 'Rails', _id: 'tag_05' },
      { name: 'Star Wars', _id: 'tag_06' }
    ];
  };

  getNoteList = function() {
    return [
      { name: 'Rails環境構築手順', _id: 'note_01', cards: [] },
      { name: 'Rails cheat sheet', _id: 'note_02', cards: [] },
      { name: 'サーバ設定ログ', _id: 'note_03', cards: [] },
      {
        name: 'Star Wars Opening', _id: 'note_04',
        cards: [
          'card_01', 'card_02', 'card_03', 'card_04', 'card_05',
          'card_06', 'card_07'
        ]
      }
    ];
  };

  getCards = function() {
    var all_cards = [
      {
        title: 'Episode I: The Phantom Menace',
        body: 'Turmoil has engulfed the Galactic Republic. The taxation of trade routes to outlying star systems is in dispute.',
        _id: 'card_01',
        tags: ['tag_06'],
        notes: ['tag_04']
      },
      {
        title: 'Episode II: Attack of the Clones',
        body: 'There is unrest in the Galactic Senate. Several thousand solar systems have declared their intentions to leave the Republic.',
        _id: 'card_02',
        tags: ['tag_06'],
        notes: ['tag_04']
      },
      {
        title: 'Episode III: Revenge of the Sith',
        body: 'War! The Republic is crumbling under attacks by the ruthless Sith Lord, Count Dooku. There are heroes on both sides. Evil is everywhere.',
        _id: 'card_03',
        tags: ['tag_06'],
        notes: ['tag_04']
      },
      {
        title: 'Episode IV: A New Hope',
        body: 'It is a period of civil war. Rebel spaceships, striking from a hidden base, have won their first victory against the evil Galactic Empire.',
        _id: 'card_04',
        tags: ['tag_06'],
        notes: ['tag_04']
      },
      {
        title: 'Episode V: The Empire Strikes Back',
        body: 'It is a dark time for the Rebellion. Although the Death Star has been destroyed, Imperial troops have driven the Rebel forces from their hidden base and pursued them across the galaxy.',
        _id: 'card_05',
        tags: ['tag_06'],
        notes: ['tag_04']
      },
      {
        title: 'Episode VI: Return of the Jedi',
        body: 'Luke Skywalker has returned to his home planet of Tatooine in an attempt to rescue his friend Han Solo from the clutches of the vile gangster Jabba the Hutt.',
        _id: 'card_06',
        tags: ['tag_06'],
        notes: ['tag_04']
      },
      {
        title: 'Episode VII: The Force Awakens',
        body: 'Luke Skywalker has vanished. In his absence, the sinister FIRST ORDER has risen from the ashes of the Empire and will not rest until Skywalker, the last Jedi, has been destroyed.',
        _id: 'cards_07',
        tags: ['tag_06'],
        notes: ['tag_04']
      }
    ];

    return all_cards;
  };

  return {
    getTagList: getTagList,
    getNoteList: getNoteList,
    getCards: getCards
  };
}());
