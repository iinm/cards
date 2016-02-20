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
  createFolder, saveFile, updateFile, trashFile
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
    // https://developers.google.com/drive/v3/reference/files#resource
    if (!params.fields) {
      params.fields = (
        "nextPageToken, " +
        "files(id, name, createdTime, modifiedTime)"
      );
    }
    if (!params.pageSize) params.pageSize = 10;
    var request = gapi.client.drive.files.list(params);
    request.execute(function(resp) {
      console.log('listFiles:', resp);
      resp.files.forEach(function(file) {
        console.log('found:', file);
      });
    });
  };

  getFile = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      var request = gapi.client.request({
        path: '/drive/v3/files/' + file_id,
        method: 'GET',
        params: {
          fields: "id, name, createdTime, modifiedTime"
        }
      });
      request.execute(function(file) {
        console.log('getFile:', file);
        resolve(file);
      });
    });
    return promise;
  };

  downloadFile = function(file_id) {
    // https://developers.google.com/drive/v3/web/manage-downloads
    var promise = new Promise(function(resolve, reject) {
      var request = gapi.client.request({
        path: '/drive/v3/files/' + file_id + '?alt=media',
        method: 'GET',
      });
      request.execute(function(jsonResp, rawResp) {
        var data = JSON.parse(rawResp).gapiRequest.data.body;
        console.log('getFile:', data);
        resolve(data);
      });
    });
    return promise;
  };

  //downloadFile = function(file) {
  //  //cards.gdrive.getFile(file_id).then(cards.gdrive.downloadFile).then()
  //  var promise = new Promise(function(resolve, reject) {
  //    if (file.webContentLink) {
  //      var access_token, xhr;
  //      access_token = gapi.auth.getToken().access_token;
  //      xhr = new XMLHttpRequest();
  //      xhr.open('GET', file.webContentLink);
  //      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
  //      xhr.onload = function() {
  //        resolve(xhr.responseText);
  //      };
  //      xhr.onerror = function() {
  //        reject(null);
  //      };
  //      xhr.send();
  //    } else {
  //      resolve(null);
  //    }
  //  });
  //  return promise;
  //};

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
        console.log('create folder:', file);
        resolve(file);
      });
    });
    return promise;
  };

  saveFile = function(metadata, content, file_id) {
    // Example
    // cards.gdrive.saveFile({name: 'hello.txt', parents:[folderid]}, 'Hello!')
    // cards.gdrive.saveFile({}, 'Hello! Hello', file_id)
    // cards.gdrive.saveFile({ trashed: true }, content, file_id)
    //
    //var metadata_example = {
    //  name: 'file name',
    //  mimeType: 'application/json',
    //  indexable_text: 'Hello!',
    //  parents: []
    //};
    //content = "{ 'msg': 'Hello!' }",
    var promise;
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    promise = new Promise(function(resolve, reject) {
      var base64data, multipartRequestBody, request;
      metadata.mimeType = metadata.mimeType || 'application/octet-stream';
      if (metadata.indexable_text) {
        metadata.contentHints = { indexableText: metadata.indexable_text };
        delete metadata.indexable_text;
      }

      base64data = btoa(content);
      multipartRequestBody = (
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + metadata.mimeType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64data +
        close_delim
      );

      request = gapi.client.request({
        path: '/upload/drive/v3/files' + ((!file_id) ? '' : '/' + file_id),
        method: ((!file_id) ? 'POST' : 'PATCH'),
        params: {
          uploadType: 'multipart',
          fields: "id, name, createdTime, modifiedTime"
        },
        headers: {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
      });

      request.execute(function(file) {
        console.log('createFile:', file);
        resolve(file);
      });
    });

    return promise;
  };

  trashFile = function(file_id, content) {
    return saveFile({ trashed: true }, content, file_id);
  };
  // ----------------------------------------------------------------------
  // End Google Drive API

  return {
    init: init,
    // expose to test
    listFiles: listFiles, getFile: getFile, downloadFile: downloadFile,
    createFolder: createFolder, saveFile: saveFile, trashFile: trashFile
  };
}());
