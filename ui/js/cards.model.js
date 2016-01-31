/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.model = (function() {
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

  createCollection = function() {
    var create;
    create = function() {
      var
      models = {}, model_ids = [],
      add, remove, get, at  // fetch, create
      ;

      get = function(id) {
        return models[id];
      };

      at = function(index) {
        return models[model_ids[index]];
      };

      add = function(model) {
        models[model.id] = model;
        model_ids.push(model.id);
      };

      remove = function(id) {
        if (models.hasOwnProperty(id)) {
          delete models[id];
          model_ids.splice(model_ids.indexOf(id), 1);
        }
      };
      return {
        add: add, remove: remove,
        get: get, at: at
      };
    };
    return { create: create };
  };

  return {
    createModel: createModel,
    createColleciton: createCollection
  };
}());


// cards.model.card = cards.model.createModel({});
cards.model.card = (function() {
  var
  data_tmpl = {
    _id: null,
    title: '',
    body: '',
    tags: [],
    notes: [],
    checked: false
  },

  self = cards.model.createModel(data_tmpl),
  create
  ;

  create = function(data) {
    var instance = self.create(data);
    //instance.on('destroy', function() {
    //  console.log('-- destroy cards.model.card');
    //});
    return instance;
  };

  return { create: create };
}());
