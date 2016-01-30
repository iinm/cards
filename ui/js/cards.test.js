/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.test = (function () {
  "use strict";
  var toggleAnnot;

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
 
  return {
    toggleAnnot: toggleAnnot
  };
}());
