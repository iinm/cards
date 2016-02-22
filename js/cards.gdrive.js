/*
  references:
    - https://developers.google.com/drive/v2/reference/files
    - https://developers.google.com/drive/v3/reference/files
    - https://developers.google.com/drive/v3/web/quickstart/js
    
  WARNING: The maximum rate limit is 1000requests/100sec/user
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
    cards_folder_id: null,
    colls_folder_id: null,
    page_size: 10,
    paralle_download_size: 10
  },
  dom = {},

  init, initApp,
  checkAuth, handleAuthResult,
  listFiles, listFilesAll, getFile, getFiles, downloadFile, downloadFiles,
  createFolder, saveFile, updateFile, trashFile, deleteFile,
  createAppFolders,
  // TODO
  getColl, getColls, getCard, getCards, saveColl, saveCard,
  deleteColl, deleteCard,
  searchCards,
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
      if (!params.pageSize) { params.pageSize = config.page_size; }
      //if (!params.pageSize) params.pageSize = 1;

      request = gapi.client.drive.files.list(params);
      request.execute(function(resp) {
        console.log('listFiles:', resp);
        resp.files.forEach(function(file) {
          var file_;
          console.log('found:', file);
          // cache
          if (localStorage[file.id]) {
            file_ = JSON.parse(localStorage[file.id]);
          }
          if (!file_ || (file_ && file_.modifiedTime !== file.modifiedTime)) {
            localStorage[file.id] = JSON.stringify(file);
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
      if (localStorage[file_id]) {
        file = JSON.parse(localStorage[file_id]);
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
          if (localStorage[file.id]) {
            file_ = JSON.parse(localStorage[file.id]);
          }
          if (!file_ || (file_ && file_.modifiedTime !== file.modifiedTime)) {
            localStorage[file.id] = JSON.stringify(file);
          }
          resolve(file);
        });
      }
    });
    return promise;
  };

  getFiles = function(file_ids, partition_size) {
    var generate;
    partition_size = partition_size || config.paralle_download_size;
    generate = function(file_id) {
      return function() { return getFile(file_id); };
    };
    return cards.util.partitionPromiseAll(
      file_ids.map(generate), partition_size
    );
  };

  downloadFile = function(file) {
    // Note: file obj must be retrieved before download
    // https://developers.google.com/drive/v3/web/manage-downloads
    var promise = new Promise(function(resolve, reject) {
      var request, data, file_;
      if (localStorage[file.id]) {
        file_ = JSON.parse(localStorage[file.id]);
      }
      if (file_.content) {
        data = file_.content;
        //console.log('downloadFile: from cache', data);
        resolve(data);
      }
      else {
        request = gapi.client.request({
          path: '/drive/v3/files/' + file.id + '?alt=media',
          method: 'GET',
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
            //localStorage[file.id + '_content'] = data;
            file.content = data;
            localStorage[file.id] = JSON.stringify(file);
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
    var generate;
    partition_size = partition_size || config.paralle_download_size;
    generate = function(file) {
      return function() { return downloadFile(file); };
    };
    return cards.util.partitionPromiseAll(files.map(generate), partition_size);
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
        localStorage[file.id] = JSON.stringify(file);
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
        if (file_id) {
          console.log('updateFile:', file);
        } else {
          console.log('createFile:', file);
        }
        // cache
        file.content = content;
        //localStorage[file.id + '_content'] = content;
        localStorage[file.id] = JSON.stringify(file);
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
        console.log('deleteFile:', resp, file_id);
        resolve(file_id);
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
        //console.log('createAppFolder:', config);
        resolve();
      });
    });
    return promise;
  };

  getColl = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      getFile(file_id).then(function(file) {
        downloadFile(file).then(function(data) {
          var coll = JSON.parse(data);
          coll.id = file_id;
          resolve(coll);
        });
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
      listFilesAll(params)
        .then(function(files) {
          downloadFiles(files).then(function(data_array) {
            var i, coll, colls = [];
            for (i = 0; i < files.length; i++) {
              coll = JSON.parse(data_array[i]);
              coll.id = files[i].id;
              colls.push(coll);
            }
            resolve(colls);
          });
        });
    });
    return promise;
  };

  deleteColl = function(file_id) {
    var promise = new Promise(function(resolve, reject) {
      // 1. remove coll from cards
      getColl(file_id).then(function(coll) {
        var updates = [];
        coll.card_ids.forEach(function(card_id) {
          var update = new Promise(function(resolve, reject) {
            getCard(card_id).then(function(card) {
              var idx = card.coll_ids.indexOf(coll.id);
              if (idx > -1) {
                card.coll_ids.splice(idx, 1);
              }
              saveCard(card, true).then(resolve);
            });
          });
          updates.push(update);
        });

        // 2. delete coll
        Promise.all(updates).then(function(card_files) {
          deleteFile(coll.id).then(resolve);
        });
      });
    });
    return promise;
  };

  saveColl = function(coll, update_timestamp) {
    // cards.gdrive.saveColl({name: 'star wars', card_ids: [], type: 'tag'})
    var promise;
    promise = new Promise(function(resolve, reject) {
      var timestamp, prepare;
      prepare = new Promise(function(resolve, reject) {
        // set timestamp
        if (update_timestamp === true) {
          timestamp = cards.util.timestamp();
        }
        if (coll.id) {
          getFile(coll.id).then(function(file) {
            downloadFile(file).then(function(data) {
              var coll_ = JSON.parse(data);
              if (update_timestamp) {
                timestamp = cards.util.timestamp();
              } else {
                timestamp = file.name.match(/^(\d+)_(.*)/)[1];
              }
              coll.card_ids = coll.card_ids || coll_.card_ids;
              resolve();
            });
          });
        }
        else {  // new coll
          timestamp = '0000000000';
          coll.card_ids = [];
          resolve();
        }
      });

      prepare.then(function() {
        saveFile({
          name: timestamp + '_' + cards.util.unescape(coll.name) + '.json',
          mimeType: 'application/json',
          parents: ((!coll.id) ? [config.colls_folder_id] : null)
        }, JSON.stringify(coll), coll.id)
          .then(function(file) {
            // downloadして，checkしたほうが良い?
            coll.id = file.id;
            resolve(coll);
          });
      });
    });
    return promise;
  };

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

  getCards = function(coll_id, pageToken) {
    var promise = new Promise(function(resolve, reject) {
      var params;
      if (coll_id === 'special:all') {
        params = {
          q: cards.util.formatTmpl(
            "'{{folder_id}}' in parents" ,
            { folder_id: config.cards_folder_id }
          ),
          orderBy: 'name desc,modifiedTime desc'
        };
        if (pageToken) {
          params.pageToken = pageToken;
        }
        listFiles(params).then(function(resp) {
          downloadFiles(resp.files).then(function(data_array) {
            var i, card, cards_ = [];
            for (i = 0; i < resp.files.length; i++) {
              card = JSON.parse(data_array[i]);
              card.id = resp.files[i].id;
              cards_.push(card);
            }
            resolve({
              card_array: cards_, nextPageToken: resp.nextPageToken
            });
          });
        });
      }
      else {
        getColl(coll_id).then(function(coll) {
          var start, card_ids, get_files = [], downloads = [];
          if (coll.type === 'note') {
            // get all cards
            Promise.all(coll.card_ids.map(getFile))
              .then(downloadFiles)
              .then(function(data_array) {
                var cards_ = [], card;
                data_array.forEach(function(data) {
                  card = JSON.parse(data);
                  cards_.push(card);
                });
                resolve({ card_array: cards_ });
              });
          }
          else {
            start = coll.card_ids.indexOf(pageToken);
            start = ((start === -1) ? 0 : start);
            card_ids = coll.card_ids.slice(start, start + config.page_size);
            Promise.all(card_ids.map(getFile))
              .then(downloadFiles)
              .then(function(data_array) {
                var cards_ = [], card;
                data_array.forEach(function(data) {
                  card = JSON.parse(data);
                  cards_.push(card);
                });
                resolve({
                  card_array: cards_,
                  nextPageToken: coll.card_ids[start + config.page_size]
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
      // 1. remove card from colls
      getCard(file_id).then(function(card) {
        var updates = [];
        card.coll_ids.forEach(function(coll_id) {
          var update = new Promise(function(resolve, reject) {
            getColl(coll_id).then(function(coll) {
              var idx = coll.card_ids.indexOf(coll_id);
              if (idx > -1) {
                coll.card_ids.splice(idx, 1);
              }
              saveColl(coll).then(resolve);
            });
          });
          updates.push(update);
        });

        // 2. delete card
        Promise.all(updates).then(function(coll_files) {
          deleteFile(card.id).then(resolve);
        });
      });
    });
    return promise;
  };

  saveCard = function(card, skip_update_colls) {
    var promise;
    promise = new Promise(function(resolve, reject) {
      var
      p, preparations = [],
      timestamp, body_updated = false,
      removed_coll_ids = [], added_coll_ids = [], other_coll_ids = []
      ;

      p = new Promise (function(resolve, reject) {
        // set timestamp and check coll changes
        var name_parts;
        if (card.id) {
          getFile(card.id).then(function(file) {
            downloadFile(file).then(function(data) {
              var card_ = JSON.parse(data);
              if (card.title !== card_.title || card.body !== card_.body) {
                // if changed -> update timestamp
                body_updated = true;
                timestamp = cards.util.timestamp();
              } else {
                name_parts = file.name.match(/^(\d+)_(.*)/);
                timestamp = name_parts[1];
              }
              // check coll changes
              card_.coll_ids.forEach(function(coll_id) {
                if (card.coll_ids.indexOf(coll_id) === -1) {
                  removed_coll_ids.push(coll_id);
                }
              });
              card.coll_ids.forEach(function(coll_id) {
                if (card_.coll_ids.indexOf(coll_id) === -1) {
                  added_coll_ids.push(coll_id);
                } else {
                  other_coll_ids.push(coll_id);
                }
              });
              resolve();
            });
          });
        }
        else {  // new card
          timestamp = cards.util.timestamp();
          removed_coll_ids = [];
          added_coll_ids = card.coll_ids;
          resolve();
        }
      });
      preparations.push(p);
      
      // save card
      Promise.all(preparations).then(function() {
        saveFile(
          {
            name: timestamp + '_' + cards.util.unescape(card.title) + '.json',
            //mimeType: 'application/json',
            parents: ((!card.id) ? [config.cards_folder_id] : null),
            indexable_text: [
              card.title, card.body // coll names
            ].map(cards.util.unescape).join('\n\n')
          },
          JSON.stringify(card), card.id
        ).then(function(file) {
          card.id = file.id;
          var update, updates = [];
          if (skip_update_colls !== true) {
            // update colls
            if (body_updated) {
              // bring to top of coll
              card.coll_ids.forEach(function(coll_id) {
                if (added_coll_ids.indexOf(coll_id) === -1) {
                  update = new Promise(function(resolve, reject) {
                    getColl(coll_id).then(function(coll) {
                      if (coll.type === 'tag') {
                        var idx = coll.card_ids.indexOf(card.id);
                        if (idx > -1) {
                          coll.card_ids.splice(idx, 1);
                        }
                        coll.card_ids.splice(0, 0, card.id);
                        saveColl(coll, true).then(resolve);
                      }
                      else {
                        resolve(coll);
                      }
                    });
                  });
                  updates.push(update);
                }
              });
            }
            removed_coll_ids.forEach(function(coll_id) {
              update = new Promise(function(resolve, reject) {
                getColl(coll_id).then(function(coll) {
                  var idx = coll.card_ids.indexOf(card.id);
                  if (idx > -1) {
                    coll.card_ids.splice(idx, 1);
                  }
                  saveColl(coll).then(resolve);
                });
              });
              updates.push(update);
            });
            added_coll_ids.forEach(function(coll_id) {
              update = new Promise(function(resolve, reject) {
                getColl(coll_id).then(function(coll) {
                  if (coll.type === 'note') {
                    coll.card_ids.push(card.id);
                  } else {  // tag
                    coll.card_ids.splice(0, 0, card.id);
                  }
                  saveColl(coll, true).then(resolve);
                });
              });
              updates.push(update);
            });
          }
          return Promise.all(updates);
        }).then(function(coll_files) {
          resolve(card);
        });
      });
    });
    return promise;
  };
  // TODO
  //searchCards
  // ----------------------------------------------------------------------
  // End cards storage

  avadakedavra = function() {
    var params = { spaces: ['appDataFolder'] };
    // delete all data
    localStorage.clear();
    listFilesAll(params).then(function(files) {
      files.forEach(function(file) {
        deleteFile(file.id).then();
      });
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
    getColl: getColl, getColls: getColls, saveColl: saveColl,
    getCard: getCard, getCards: getCards, saveCard: saveCard,
    deleteCard: deleteCard, deleteColl: deleteColl,
    avadakedavra: avadakedavra
  };
}());
