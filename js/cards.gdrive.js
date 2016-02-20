/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.gdrive = (function() {
  "use strict";
  var
  config = {
    client_id: '352055360944-70jipkghcmfbbg9o21f8pq4opilbvkia.apps.googleusercontent.com',
    scopes: [
       'https://www.googleapis.com/auth/drive'
       //'https://www.googleapis.com/auth/drive.appdata'
    ],
  },
  dom = {},

  init, initApp, checkAuth, handleAuthResult
  ;

  initApp = function() { cards.init(dom.app); };

  init = function() {
    // set dom map
    dom.app = document.getElementById('cards');
    dom.greeting = dom.app.querySelector('.cards-hello-world');
    dom.sign_in = dom.greeting.querySelector('.cards-sign-in');

    // event handlers
    dom.sign_in.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('click');
      gapi.auth.authorize({
        client_id: config.client_id,
        scope: config.scopes.join(' '),
        immediate: false
      }, handleAuthResult);
      return false;
    }, false);

    // check
    checkAuth();
  };

  checkAuth = function() {
    // Check if current user has authorized this application.
    var token, now = Math.ceil(new Date().getTime() / 1000);

    if (localStorage.google_oauth_token) {
      token = JSON.parse(localStorage.google_oauth_token);
      console.log(token);
      // modify token
      token.expires_in = token.expires_at - now;
      if (token.expires_in > 0) {
        gapi.auth.setToken(token);
      } else {
        token.error = 'expired!';
      }
      handleAuthResult(token);
    }
    else {
      gapi.auth.authorize({
        client_id: config.client_id,
        scope: config.scopes.join(' '),
        immediate: true
      }, handleAuthResult);
    }
  };

  handleAuthResult = function(authResult) {
    // Handle response from authorization server.
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
      // save token to localstorage
      localStorage.google_oauth_token = JSON.stringify(authResult);
      // Hide auth UI, then load client library.
      dom.greeting.classList.add('hide');
      gapi.client.load('drive', 'v3');
      // init App
      initApp();
    } else {
      // Show auth UI, allowing the user to initiate authorization by
      dom.greeting.classList.remove('hide');
    }
  };

  return { init: init };
}());
 
