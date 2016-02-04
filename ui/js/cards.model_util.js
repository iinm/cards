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

      if ((typeof data_tmpl) === 'object') {
        data = cards.util.cloneUpdateObj(data_tmpl, data);
      } else if ((typeof data_tmpl) === 'function') {
        data = cards.util.cloneUpdateObj(data_tmpl(), data);
      }

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

      on = function(event_target, f) {
        var target, event;
        event_target = event_target.split(':');  // 'change:key' or 'change'
        event = event_target[0];
        target = ((event_target.length === 2) ? event_target[1] : null);

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
    data = { instances: {}, instance_ids: [] },
    get, at, len, each,
    add, remove, create,  // fetch
    on, off
    ;

    get = function(id) {
      return data.instances[id];
    };

    at = function(index) {
      return data.instances[data.instance_ids[index]];
    };

    len = function() { return data.instance_ids.length; };

    each = function(f) {
      data.instance_ids.forEach(function(id) {
        f(data.instances[id]);
      });
    };

    add = function(instance, idx) {
      data.instances[instance.get('id')] = instance;
      if ((typeof idx) !== 'number') {
        data.instance_ids.push(instance.get('id'));
      } else {
        data.instance_ids.splice(idx, 0, instance.get('id'));
      }
      if (config.on['add']) {
        config.on['add'].forEach(function(f) { f(instance); });
      }
    };

    remove = function(id) {
      var instance = get(id);
      if (data.instances.hasOwnProperty(id)) {
        delete data.instances[id];
        data.instance_ids.splice(data.instance_ids.indexOf(id), 1);
      }
      if (config.on['remove']) {
        config.on['remove'].forEach(function(f) { f(instance); });
      }
    };

    create = function(data, idx) {
      add(config.model.create(data), idx);
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
      get: get, at: at, len: len, each: each,
      add: add, remove: remove, create: create,
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
