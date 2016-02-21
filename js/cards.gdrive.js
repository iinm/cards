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
       //'https://www.googleapis.com/auth/drive'
       'https://www.googleapis.com/auth/drive.appdata'
    ],
    cards_folder_id: null,
    colls_folder_id: null
  },
  dom = {},

  init, initApp,
  checkAuth, handleAuthResult,
  listFiles, listFilesAll, getFile, downloadFile, downloadFiles,
  createFolder, saveFile, updateFile, trashFile, deleteFile,
  createAppFolders,
  // TODO
  getColls, getCards, saveColl, saveCard, deleteColl, deleteCard,
  searchCards
  ;

  initApp = function() {
    createAppFolders().then(function() {
      // TODO: load colls
      cards.init(dom.app);
    });
  };

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
    var token, now = cards.util.timestamp();

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
      gapi.client.load('drive', 'v3', function() {
        // init App
        initApp();
      });
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
    var promise = new Promise(function(resolve, reject) {
      var request;
      params = params || {};
      params.spaces = ['appDataFolder'];
      if (!params.fields) {
        params.fields = (
          "nextPageToken, " +
            "files(id, name, createdTime, modifiedTime)"
        );
      }
      if (!params.pageSize) params.pageSize = 20;
      //if (!params.pageSize) params.pageSize = 1;

      request = gapi.client.drive.files.list(params);
      request.execute(function(resp) {
        console.log('listFiles:', resp);
        resp.files.forEach(function(file) {
          console.log('found:', file);
          // cache
          localStorage[file.id] = JSON.stringify(file);
        });
        resolve(resp);
      });
    });
    return promise;
  };

  listFilesAll = function(params, files) {
    // list all files
    var promise = new Promise(function(resolve, reject) {
      listFiles(params)
        .then(function(resp) {
          if (!files) {
            files = resp.files;
          } else {
            files = files.concat(resp.files);
          }
          if (resp.nextPageToken) {
            params.pageToken = resp.nextPageToken;
            listFilesAll(params, files).then(resolve);
          } else {
            resolve(files);
          }
        });
    });
    return promise;
  };

  getFile = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      var request;
      //if (localStorage[file_id]) {
      //  resolve(file);
      //}
      request = gapi.client.request({
        path: '/drive/v3/files/' + file_id,
        method: 'GET',
        params: {
          fields: "id, name, createdTime, modifiedTime"
        }
      });
      request.execute(function(file) {
        console.log('getFile:', file);
        // cache
        localStorage[file.id] = JSON.stringify(file);
        resolve(file);
      });
    });
    return promise;
  };

  downloadFile = function(file) {
    // Note: file obj must be retrieved before download
    // https://developers.google.com/drive/v3/web/manage-downloads
    var promise = new Promise(function(resolve, reject) {
      var request = gapi.client.request({
        path: '/drive/v3/files/' + file.id + '?alt=media',
        method: 'GET',
      });
      request.execute(function(jsonResp, rawResp) {
        var data = JSON.parse(rawResp).gapiRequest.data.body;
        console.log('getFile:', data);
        // cache
        file.content = data;
        localStorage[file.id] = JSON.stringify(file);
        resolve(data);
      });
    });
    return promise;
  };

  downloadFiles = function(files, partition_size) {
    // cards.gdrive.getColls().then(function(files) { return cards.gdrive.downloadFiles(files, 1); }).then(function(d) { console.log(d); });
    var download_part, partition_size;

    partition_size = partition_size || 10;
    download_part = function(parts, data_array) {
      var promise = new Promise(function(resolve, reject) {
        var downloads = [];
        if (parts.length === 0) {
          resolve(data_array);
        }
        parts[0].forEach(function(file) {
          downloads.push(downloadFile(file));
        });
        Promise.all(downloads).then(function(data_array_) {
          download_part(parts.slice(1), data_array.concat(data_array_))
            .then(resolve);
        });
      });
      return promise;
    };

    return download_part(cards.util.partition(files, partition_size), []);
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
          parents: parent_ids || ['appDataFolder']
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
      if (!metadata.parents && !file_id) {
        metadata.parents = ['appDataFolder'];
      }
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

  deleteFile = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      var request = gapi.client.request({
        path: '/drive/v3/files/' + file_id,
        method: 'DELETE',
      });
      request.execute(function(resp) {
        console.log('deleteFile:', resp);
        resolve(resp);
      });
    });
    return promise;
  };
  // ----------------------------------------------------------------------
  // End Google Drive API

  // Begin cards storage
  // ----------------------------------------------------------------------
  createAppFolders = function() {
    // create or check app folders and set folder ids
    var promise = new Promise(function(resolve, reject) {
      var promises = [], p;

      p = listFiles({
        q: "name = 'colls' and mimeType = 'application/vnd.google-apps.folder'"
      }).then(function(resp) {
        if (resp.files.length > 0) {
          return Promise.resolve(resp.files[0]);
        } else {
          return createFolder('colls');
        } 
      }).then(function(file) {
        config.colls_folder_id = file.id;
      });
      promises.push(p);

      p = listFiles({
        q: "name = 'cards' and mimeType = 'application/vnd.google-apps.folder'"
      }).then(function(resp) {
        if (resp.files.length > 0) {
          return Promise.resolve(resp.files[0]);
        } else {
          return createFolder('cards');
        } 
      }).then(function(file) {
        config.cards_folder_id = file.id;
      });
      promises.push(p);

      Promise.all(promises).then(function() {
        console.log('createAppFolder:', config);
        resolve();
      });
    });
    return promise;
  };

  getColls = function() {
    // get all collections
    var promise = new Promise(function(resolve, reject) {
      var params, downloads;
      params = {
        q: cards.util.formatTmpl(
          "'{{folder_id}}' in parents" , { folder_id: config.colls_folder_id }
        ),
        orderBy: 'name desc'
      };
      listFilesAll(params).then(function(files) {
        downloadFiles(files, 10).then(resolve);
      });
    });
    return promise;
  };

  saveColl = function(data_) {
    // cards.gdrive.saveColl({name: 'star wars', card_ids: [], type: 'tag'})
    var promise;
    promise = new Promise(function(resolve, reject) {
      var timestamp, file, name_parts;
      if (data_.id && localStorage[data_.id]) {
        file = JSON.parse(localStorage[data_.id]);
        name_parts = file.name.match(/^(\d+)_(.*)/);
        timestamp = name_parts[1];
      }
      timestamp = timestamp || cards.util.timestamp();

      saveFile({
        name: timestamp + '_' + cards.util.unescape(data_.name) + '.json',
        mimeType: 'application/json',
        parents: [config.colls_folder_id]
      }, JSON.stringify(data_), data_.id)
        .then(function(file) {
          // downloadして，checkしたほうが良い?
          data_.id = file.id;
          resolve(data_);
        });
    });
    return promise;
  };

  // TODO
  // getCards, saveCard, deleteColl, deleteCard,
  //searchCards
  // ----------------------------------------------------------------------
  // End cards storage


  return {
    init: init,
    // expose to test
    listFiles: listFiles, listFilesAll: listFilesAll, getFile: getFile,
    downloadFile: downloadFile, downloadFiles: downloadFiles,
    createFolder: createFolder, saveFile: saveFile, trashFile: trashFile,
    deleteFile: deleteFile,
    // cards storage
    createAppFolders: createAppFolders,
    getColls: getColls, saveColl: saveColl
  };
}());
