/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

var cards = (function () {
  "use strict";
  var init = function(container) {
    var i, content, nav_content, tmpl_item;

    cards.shell.init(container);

    // sample cards
    content = container.querySelector('.cards-content');
    nav_content = container.querySelector('.cards-nav-content');

    //tmpl_item = document.getElementById('tmpl-item').innerText.trim();
    for (i = 0; i < 10; i++) {
      content.appendChild(cards.view.item.create());
      //cards.util.appendChildren(
      //  cards.util.createElements('<div class="cards-item"></div>'),
      //  nav_content
      //);
    }
  };

  return { init: init };
}());
