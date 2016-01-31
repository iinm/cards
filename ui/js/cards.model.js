/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.model = (function() { return {}; }());

cards.model.card = (function() {
  var
  tmpl = {
    _id: null,
    title: '',
    body: '',
    tags: [],
    notes: []
  },
  create
  ;

  create = function(data) {
    var
    config = { on_change: [], on_change_key: {}, on_destroy: [] },
    get, set, destroy,
    on, off
    ;
    data = cards.util.cloneUpdateObj(tmpl, data);

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
      // TODO
      config.on_destroy.forEach(function(f) { f(); });
    };

    on = function(target_event, f) {
      var target, event;
      target_event = target_event.split(':');  // 'title:change'
      target = ((target_event.length === 2) ? target_event[0] : null);
      event = ((target_event.length === 2) ? target_event[1] : target_event[0]);

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

    off = function() {};  // TODO

    return {
      get: get, set: set, destroy: destroy,
      on: on, off: off
    };
  };

  
  return { create: create };
}());
