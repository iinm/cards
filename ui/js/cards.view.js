/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.view = (function() {
  "use strict";
  var index_item, index;

  index_item = (function() {
    var
    config = { tmpl_id: 'tmpl-nav-index-item', tmpl: null },
    create
    ;

    create = function(model) {  // model: cards.model/models.coll
      var self = { el: null, render: null }, dom = {};

      if (!config.tmpl) {
        config.tmpl = document.getElementById(config.tmpl_id).text.trim();
      }
      
      self.render = function() {
        self.el = cards.util.createElement(
          cards.util.formatTmpl(config.tmpl, {
            id: model.get('id'), name: model.get('name'),
            icon: (
              (model.get('type') === 'tag')
                ? '<i class="fa fa-tag"></i>' : '<i class="fa fa-book"></i>'
            )
          })
        );
        return self;
      };

      return self;
    };

    return { create: create };
  }());  // index_item

  index = (function() {
    var
    config = {
      tmpl_sec_id: 'tmpl-nav-index-sec', tmpl_sec: null
    },
    create
    ;

    create = function(index) {
      var
      self = { el: null, render: null },
      dom = {}
      ;

      if (!config.tmpl) {
        config.tmpl_sec = (
          document.getElementById(config.tmpl_sec_id).text.trim()
        );
      }

      self.render = function() {
        self.el = document.createElement('div');

        index.each(function(coll) {
          switch (coll.get('type')) {
          case 'tag':
            if (!dom.tag_sec_el) {
              dom.tag_sec_el = cards.util.createElement(
                cards.util.formatTmpl(config.tmpl_sec, { title: 'Tags' })
              );
              self.el.appendChild(dom.tag_sec_el);
            }
            dom.tag_sec_el.appendChild(index_item.create(coll).render().el);
            break;

          case 'note':
            if (!dom.note_sec_el) {
              dom.note_sec_el = cards.util.createElement(
                cards.util.formatTmpl(config.tmpl_sec, { title: 'Notes' })
              );
              self.el.appendChild(dom.note_sec_el);
            }
            dom.note_sec_el.appendChild(index_item.create(coll).render().el);
            break;

          default:
            //
          }
        });
        console.log(self);

        return self;
      };
      
      return self;
    };

    return { create: create };
  }());  // index
  
  return { index: index, index_item: index_item };
}());


cards.view.item = (function() {
  "use strict";
  var
  config = {
    tmpl_id: 'tmpl-item',
    tmpl: null
  },
  create
  ;

  create = function(params) {
    var html, el, self = { state: { checked: false } }, toggleCheck;

    if (!config.tmpl) {
      config.tmpl = document.getElementById(config.tmpl_id).text.trim();
    }

    toggleCheck = function(event) {
      if (!self.state.checked) {
        el.classList.add('checked');
        self.state.checked = true;
      } else {
        el.classList.remove('checked');
        self.state.checked = false;
      }
    };

    html = cards.util.formatTmpl(config.tmpl, params.model);
    el = cards.util.createElement(html);
    el.querySelector('.item-check-trigger').addEventListener(
      'click', toggleCheck, false
    );
    return el;
  };

  return { create: create };
}());
