/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.test = (function () {
  "use strict";
  var toggleAnnot, onModelChange;

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
    var card = cards.model.models.card.create({ title: 'タイトル', _id: 'card_00' });
    console.log('-- model created');
    console.log('title: ' + card.get('title'));
    console.log('id: ' + card.get('_id'));

    card.on('change', function() { console.log('-- model changed!'); });
    card.set({ title: '新しいタイトル' });
    console.log('title: ' + card.get('title'));

    card.on('change:body', function() { console.log('-- body changed!'); });
    card.set({ body: '内容' });
    console.log('body: ' + card.get('body'));
    card.set({ body: '内容' });
  };
 
  return {
    toggleAnnot: toggleAnnot,
    onModelChange: onModelChange
  };
}());
