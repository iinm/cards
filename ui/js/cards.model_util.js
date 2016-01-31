/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.model_util = (function() {
  var createModel, createCollection;

  createModel = function(data_tmpl) {
    var create;
    create = function(data) {
      var
      config = { on_change: [], on_change_key: {}, on_destroy: [] },
      get, set, destroy,  // fetch, save
      on, off
      ;
      data = cards.util.cloneUpdateObj(data_tmpl, data);

      get = function(key) { return data[key]; };
      set = function(kvs) {
        var changed_keys = [];
        Object.keys(kvs).forEach(function(key) {
          if (data[key] !== kvs[key]) {
            data[key] = kvs[key];
            changed_keys.push(key);
          }
        });
        changed_keys.forEach(function(key) {
          if (config.on_change_key[key]) {
            config.on_change_key[key].forEach(function(f) { f(); });
          }
        });
        if (changed_keys.length > 0) {
          config.on_change.forEach(function(f) { f(); });
        }
      };

      destroy = function() {
        config.on_destroy.forEach(function(f) { f(); });
      };

      on = function(target_event, f) {
        var target, event;
        target_event = target_event.split(':');  // 'key:change' or 'change'
        target = ((target_event.length === 2) ? target_event[0] : null);
        event = (
          (target_event.length === 2) ? target_event[1] : target_event[0]
        );
        switch (event) {
        case 'change':
          if (!target) {
            config.on_change.push(f);
          } else if (data.hasOwnProperty(target)) {
            if (!config.on_change_key[target]) {
              config.on_change_key[target] = [];
            }
            config.on_change_key[target].push(f);
          }
          break;
        case 'destroy':
          if (!target) {
            config.on_destroy.push(f);
          }
          break;
        default:
          //
        }
      };

      off = function() {
        // TODO
      };

      return {
        get: get, set: set, destroy: destroy,
        on: on, off: off
      };
    };
    return { create: create };
  };

  createCollection = function(model) {
    //var create;
    //create = function() {
    var
    config = { model: model, on: {} },
    data = { models: {}, model_ids: []},
    add, remove, get, at, create,  // fetch
    on, off
    ;

    get = function(id) {
      return data.models[id];
    };

    at = function(index) {
      return data.models[data.model_ids[index]];
    };

    add = function(model) {
      data.models[model.id] = model;
      data.model_ids.push(model.id);
      if (config.on['add']) {
        config.on['add'].forEach(function(f) { f(model); });
      }
    };

    remove = function(id) {
      if (data.models.hasOwnProperty(id)) {
        delete data.models[id];
        data.model_ids.splice(data.model_ids.indexOf(id), 1);
      }
      if (config.on['remove']) {
        config.on['remove'].forEach(function(f) { f(model); });
      }
    };

    create = function(data) {
      add(config.model.create(data));
    };

    on = function(event, f) {
      if (!config.on[event]) {
        config.on[event] = [];
      }
      config.on[event].push(f);
    };

    off = function(event, f) {
      var index = config.on[event].indexOf(f);
      if (index > -1) {
        config.on.splice(index, 1);
      }
    };

    return {
      add: add, remove: remove,
      create: create,
      get: get, at: at,
      on: on, off: off
    };
    //};
    //return { create: create };
  };

  return {
    createModel: createModel,
    createCollection: createCollection
  };
}());
