/*
  references:
    - https://developers.google.com/drive/v2/reference/files
    - https://developers.google.com/drive/v3/reference/files
    - https://developers.google.com/drive/v3/web/quickstart/js
    
  WARNING: The maximum rate limit is 1000requests/100sec/user
  
  Note:
    - Maximum file name length = 32767
      (http://www.aurelp.com/tag/maximum-file-name-google-drive/)
    - file id length = 45
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, Promise, gapi */

cards.gdrive = (function() {
  "use strict";
  var
  config = {
    client_id: '352055360944-70jipkghcmfbbg9o21f8pq4opilbvkia.apps.googleusercontent.com',
    scopes: [
       //'https://www.googleapis.com/auth/drive'
       'https://www.googleapis.com/auth/drive.appdata'
    ],
    folder_ids: { cards: null, colls: null, rels: null },
    page_size: 8,
    parallel_request_size: 8,
    cache_key_prefix: '__cards__'
  },
  dom = {},

  init, initApp,
  checkAuth, handleAuthResult,
  listFiles, listFilesAll, getFile, getFiles, downloadFile, downloadFiles,
  createFolder, saveFile, trashFile, deleteFile,
  createAppFolders,
  getColl, getColls, getCard, getCards, saveColl, saveCard,
  getRels, getRelsAll, saveRel, getItem, getItems,
  deleteColl, deleteCard,
  searchCards,
  items2cards,
  avadakedavra
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

    if (localStorage[config.cache_key_prefix + 'google_oauth_token']) {
      token = JSON.parse(localStorage[config.cache_key_prefix + 'google_oauth_token']);
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
      handleAuthResult(null);
      //gapi.auth.authorize({
      //  client_id: config.client_id,
      //  scope: config.scopes.join(' '),
      //  immediate: true
      //}, handleAuthResult);
    }
  };

  handleAuthResult = function(authResult) {
    // IMPORTANT!! これを消さないと，モバイルでの認証に失敗する．
    // http://stackoverflow.com/questions/25065194/google-sign-in-uncaught-securityerror
    if (authResult && authResult['g-oauth-window']) {
      delete authResult['g-oauth-window'];
    }

    // Handle response from authorization server.
    if (authResult && !authResult.error) {
      // save token to localstorage
      localStorage[config.cache_key_prefix + 'google_oauth_token'] = JSON.stringify(authResult);
      // Hide auth UI, then load client library.
      dom.greeting.classList.add('hide');
      //setTimeout(function() {
      //  dom.greeting.classList.add('cards-util-hide');
      //}, 500);
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
      if (!params.pageSize) { params.pageSize = config.page_size; }
      //if (!params.pageSize) params.pageSize = 1;

      request = gapi.client.drive.files.list(params);
      request.execute(function(resp) {
        console.log('listFiles:', resp);
        resp.files.forEach(function(file) {
          var file_;
          //console.log('found:', file);
          // cache
          if (localStorage[config.cache_key_prefix + file.id]) {
            file_ = JSON.parse(localStorage[config.cache_key_prefix + file.id]);
          }
          if (!file_ || (file_ && file_.modifiedTime !== file.modifiedTime)) {
            localStorage[config.cache_key_prefix + file.id] = JSON.stringify(file);
          }
        });
        resolve(resp);
      });
    });
    return promise;
  };

  listFilesAll = function(params, files) {
    // list all files
    var promise = new Promise(function(resolve, reject) {
      if (!params) { params = {}; }
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
      var request, file, file_;
      if (localStorage[config.cache_key_prefix + file_id]) {
        file = JSON.parse(localStorage[config.cache_key_prefix + file_id]);
        //console.log('getFile: from cache', file);
        resolve(file);
      }
      else {
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
          if (localStorage[config.cache_key_prefix + file.id]) {
            file_ = JSON.parse(localStorage[config.cache_key_prefix + file.id]);
          }
          if (!file_ || (file_ && file_.modifiedTime !== file.modifiedTime)) {
            localStorage[config.cache_key_prefix + file.id] = JSON.stringify(file);
          }
          resolve(file);
        });
      }
    });
    return promise;
  };

  getFiles = function(file_ids, partition_size) {
    var generate_getter;
    partition_size = partition_size || config.parallel_request_size;
    generate_getter = function(file_id) {
      return function() { return getFile(file_id); };
    };
    return cards.util.partitionPromiseAll(
      file_ids.map(generate_getter), partition_size
    );
  };

  downloadFile = function(file) {
    // Note: file obj must be retrieved before download
    // https://developers.google.com/drive/v3/web/manage-downloads
    var promise = new Promise(function(resolve, reject) {
      var request, data, file_;
      if (localStorage[config.cache_key_prefix + file.id]) {
        file_ = JSON.parse(localStorage[config.cache_key_prefix + file.id]);
      }
      if (file_ && file_.content) {
        data = file_.content;
        //console.log('downloadFile: from cache', data);
        resolve(data);
      }
      else {
        request = gapi.client.request({
          path: '/drive/v3/files/' + file.id + '?alt=media',
          method: 'GET'
        });
        request.execute(function(jsonResp, rawResp) {
          //console.log('getFile resp:', arguments);
          //if (!jsonResp && !jsonResp.error) {
          if (!jsonResp.error) {
            data = JSON.parse(rawResp).gapiRequest.data.body;
            // TODO: ?
            data = decodeURIComponent(data);
            console.log('downloadFile:', data);
            // cache
            //localStorage[config.cache_key_prefix + file.id + '_content'] = data;
            file.content = data;
            localStorage[config.cache_key_prefix + file.id] = JSON.stringify(file);
            resolve(data);
          }
          //else if (!jsonResp.error) {
          //  console.log('getFile:', jsonResp);
          //  // cache
          //  localStorage[file.id + '_content'] = JSON.stringify(jsonResp);
          //  resolve(jsonResp);
          //}
          else {
            console.log('getFile: error', jsonResp);
            reject();
          }
        });
      }
    });
    return promise;
  };

  downloadFiles = function(files, partition_size) {
    var generate_downloader;
    partition_size = partition_size || config.parallel_request_size;
    generate_downloader = function(file) {
      return function() { return downloadFile(file); };
    };
    return cards.util.partitionPromiseAll(
      files.map(generate_downloader), partition_size
    );
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
        // cache
        localStorage[config.cache_key_prefix + file.id] = JSON.stringify(file);
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
    var
    boundary = '-------314159265358979323846',
    delimiter = "\r\n--" + boundary + "\r\n",
    close_delim = "\r\n--" + boundary + "--",
    promise
    ;

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

      // TODO: ?
      base64data = cards.util.utf8_to_b64(content);
      //base64data = btoa(content);

      multipartRequestBody = (
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
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
        if (!file.error) {
          if (file_id) {
            console.log('updateFile:', file);
          } else {
            console.log('createFile:', file);
          }
          // cache
          file.content = content;
          //localStorage[file.id + '_content'] = content;
          localStorage[config.cache_key_prefix + file.id] = JSON.stringify(file);
          resolve(file);
        }
        else {  // file.error
          // TODO
          console.log('saveFile: error', file);
          reject();
        }
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
        method: 'DELETE'
      });
      request.execute(function(resp) {
        if (resp && resp.error) {
          // TODO
          console.log('deleteFile: error', resp);
          reject();
        }
        else {
          console.log('deleteFile:', resp, file_id);
          // delete from cache
          delete localStorage[config.cache_key_prefix + file_id];
          resolve(file_id);
        }
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
      listFilesAll({
        q: "(name = 'cards' or name = 'colls' or name = 'rels')" +
          " and mimeType = 'application/vnd.google-apps.folder'"
      })
        .then(function(files) {
          var create_fnames = { cards: true, colls: true, rels: true };
          files.forEach(function(file) {
            if (create_fnames[file.name]) {
              config.folder_ids[file.name] = file.id;
              delete create_fnames[file.name];
            }
          });
          return Promise.resolve(Object.keys(create_fnames));
        })
        .then(function(fnames) {
          //Promise.all(fnames.map(createFolder)).then(function(files) {
          var creators = [];
          fnames.forEach(function(fname) {
            creators.push(function() { return createFolder(fname); });
          });
          cards.util.partitionPromiseAll(creators, 1).then(function(files) {
            files.forEach(function(file) {
              config.folder_ids[file.name] = file.id;
            });
            resolve(files);
          });
        });
    });
    return promise;
  };

  getColl = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      getFile(file_id).then(function(file) {
        var parts = file.name.match(/^(\d+),(tag|note),(.+)/);
        resolve({
          id: file.id,
          type: parts[2],
          name: parts[3]
        });
      });
    });
    return promise;
  };

  getColls = function() {
    // get all collections
    var promise = new Promise(function(resolve, reject) {
      var params;
      params = {
        q: cards.util.formatTmpl(
          "'{{folder_id}}' in parents" , { folder_id: config.folder_ids.colls }
        ),
        orderBy: 'name desc,createdTime'
      };
      listFilesAll(params).then(function(files) {
        var colls = files.map(function(file) { return getColl(file.id); });
        Promise.all(colls).then(resolve);
      });
    });
    return promise;
  };

  deleteColl = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      // 1 remove relations
      getRelsAll(file_id).then(function(rels) {
        var removers = [];
        rels.forEach(function(rel) {
          removers.push(function() { return deleteFile(rel.id); });
        });
        cards.util.partitionPromiseAll(removers, config.parallel_request_size)
        // 2. delete coll
          .then(function() { deleteFile(file_id).then(resolve); });
      });
    });
    return promise;
  };

  saveColl = function(coll, update_timestamp) {
    // cards.gdrive.saveColl({name: 'star wars', card_ids: [], type: 'tag'})
    var promise = new Promise(function(resolve, reject) {
      var set_timestamp, save_coll, update_order;

      set_timestamp = function() {
        return new Promise(function(resolve, reject) {
          var timestamp;
          // set timestamp
          if (update_timestamp === true) {
            timestamp = Date.now();
          }
          if (coll.id) {
            getFile(coll.id).then(function(file) {
              if (!update_timestamp) {
                timestamp = file.name.match(/^(\d+),.*/)[1];
              }
              resolve(timestamp);
            });
          }
          else {  // new coll
            timestamp = '0000000000000';
            resolve(timestamp);
          }
        });
      };

      save_coll = function(timestamp) {
        return saveFile({
          name: [timestamp, coll.type, coll.name].join(','),
          parents: ((!coll.id) ? [config.folder_ids.colls] : null)
       }, '', coll.id);
      };

      update_order = function(file) {
        coll.id = file.id;
        return new Promise(function(resolve, reject) {
          // if coll.card_ids -> modify order
          if (coll.card_ids && coll.card_ids.length >= 2) {
            getRelsAll(file.id).then(function(rels) {
              if (rels[0].type === 'note_order') {
                rels[0].card_ids = coll.card_ids;
                saveRel(rels[0]).then(resolve);
              } else {
                saveRel({
                  type: 'note_order', card_ids: coll.card_ids, coll_id: coll.id
                }).then(resolve);
              }
            });
          }
          else {
            resolve(null);
          }
        });
      };

      set_timestamp().then(save_coll).then(update_order).then(function() {
        resolve(coll);
      });

    });
    return promise;
  };  // saveColl

  getCard = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      getFile(file_id).then(function(file) {
        downloadFile(file).then(function(data) {
          var card = JSON.parse(data);
          card.id = file_id;
          resolve(card);
        });
      });
    });
    return promise;
  };

  items2cards = function(items) {
    var cards_ = [];
    items.forEach(function(item) {
      var card = item.content;
      card.id = item.file.id;
      card.coll_ids = [];
      item.rels.reverse();
      item.rels.forEach(function(rel) {
        if (rel.type !== 'note_order') {
          card.coll_ids.push(rel.coll_id);
        }
      });
      card.created_date = new Date(item.file.createdTime)
        .toDateString().replace(/\s\d{4}/, '');
      cards_.push(card);
    });
    return cards_;
  };

  getCards = function(coll_id, pageToken) {
    var promise;

    promise = new Promise(function(resolve, reject) {
      var params;
      if (coll_id === 'special:all') {
        params = {
          q: cards.util.formatTmpl(
            "'{{folder_id}}' in parents" ,
            { folder_id: config.folder_ids.cards }
          ),
          orderBy: 'name desc'
        };
        if (pageToken) {
          params.pageToken = pageToken;
        }
        listFiles(params).then(function(resp) {
          var file_ids = resp.files.map(function(f) { return f.id; });
          getItems(file_ids).then(function(items) {
            resolve({
              card_array: items2cards(items),
              nextPageToken: resp.nextPageToken
            });
          });
        });
      }
      else {  // tag or note
        getRelsAll(coll_id).then(function(rels) {
          var start, card_ids, items, card_ids_map, card_ids_;
          if (rels.length === 0) {  // empty coll
            resolve({ card_array: [] });
          }
          else if (rels[0].type.indexOf('note') > -1) {  // note or note_order
            if (rels[0].type === 'note_order') {
              // check relations
              card_ids_map = {};
              rels.slice(1).forEach(function(rel) {
                card_ids_map[rel.card_id] = true;
              });
              card_ids_ = [];
              rels[0].card_ids.forEach(function(card_id) {
                if (card_ids_map[card_id]) {
                  card_ids_.push(card_id);
                }
              });
              items = getItems(card_ids_);
            }
            else {
              items = getItems(rels.map(function(r) { return r.card_id; }));
            }
            items.then(function(items) {
              resolve({ card_array: items2cards(items) });
            });
          }
          else {  // tag
            rels.reverse();
            card_ids = rels.map(function(r) { return r.card_id; });
            start = card_ids.indexOf(pageToken);
            start = ((start === -1) ? 0 : start);
            getItems(card_ids.slice(start, start + config.page_size))
              .then(function(items) {
                resolve({
                  card_array: items2cards(items),
                  nextPageToken: card_ids[start + config.page_size]
                });
              });
          }
        });
      }
    });
    return promise;
  };  // getCards

  deleteCard = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      // 1 remove relations
      getRelsAll(file_id).then(function(rels) {
        var removers = [];
        rels.forEach(function(rel) {
          if (rel.type !== 'note_order') {
            removers.push(function() { return deleteFile(rel.id); });
          }
        });
        cards.util.partitionPromiseAll(removers, config.parallel_request_size)
            // 2. delete card
          .then(function() { deleteFile(file_id).then(resolve); });
      });
    });
    return promise;
  };

  saveRel = function(rel) {
    var promise = new Promise(function(resolve, reject) {
      var name = [
        ((rel.type === 'note_order') ? '0000000000000' : rel.timestamp),  // 0
        rel.type,       // 1
        ((rel.type === 'note_order') ? rel.card_ids.join(',') : rel.card_id),
        rel.coll_id
      ].join(',');

      saveFile({
        name: name,
        parents: ((!rel.id) ? [config.folder_ids.rels] : null)
      }, '', rel.id)
        .then(function(file) {
          getColl(rel.coll_id).then(function(coll) {
            saveColl(coll, true).then(function() {
              resolve(file);
            });
          });
        });
    });
    return promise;
  };

  getRels = function(file_id, pageToken) {
    var promise = new Promise(function(resolve, reject) {
      var params = {
        q: cards.util.formatTmpl(
          "name contains '{{file_id}}'", { file_id: file_id }
        ),
        parents: [config.folder_ids.rels],
        pageSize: 100
      };
      if (pageToken) { params.pageToken = pageToken; }
      listFiles(params).then(function(resp) {
        var rels = [];
        resp.files.sort(function(a, b) {
          if (a.name < b.name) { return -1; }
          else if (a.name > b.name) { return 1; }
          else { return 0; }
        });
        resp.files.forEach(function(file) {
          var xs = file.name.split(/,/);
          rels.push({
            id: file.id,
            timestamp: xs[0],
            type: xs[1],  // tag | note | note_order
            card_id: xs[2],
            card_ids: xs.slice(2, xs.length - 1),
            coll_id: xs[xs.length - 1]
          });
        });
        resolve({ rels: rels, nextPageToken: resp.nextPageToken });
      });
    });
    return promise;
  };

  getRelsAll = function(file_id, rels, pageToken) {
    var promise = new Promise(function(resolve, reject) {
      getRels(file_id, pageToken)
        .then(function(resp) {
          if (!rels) {
            rels = resp.rels;
          } else {
            rels = rels.concat(resp.rels);
          }
          if (resp.nextPageToken) {
            getRelsAll(file_id, rels, resp.nextPageToken).then(resolve);
          } else {
            resolve(rels);
          }
        });
    });
    return promise;
  };

  getItem = function(file_id) {  // <- card_id or coll_id
    var promise = new Promise(function(resolve, reject) {
      getFile(file_id).then(function(file) {
        // Note: cost 2 connections
        Promise.all([ downloadFile(file), getRelsAll(file_id) ])
          .then(function(vals) {
            resolve({
              file: file, content: JSON.parse(vals[0]), rels: vals[1]
            });
          });
      });
    });
    return promise;
  };

  getItems = function(file_ids, parallel_request_size) {
    var getters = [];
    file_ids.forEach(function(file_id) {
      getters.push(function() { return getItem(file_id); });
    });
    return cards.util.partitionPromiseAll(
      getters, (parallel_request_size || config.parallel_request_size / 2)
    );
  };

  saveCard = function(card) {
    var promise = new Promise(function(resolve, reject) {
      var check_changes, save_card, update_relations;
      check_changes = function() {
        return new Promise(function(resolve, reject) {
          var
          timestamp, body_updated = false,
          removed_rels = [], added_rels = [], updated_rels = []
          ;
          if (card.id) {
            // Note: cost 1 connection, because card and coll may cached
            Promise.all([
              getItem(card.id), Promise.all(card.coll_ids.map(getColl))
            ]).then(function(vals) {
              var item = vals[0], colls = vals[1], coll_ids_;
              // Note: don't update note_order
              item.rels = item.rels.filter(function(rel) {
                return (rel.type !== 'note_order');
              });
              // old coll ids
              coll_ids_ = item.rels.map(function(rel) {
                return rel.coll_id;
              });

              // set timestamp
              if (card.title !== item.content.title
                  || card.body !== item.content.body
                 ) {
                // if changed -> update timestamp
                body_updated = true;
                timestamp = Date.now();
              } else {
                timestamp = item.file.name.match(/^(\d+),(.*)/)[1];
              }
              // check relation change
              item.rels.forEach(function(rel) {
                if (card.coll_ids.indexOf(rel.coll_id) === -1) {
                  removed_rels.push(rel);
                }
              });
              colls.forEach(function(coll) {
                var rel = {
                  timestamp: Date.now(),
                  type: coll.type, card_id: card.id, coll_id: coll.id
                };
                if (coll_ids_.indexOf(coll.id) === -1) {
                  added_rels.push(rel);
                } else if (body_updated && coll.type === 'tag') {
                  updated_rels.push(rel);
                }
              });

              resolve({
                timestamp: timestamp, body_updated: body_updated,
                removed_rels: removed_rels, added_rels: added_rels,
                updated_rels: updated_rels
              });
            });
          }
          else {  // !cards.id -> new card
            // no id -> can't update relations here
            body_updated = true;
            resolve({
              timestamp: Date.now(), body_updated: true,
              removed_rels: removed_rels, added_rels: added_rels,
              updated_rels: updated_rels
            });
          }
        });
      };  // check_changes

      save_card = function(changes) {
        return new Promise(function(resolve, reject) {
          if (!card.id) { delete card.id; }
          if (changes.body_updated) {
            saveFile({
              name: changes.timestamp +
                ',' + cards.util.unescape(card.title) + '.json',
              parents: ((!card.id) ? [config.folder_ids.cards] : null),
              indexable_text: [
                card.title, card.body // coll names
              ].map(cards.util.unescape).join('\n\n')
            }, JSON.stringify(card), card.id)
              .then(function(file) {
                //
                changes.card_file = file;
                resolve(changes);
              });
          }
          else {
            resolve(changes);
          }
        });
      };

      update_relations = function(changes) {
        return new Promise(function(resolve, reject) {
          var prepare = new Promise(function(resolve, reject) {
            if (!card.id) {  // new
              card.id = changes.card_file.id;
              Promise.all(card.coll_ids.map(getColl)).then(function(colls) {
                changes.added_rels = colls.map(function(coll) {
                  return {
                    timestamp: changes.timestamp,
                    type: coll.type, card_id: card.id, coll_id: coll.id
                  };
                });
                resolve(changes);
              });
            }
            else {
              resolve(changes);
            }
          });

          prepare.then(function(changes) {
            var updaters = [];
            changes.removed_rels.forEach(function(rel) {
              updaters.push(function() { return deleteFile(rel.id); });
            });
            changes.added_rels.forEach(function(rel) {
              updaters.push(function() { return saveRel(rel); });
            });
            changes.updated_rels.forEach(function(rel) {
              updaters.push(function() { return saveRel(rel); });
            });
            console.log(updaters);
            cards.util.partitionPromiseAll(
              updaters, config.parallel_request_size
            )
              .then(function(rels_updates) {
                changes.rels_updates = rels_updates;
                resolve(changes);
              });
          });
        });  // update_relations
      };

      check_changes().then(save_card).then(update_relations)
        .then(function() { resolve(card); });
    });
    return promise;
  };  // saveCard

  searchCards = function(query, pageToken) {
    var promise = new Promise(function(resolve, reject) {
      var params;
      params = {
        q: cards.util.formatTmpl(
          "'{{folder_id}}' in parents and fullText contains '{{query}}'" ,
          {
            folder_id: config.folder_ids.cards,
            query: query.replace("'", "\'")
          }
        )
        //orderBy: 'name desc'  // sorting is not supported for query
      };
      if (pageToken) {
        params.pageToken = pageToken;
      }
      listFiles(params).then(function(resp) {
        var file_ids = resp.files.map(function(f) { return f.id; });
        getItems(file_ids).then(function(items) {
          resolve({
            card_array: items2cards(items), nextPageToken: resp.nextPageToken
          });
        });
      });
    });
    return promise;
  };
  // ----------------------------------------------------------------------
  // End cards storage

  avadakedavra = function() {
    var generate_deleter, deleters = [], params = { spaces: ['appDataFolder'] };
    // delete all data
    generate_deleter = function(file_id) {
      return function() {
        return deleteFile(file_id);
      };
    };
    listFilesAll(params).then(function(files) {
      files.forEach(function(file) {
        deleters.push(generate_deleter(file.id));
      });
      cards.util.partitionPromiseAll(deleters, config.parallel_request_size)
        .then(function() { localStorage.clear(); });
    });
  };

  return {
    init: init,
    // expose to test
    listFiles: listFiles, listFilesAll: listFilesAll,
    getFile: getFile, getFiles: getFiles,
    downloadFile: downloadFile, downloadFiles: downloadFiles,
    createFolder: createFolder, saveFile: saveFile, trashFile: trashFile,
    deleteFile: deleteFile,
    // cards storage
    createAppFolders: createAppFolders,
    getCard: getCard, getCards: getCards, saveCard: saveCard,
    getColl: getColl, getColls: getColls, saveColl: saveColl,
    getRels: getRels, getRelsAll: getRelsAll,
    saveRel: saveRel, getItem: getItem, getItems: getItems,
    deleteCard: deleteCard, deleteColl: deleteColl,
    searchCards: searchCards,
    items2cards: items2cards,
    avadakedavra: avadakedavra
  };
}());
