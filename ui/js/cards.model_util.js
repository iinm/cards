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
      config = { on: {}, create: create },
      set_create,
      get, set, // fetch, save
      clone, destroy,
      on, off
      ;

      if ((typeof data_tmpl) === 'object') {
        data = cards.util.cloneUpdateObj(data_tmpl, data);
      } else if ((typeof data_tmpl) === 'function') {
        data = cards.util.cloneUpdateObj(data_tmpl(), data);
      }

      set_create = function(create_f) {
        // set constructor for .clone()
        config.create = create_f;
      };

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
          if (config.on['change:' + key]) {
            config.on['change:' + key].forEach(function(f) { f(); });
          }
        });
        if (changed_keys.length > 0 && config.on.change) {
          config.on.change.forEach(function(f) { f(); });
        }
      };

      destroy = function() {
        if (config.on.destroy) {
          config.on.destroy.forEach(function(f) { f(); });
        }
        off('*');
      };

      clone = function() {
        var instance = config.create(data), modifications = {};

        Object.keys(data).forEach(function(key) {
          if (data[key] !== null && (typeof data[key].clone) === 'function') {
            modifications[key] = data[key].clone();
          }
        });
        instance.set(modifications);

        return instance;
      };

      on = function(event_target, f) {
        // event_target: 'change:key' or 'change'
        if (!config.on[event_target]) {
          config.on[event_target] = [];
        }
        config.on[event_target].push(f);
      };

      off = function(event_target, f) {
        var idx;
        if (event_target === '*') {
          // remove all
          config.on = {};
          return;
        }
        if (config.on[event_target]) {
          idx = config.on[event_target].indexOf(f);
          if (idx > -1) {
            config.on[event_target].splice(idx, 1);
          }
        }
      };

      return {
        set_create: set_create,
        get: get, set: set,
        clone: clone, destroy: destroy,
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
    add, create, remove, reset,  // fetch
    clone, as_array,
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
      var old_idx;
      if (data.instances.hasOwnProperty(instance.get('id'))
          && (typeof idx) !== 'number'
         ) {
        // already exists
        // do nothing
      }
      else {
        data.instances[instance.get('id')] = instance;
        if ((typeof idx) === 'number') {
          old_idx = data.instance_ids.indexOf(instance.get('id'));
          if (old_idx > -1) {
            data.instance_ids.splice(old_idx, 1);
          }
          data.instance_ids.splice(idx, 0, instance.get('id'));
        } else {
          data.instance_ids.push(instance.get('id'));
        }
      }
      if (config.on.add) {
        config.on.add.forEach(function(f) { f(instance, idx); });
      }
    };

    remove = function(id) {
      var instance = get(id);
      if (data.instances.hasOwnProperty(id)) {
        delete data.instances[id];
        data.instance_ids.splice(data.instance_ids.indexOf(id), 1);
      }
      if (config.on.remove) {
        config.on.remove.forEach(function(f) { f(instance); });
      }
    };

    reset = function() {
      while (data.instance_ids.length > 0) {
        remove(data.instance_ids.pop());
      }
    };

    create = function(data, idx) {
      var instance = config.model.create(data);
      add(instance, idx);
      return instance;
    };

    clone = function() {
      var collection = createCollection(config.model);
      data.instance_ids.forEach(function(id) {
        collection.add(data.instances[id]);
      });
      return collection;
    };

    as_array = function() {
      var instance_array = [];
      data.instance_ids.forEach(function(id) {
        instance_array.push(data.instances[id]);
      });
      return instance_array;
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
        config.on[event].splice(index, 1);
      }
    };

    return {
      get: get, at: at, len: len, each: each,
      clone: clone, as_array: as_array,
      add: add, create: create, remove: remove, reset: reset,
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
