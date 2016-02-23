/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

var cards = (function () {
  "use strict";
  var init = function(container) {
    cards.shell.init(container);
  };

  return { init: init };
}());
