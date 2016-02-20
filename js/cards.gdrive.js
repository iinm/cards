/*
  references:
    - https://developers.google.com/drive/v2/reference/files
    - https://developers.google.com/drive/v3/reference/files
    - https://developers.google.com/drive/v3/web/quickstart/js
*/

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

  init, initApp, checkAuth, handleAuthResult,
  listFiles, getFile, downloadFile,
  createFolder, insertFile, updateFile, trashFile
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
      gapi.auth.authorize({
        client_id: config.client_id,
        scope: config.scopes.join(' '),
        immediate: false
      }, handleAuthResult);
      return false;
    }, false);

    // authorize
    checkAuth();
  };

  // Begin Auth
  // ----------------------------------------------------------------------
  checkAuth = function() {
    // Check if current user has authorized this application.
    var token, now = Math.ceil(new Date().getTime() / 1000);

    if (localStorage.google_oauth_token) {
      token = JSON.parse(localStorage.google_oauth_token);
      //console.log(token);
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
  // ----------------------------------------------------------------------
  // End Auth

  // Begin Google Drive API
  // ----------------------------------------------------------------------
  listFiles = function(params) {
    //var params_example = {
    //  q: "fullText contains 'hoge'",  // search
    //  fields: "nextPageToken, files(id, name)",
    //  pageSize: 100,
    //  pageToken: pageToken
    //}
    // set default
    if (!params.fields) params.fields = "nextPageToken, files(id, name)";
    if (!params.pageSize) params.pageSize = 10;
    var request = gapi.client.drive.files.list(params);
    request.execute(function(resp) {
      console.log('listFiles:');
      resp.files.forEach(function(file) {
        console.log('found:', file);
      });
    });
  };

  getFile = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      // Note: v3だと，download用のリンクが取れない
      var request = gapi.client.request({
        path: '/drive/v2/files/' + file_id, method: 'GET',
      });
      request.execute(function(file) {
        console.log('getFile:', file);
        resolve(file);
      });
    });
    return promise;
  };

  downloadFile = function(file) {
    //cards.gdrive.getFile(file_id).then(cards.gdrive.downloadFile).then()
    var promise = new Promise(function(resolve, reject) {
      if (file.downloadUrl) {
        var access_token, xhr;
        access_token = gapi.auth.getToken().access_token;
        xhr = new XMLHttpRequest();
        xhr.open('GET', file.downloadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        xhr.onload = function() {
          resolve(xhr.responseText);
        };
        xhr.onerror = function() {
          reject(null);
        };
        xhr.send();
      } else {
        resolve(null);
      }
    });
    return promise;
  };

  createFolder = function(name, parent_ids) {
    var promise = new Promise(function(resolve, reject) {
      var request = gapi.client.request({
        path: '/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart'},
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parent_ids
        })
      });
      request.execute(function(file) {
        console.log('create folder', file);
        resolve(file);
      });
    });
    return promise;
  };

  //insertFile, updateFile, trashFile
  // ----------------------------------------------------------------------
  // End Google Drive API

  return {
    init: init,
    // expose to test
    listFiles: listFiles, getFile: getFile, downloadFile: downloadFile,
    createFolder: createFolder
  };
}());
