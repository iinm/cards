/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, Promise */

cards.test = (function () {
  "use strict";
  var
  toggleAnnot, onModelChange,
  createCards, createColls,
  testPartitionPromise
  ;

  toggleAnnot = function(state) {
    var nav = document.querySelector('.cards-nav');
    switch (state) {
    case 'opened':
      nav.classList.add('opened');
      nav.classList.add('annot-opened');
      break;
    case 'closed':
      nav.classList.remove('opened');
      nav.classList.remove('annot-opened');
      break;
    default:
      //
    }
  };

  onModelChange = function() {
    var card = cards.model.models.card.create({ title: 'タイトル', id: 'card_00' });
    console.log('-- model created');
    console.log('title: ' + card.get('title'));
    console.log('id: ' + card.get('id'));

    card.on('change', function() { console.log('-- model changed!'); });
    card.set({ title: '新しいタイトル' });
    console.log('title: ' + card.get('title'));

    card.on('change:body', function() { console.log('-- body changed!'); });
    card.set({ body: '内容' });
    console.log('body: ' + card.get('body'));
    card.set({ body: '内容' });
  };

  createCards = function(title_prefix, num) {
    var i, generate_creator, creators = [], data;
    generate_creator = function(data) {
      return function() {
        return cards.gdrive.saveCard(data);
      };
    };
    for (i = 0; i < num; i++) {
      data = {
        title: title_prefix + '_' + i,
        body: 'てすと ' + i,
        coll_ids: []
      };
      creators.push(generate_creator(data));
    }
    cards.util.partitionPromiseAll(creators, 10).then(function(cards_) {
      console.log(cards_);
    });
  };

  createColls = function(title_prefix, num) {
    var i, generate_creator, creators = [], data;
    generate_creator = function(data) {
      return function() {
        return cards.gdrive.saveColl(data);
      };
    };
    for (i = 0; i < num; i++) {
      data = {
        name: title_prefix + '_' + i,
        type: ((i % 2) ? 'tag': 'note'),
      };
      creators.push(generate_creator(data));
    }
    cards.util.partitionPromiseAll(creators, 10).then(function(vals) {
      console.log(vals);
    });
  };

  testPartitionPromise = function() {
    var i, generate, generators = [];
    generate = function(i) {
      return function() {
        return new Promise(function(resolve, reject) {
          console.log(i.toString());
          setTimeout(resolve, 300, i.toString());
        });
      };
    };
    for (i = 0; i < 20; i++) {
      generators.push(generate(i));
    }
    cards.util.partitionPromiseAll(generators, 2).then(function(values) {
      console.log(values);
    });
  };

  return {
    testPartitionPromise: testPartitionPromise,
    toggleAnnot: toggleAnnot,
    onModelChange: onModelChange,
    createCards: createCards, createColls: createColls
  };
}());
