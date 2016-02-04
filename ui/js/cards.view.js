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
    var tmpl_id = 'tmpl-nav-index-item', tmpl = null, create;

    create = function(model) {  // model: cards.model/models.coll
      var self = { el: null, render: null }, dom = {};

      if (!tmpl) {
        tmpl = document.getElementById(tmpl_id).text.trim();
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
          cards.util.formatTmpl(tmpl, {
            id: model.get('id'), name: model.get('name'), icon: icon_html
          })
        );

        // for annotator
        model.on('change:annot_check', function() {
          switch (model.get('annot_check')) {
          case 'checked':
            self.el.classList.add('checked');
            break;
          case 'partial':
            // TODO: change icon color
            self.el.classList.add('checked');
            break;
          default:
            self.el.classList.remove('checked');
          }
        });

        self.el.querySelector('.item-check-trigger').addEventListener(
          'click', function(event) {
            model.set({
              annot_check: (
                (model.get('annot_check') !== 'checked') ? 'checked' : null
              )
            });
          }, false
        );

        return self;
      };

      return self;
    };

    return { create: create };
  }());  // index_item

  index = (function() {
    var tmpl_sec_id = 'tmpl-nav-index-sec', tmpl_sec = null, create;

    create = function(index) {  // index: cards.model.index
      var
      self = { el: null, render: null, configure: null },
      config = { set_content_anchor: null },
      dom = {
        special_sec: null, special_sec_ul: null,
        tag_sec: null, tag_sec_ul: null,
        note_sec: null, note_sec_ul: null
      },
      onClickSetContentAnchor
      ;

      if (!tmpl_sec) {
        tmpl_sec = (
          document.getElementById(tmpl_sec_id).text.trim()
        );
      }

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };

      self.render = function() {
        var index_items, i;
        self.el = document.createElement('div');

        // special index
        dom.special_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Special' })
        );
        dom.special_sec_ul = dom.special_sec.querySelector('ul');
        dom.special_sec.classList.add('special');
        self.el.appendChild(dom.special_sec);
        dom.special_sec_ul.appendChild(
          index_item.create(index.get('special:all')).render().el
        );

        index.each(function(coll) {
          switch (coll.get('type')) {
          case 'tag':
            if (!dom.tag_sec) {
              dom.tag_sec = cards.util.createElement(
                cards.util.formatTmpl(tmpl_sec, { title: 'Tags' })
              );
              dom.tag_sec_ul = dom.tag_sec.querySelector('ul');
              self.el.appendChild(dom.tag_sec);
            }
            dom.tag_sec_ul.appendChild(index_item.create(coll).render().el);
            break;

          case 'note':
            if (!dom.note_sec) {
              dom.note_sec = cards.util.createElement(
                cards.util.formatTmpl(tmpl_sec, { title: 'Notes' })
              );
              dom.note_sec_ul = dom.note_sec.querySelector('ul');
              self.el.appendChild(dom.note_sec);
            }
            dom.note_sec_ul.appendChild(index_item.create(coll).render().el);
            break;

          default:
            //
          }
        });

        // index works as content selector
        index_items = self.el.querySelectorAll('li');
        for (i = 0; i < index_items.length; i++) {
          index_items[i].addEventListener(
            'click', onClickSetContentAnchor, false
          );
        }

        return self;
      };  // render

      onClickSetContentAnchor = function(event) {
        event.preventDefault();
        if (index.get(event.target.id)) {
          config.set_content_anchor(event.target.id);
        }
      };

      return self;
    };  // index.create

    return { create: create };
  }());  // index

  annot_index = (function() {
    var tmpl_sec_id = 'tmpl-nav-index-sec', tmpl_sec = null, create;

    create = function(index) {  // index: cards.model.index
      var
      self = { el: null, render: null, setState: null },
      state = { target: [], checked_colls: {} },
      dom = {
        tag_sec: null, tag_sec_ul: null,
        note_sec: null, note_sec_ul: null
      }
      ;

      if (!tmpl_sec) {
        tmpl_sec = (
          document.getElementById(tmpl_sec_id).text.trim()
        );
      }

      self.render = function() {
        self.el = document.createElement('div');

        index.each(function(coll) {
          //
          coll.on('change:annot_check', function() {
            if (coll.get('annot_check') === 'checked') {
              state.checked_colls[coll.get('id')] = coll;
              state.target.forEach(function(card) {
                card.get('colls').add(coll);
                coll.get('cards').add(card);
              });
            } else {
              delete state.checked_colls[coll.get('id')];
              state.target.forEach(function(card) {
                if (card.get('colls').get(coll.get('id'))) {
                  card.get('colls').remove(coll.get('id'));
                  coll.get('cards').remove(card.get('id'));
                }
              });
            }
          });
          
          switch (coll.get('type')) {
          case 'tag':
            if (!dom.tag_sec) {
              dom.tag_sec = cards.util.createElement(
                cards.util.formatTmpl(tmpl_sec, { title: 'Add Tags' })
              );
              dom.tag_sec_ul = dom.tag_sec.querySelector('ul');
              self.el.appendChild(dom.tag_sec);
            }
            dom.tag_sec_ul.appendChild(index_item.create(coll).render().el);
            break;

          case 'note':
            if (!dom.note_sec) {
              dom.note_sec = cards.util.createElement(
                cards.util.formatTmpl(
                  tmpl_sec, { title: 'Append to Notes' }
                )
              );
              dom.note_sec_ul = dom.note_sec.querySelector('ul');
              self.el.appendChild(dom.note_sec);
            }
            dom.note_sec_ul.appendChild(index_item.create(coll).render().el);
            break;

          default:
            //
          }
        });

        return self;
      };

      self.setState = function(card_array, annot_type) {
        var freq = {}, checked_ids = [], partial_checked_ids = [];
        state.target = card_array;

        // clear check
        Object.keys(state.checked_colls).forEach(function(coll_id) {
          var checked = false;
          state.target.forEach(function(card) {
            if (card.get('colls').get(coll_id)) {
              checked = true;
            }
          });
          if (!checked) {
            index.get(coll_id).set({ annot_check: null });
          }
        });

        // set check status
        state.target.forEach(function(card) {
          card.get('colls').each(function(coll) {
            var coll_id = coll.get('id');
            freq[coll_id] = ((freq.hasOwnProperty(coll_id))
                             ? freq[coll_id] + 1 : 1);
          });
        });
        Object.keys(freq).forEach(function(coll_id) {
          if (state.target.length === freq[coll_id]) {
            checked_ids.push(coll_id);
          } else {
            partial_checked_ids.push(coll_id);
          }
        });

        checked_ids.forEach(function(coll_id) {
          index.get(coll_id).set({ annot_check: 'checked' });
        });
        partial_checked_ids.forEach(function(coll_id) {
          index.get(coll_id).set({ annot_check: 'partial' });
        });

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
    var tmpl_id = 'tmpl-item', tmpl = null, create;

    create = function(model) {
      var
      self = { el: null, render: null, configure: null },
      config = { set_edit_target: null, set_annot_target: null },
      dom = {},
      state = { checked: false },
      toggleCheck
      ;

      if (!tmpl) {
        tmpl = document.getElementById(tmpl_id).text.trim();
      }

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };

      self.render = function() {
        if (!self.el) {
          self.el = cards.util.createElement(
            cards.util.formatTmpl(tmpl, { id: model.get('id') })
          );

          // set dom map
          dom.title = self.el.querySelector('.item-title');
          dom.body = self.el.querySelector('.item-body');
          dom.colls = self.el.querySelector('.item-meta .colls');
          dom.edit_trigger = self.el.querySelector('.item-edit-trigger');

          // set event handlers
          self.el.querySelector('.item-check-trigger').addEventListener(
            'click', function(event) {
              event.preventDefault();
              model.set({ checked: !model.get('checked') });
            }, false
          );
          self.el.querySelector('.item-edit-trigger').addEventListener(
            'click', function(event) {
              event.preventDefault();
              config.set_edit_target(model);
            }, false);
        }

        dom.title.innerHTML = model.get('title');
        dom.body.innerHTML = model.get('body');
        dom.colls.innerHTML = null;
        model.get('colls').each(function(coll) {
          var icon = ((coll.get('type') === 'tag') ? 'tag' : 'book');
          dom.colls.appendChild(
            cards.util.createElement(
              cards.util.formatTmpl(
                '<li><i class="fa fa-{{icon}}"></i>&nbsp;{{name}}</li>',
                { icon: icon, name: coll.get('name') }
              )
            )
          );
        });

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

      // set event handlers
      model.on('change', self.render);
      // TODO: これまずいかも
      model.get('colls').on('add', self.render);
      model.get('colls').on('remove', self.render);
      model.on('change:checked', function() {
        config.set_annot_target(model);
        if (model.get('checked')) {
          self.el.classList.add('checked');
        } else {
          self.el.classList.remove('checked');
        }
      });
      //model.on('destroy', function() { self.el.remove(); });

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
