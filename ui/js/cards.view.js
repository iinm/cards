/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.view = (function() {
  "use strict";
  var index_item, index, annot_index, card;

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
        var icon_html;
        switch (model.get('type')) {
        case 'tag':
          icon_html = '<i class="fa fa-tag"></i>';
          break;
        case 'note':
          icon_html = '<i class="fa fa-book"></i>';
          break;
        case 'special:all':
          icon_html = '<i class="fa fa-circle-o"></i>';
          break;
        default:
          //
        }
        self.el = cards.util.createElement(
          cards.util.formatTmpl(config.tmpl, {
            id: model.get('id'), name: model.get('name'), icon: icon_html
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

        // special index
        dom.special_sec = cards.util.createElement(
          cards.util.formatTmpl(config.tmpl_sec, { title: 'Special' })
        );
        dom.special_sec.classList.add('special');
        self.el.appendChild(dom.special_sec);
        dom.special_sec.appendChild(
          index_item.create(index.get('special:all')).render().el
        );

        index.each(function(coll) {
          switch (coll.get('type')) {
          case 'tag':
            if (!dom.tag_sec) {
              dom.tag_sec = cards.util.createElement(
                cards.util.formatTmpl(config.tmpl_sec, { title: 'Tags' })
              );
              self.el.appendChild(dom.tag_sec);
            }
            dom.tag_sec.appendChild(index_item.create(coll).render().el);
            break;

          case 'note':
            if (!dom.note_sec) {
              dom.note_sec = cards.util.createElement(
                cards.util.formatTmpl(config.tmpl_sec, { title: 'Notes' })
              );
              self.el.appendChild(dom.note_sec);
            }
            dom.note_sec.appendChild(index_item.create(coll).render().el);
            break;

          default:
            //
          }
        });

        return self;
      };
      
      return self;
    };

    return { create: create };
  }());  // index

  annot_index = (function() {
    var
    config = {
      tmpl_sec_id: 'tmpl-nav-index-sec', tmpl_sec: null
    },
    create
    ;

    create = function(index) {
      var
      self = { el: null, render: null, setState: null },
      state = { target: [] },
      dom = { tag_sec: null, note_sec: null }
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
            if (!dom.tag_sec) {
              dom.tag_sec = cards.util.createElement(
                cards.util.formatTmpl(config.tmpl_sec, { title: 'Add Tags' })
              );
              self.el.appendChild(dom.tag_sec);
            }
            dom.tag_sec.appendChild(index_item.create(coll).render().el);
            break;

          case 'note':
            if (!dom.note_sec) {
              dom.note_sec = cards.util.createElement(
                cards.util.formatTmpl(
                  config.tmpl_sec, { title: 'Append to Notes' }
                )
              );
              self.el.appendChild(dom.note_sec);
            }
            dom.note_sec.appendChild(index_item.create(coll).render().el);
            break;

          default:
            //
          }
        });

        return self;
      };

      self.setState = function(card_array, annot_type) {
        // TODO
        state.target = card_array;

        switch (annot_type) {
        case 'tag':
          dom.note_sec.style.display = 'none';
          dom.tag_sec.style.display = 'block';
          break;
        case 'note':
          dom.tag_sec.style.display = 'none';
          dom.note_sec.style.display = 'block';
          break;
        default:
          //
        }
      };
      
      return self;
    };

    return { create: create };
  }());  // annot_index

  card = (function() {
    var
    config = {
      tmpl_id: 'tmpl-item',
      tmpl: null
    },
    create
    ;

    create = function(model) {
      var
      self = { el: null, render: null },
      state = { checked: false },
      toggleCheck
      ;

      if (!config.tmpl) {
        config.tmpl = document.getElementById(config.tmpl_id).text.trim();
      }

      self.render = function() {
        self.el = cards.util.createElement(
          cards.util.formatTmpl(config.tmpl, {
            id: model.get('id'),
            title: model.get('title'),
            body: model.get('body')
          })
        );
        self.el.querySelector('.item-check-trigger').addEventListener(
          'click', toggleCheck, false
        );
        return self;
      };

      toggleCheck = function(event) {
        if (!state.checked) {
          self.el.classList.add('checked');
          state.checked = true;
        } else {
          self.el.classList.remove('checked');
          state.checked = false;
        }
      };

      return self;
    };

    return { create: create };
  }());  // card
  
  return {
    index: index, index_item: index_item,
    annot_index: annot_index,
    card: card
  };
}());
