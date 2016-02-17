/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards */

cards.view = (function() {
  "use strict";
  var
  index_item, index_item_new, index,
  annot_index_item, annot_index,
  card;

  index_item = (function() {
    var tmpl_id = 'tmpl-nav-index-item', tmpl = null, create;

    create = function(model) {  // model: cards.model/models.coll
      var
      self = { el: null, render: null, configure: null },
      config = { set_content_anchor: null },
      state = { mode: null },
      dom = {},
      onClickSetContentAnchor
      ;

      if (!tmpl) {
        tmpl = document.getElementById(tmpl_id).text.trim();
      }

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };

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

        // set dom map
        dom.title = self.el.querySelector('.title');

        // set event handlers
        self.el.querySelector('.title').addEventListener(
          'click', onClickSetContentAnchor
        );

        self.el.querySelector('.item-config-trigger').addEventListener(
          'click',
          function(event) {
            event.preventDefault();
            self.el.classList.add('config-menu-opened');
          },
          false
        );

        self.el.querySelector('.item-config-menu .delete').addEventListener(
          'click',
          function(event) {
            var yn;
            event.preventDefault();
            self.el.classList.remove('config-menu-opened');
            self.el.classList.add('syncing');
            yn = window.confirm('Delete "' + model.get('name') + '"');
            if (yn) {
              model.destroy().then(function(coll) {
                self.el.classList.add('blink-red');
                setTimeout(function() {
                  self.el.classList.remove('blink-red');
                }, 300);
                setTimeout(function() { self.el.remove(); }, 600);
              });
            }
            else {
              self.el.classList.remove('syncing');
            }
          },
          false
        );

        self.el.querySelector('.item-config-menu .edit').addEventListener(
          'click',
          function(event) {
            event.preventDefault();
            state.mode = 'edit';
            self.el.classList.add('edit-mode');
            dom.title.setAttribute('contenteditable', 'true');
            dom.title.focus();
          },
          false
        );

        self.el.querySelector('.item-config-menu .done').addEventListener(
          'click',
          function(event) {
            event.preventDefault();
            // TODO (?): save coll if title is changed
            state.mode = null;
            dom.title.focus();
            dom.title.setAttribute('contenteditable', 'false');
            self.el.classList.remove('config-menu-opened');
            self.el.classList.remove('edit-mode');
          },
          false
        );

        return self;
      };  // render

      onClickSetContentAnchor = function(event) {
        event.preventDefault();
        if (state.mode === 'edit') {
          return;
        }
        config.set_content_anchor(model.get('id'));
      };

      return self;
    };

    return { create: create };
  }());  // index_item


  index_item_new = (function() {
    var tmpl_id = 'tmpl-nav-index-item-new', tmpl = null, create;

    create = function(coll_type) {
      var
      self = { el: null, render: null, config: null },
      config = { create_coll: null },
      dom = {}
      ;

      if (!tmpl) {
        tmpl = document.getElementById(tmpl_id).text.trim();
      }

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };

      self.render = function() {
        var icon_html;
        switch (coll_type) {
        case 'tag':
          icon_html = '<i class="fa fa-tag"></i>';
          break;
        case 'note':
          icon_html = '<i class="fa fa-book"></i>';
          break;
        default:
          //
        }
        self.el = cards.util.createElement(
          cards.util.formatTmpl(tmpl, { icon: icon_html })
        );
        dom.title = self.el.querySelector('.title');

        // set event handler
        self.el.querySelector('.item-add-trigger').addEventListener(
          'click',
          function(event) {
            event.preventDefault();
            self.el.classList.add('syncing');
            config.create_coll(dom.title.innerText, coll_type)
              .then(function(coll) {
                if (coll) { dom.title.innerText = ''; }
                self.el.classList.remove('syncing');
              });
          },
          false
        );

        return self;
      };  // render

      return self;
    };  // create

    return { create: create };
  }());  // index_item_new


  index = (function() {
    var tmpl_sec_id = 'tmpl-nav-index-sec', tmpl_sec = null, create;

    create = function(index) {  // index: cards.model.index
      var
      self = { el: null, render: null, configure: null },
      config = { set_content_anchor: null, create_coll: null },
      dom = {
        special_sec: null, special_sec_ul: null,
        tag_sec: null, tag_sec_ul: null,
        note_sec: null, note_sec_ul: null
      },
      createColl
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
        var index_item_view;
        self.el = document.createElement('div');

        // special index
        dom.special_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Special' })
        );
        dom.special_sec_ul = dom.special_sec.querySelector('ul');
        dom.special_sec.classList.add('special');
        self.el.appendChild(dom.special_sec);
        index_item_view = index_item.create(index.get('special:all'));
        index_item_view.configure({
          set_content_anchor: config.set_content_anchor
        });
        dom.special_sec_ul.appendChild(index_item_view.render().el);

        // notes
        dom.note_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Notes' })
        );
        dom.note_sec_ul = dom.note_sec.querySelector('ul');
        self.el.appendChild(dom.note_sec);
        // new item
        index_item_view = index_item_new.create('note');
        index_item_view.configure({ create_coll: createColl });
        dom.new_note = index_item_view.render().el;
        dom.note_sec_ul.appendChild(dom.new_note);

        // tags
        dom.tag_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Tags' })
        );
        dom.tag_sec_ul = dom.tag_sec.querySelector('ul');
        self.el.appendChild(dom.tag_sec);
        // new item
        index_item_view = index_item_new.create('tag');
        index_item_view.configure({ create_coll: createColl });
        dom.new_tag = index_item_view.render().el;
        dom.tag_sec_ul.appendChild(dom.new_tag);

        // add to index
        index.each(function(coll) {
          index_item_view = index_item.create(coll);
          index_item_view.configure({
            set_content_anchor: config.set_content_anchor
          });

          switch (coll.get('type')) {
          case 'tag':
            //dom.tag_sec_ul.appendChild(index_item_view.render().el);
            dom.tag_sec_ul.insertBefore(
              index_item_view.render().el, dom.new_tag
            );
            break;

          case 'note':
            //dom.note_sec_ul.appendChild(index_item_view.render().el);
            dom.note_sec_ul.insertBefore(
              index_item_view.render().el, dom.new_note
            );
            break;

          default:
            //
          }
        });

        // add event handler
        index.on('add', function(coll, idx) {
          var first_item;
          index_item_view = index_item.create(coll);
          index_item_view.configure({
            set_content_anchor: config.set_content_anchor
          });

          switch (coll.get('type')) {
          case 'tag':
            first_item = dom.tag_sec_ul.querySelector('.nav-index-item');
            if (first_item) {
              dom.tag_sec_ul.insertBefore(
                index_item_view.render().el, first_item
              );
            } else {
              dom.tag_sec_ul.insertBefore(
                index_item_view.render().el, dom.new_tag
              );
            }
            break;

          case 'note':
            first_item = dom.note_sec_ul.querySelector('.nav-index-item');
            if (first_item) {
              dom.note_sec_ul.insertBefore(
                index_item_view.render().el, first_item
              );
            } else {
              dom.note_sec_ul.insertBefore(
                index_item_view.render().el, dom.new_note
              );
            }
            break;

          default:
            //
          }
          // animation
          index_item_view.el.scrollIntoView();
          index_item_view.el.classList.add('blink');
          setTimeout(function() {
            index_item_view.el.classList.remove('blink');
          }, 300);
        });  // index.on('add',

        return self;
      };  // render

      createColl = function(title, coll_type) {
        var promise;
        promise = new Promise(function(resolve, reject) {
          var coll;
          if (title.trim().length === 0) {
            return Promise.resolve();
          }
          coll = config.create_coll({ name: title.trim(), type: coll_type });
          coll.save().then(function(coll) {
            console.log(coll.get('id'));
            index.add(coll, 0);
            //
            resolve(coll);
          });
        });
        return promise;
      };

      return self;
    };  // index.create

    return { create: create };
  }());  // index


  annot_index_item = (function() {
    var tmpl_id = 'tmpl-nav-index-item', tmpl = null, create;

    create = function(model) {  // model: cards.model/models.coll
      var
      self = { el: null, render: null, configure: null },
      config = {
        on_change_annot_check: null,
        create_coll: null
      }
      ;

      if (!tmpl) {
        tmpl = document.getElementById(tmpl_id).text.trim();
      }

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };
     
      self.render = function() {
        var icon_html;
        switch (model.get('type')) {
        case 'tag':
          icon_html = '<i class="fa fa-tag"></i>';
          break;
        case 'note':
          icon_html = '<i class="fa fa-book"></i>';
          break;
        default:
          //
        }
        self.el = cards.util.createElement(
          cards.util.formatTmpl(tmpl, {
            id: model.get('id'), name: model.get('name'), icon: icon_html
          })
        );

        model.on('change:annot_check', function() {
          config.on_change_annot_check(model);

          switch (model.get('annot_check')) {
          case 'checked':
            self.el.classList.add('checked');
            self.el.classList.remove('partial');
            break;
          case 'partial':
            self.el.classList.add('partial');
            break;
          default:
            self.el.classList.remove('checked');
            self.el.classList.remove('partial');
          }
        });

        self.el.querySelector('.item-check-trigger').addEventListener(
          'click', function(event) {
            event.preventDefault();
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
  }());  // annot_index_item


  annot_index = (function() {
    var tmpl_sec_id = 'tmpl-nav-index-sec', tmpl_sec = null, create;

    create = function(index) {  // index: cards.model.index
      var
      self = { el: null, render: null, setState: null },
      config = { create_coll: null },
      state = { target: null, checked_colls: {} },
      dom = {
        tag_sec: null, tag_sec_ul: null,
        note_sec: null, note_sec_ul: null
      },
      onChangeAnnotCheck, createColl
      ;

      if (!tmpl_sec) {
        tmpl_sec = (
          document.getElementById(tmpl_sec_id).text.trim()
        );
      }

      onChangeAnnotCheck = function(coll) {
        // update card. coll is updated in cards.model.saveCard
        if (coll.get('annot_check') === 'checked') {
          state.checked_colls[coll.get('id')] = coll;
          state.target.each(function(card) {
            card.get('colls').add(coll);
          });
        } else {
          delete state.checked_colls[coll.get('id')];
          state.target.each(function(card) {
            if (card.get('colls').get(coll.get('id'))) {
              card.get('colls').remove(coll.get('id'));
            }
          });
        }
      };

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };

      self.render = function() {
        var index_item_view;
        self.el = document.createElement('div');

        // notes
        dom.note_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Notes' })
        );
        dom.note_sec_ul = dom.note_sec.querySelector('ul');
        self.el.appendChild(dom.note_sec);
        // new item
        index_item_view = index_item_new.create('note');
        index_item_view.configure({ create_coll: createColl });
        dom.new_note = index_item_view.render().el;
        dom.note_sec_ul.appendChild(dom.new_note);

        // tags
        dom.tag_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Tags' })
        );
        dom.tag_sec_ul = dom.tag_sec.querySelector('ul');
        self.el.appendChild(dom.tag_sec);
        // new item
        index_item_view = index_item_new.create('tag');
        index_item_view.configure({ create_coll: createColl });
        dom.new_tag = index_item_view.render().el;
        dom.tag_sec_ul.appendChild(dom.new_tag);

        // add to index
        index.each(function(coll) {
          index_item_view = annot_index_item.create(coll);
          index_item_view.configure({
            on_change_annot_check: onChangeAnnotCheck
          });

          switch (coll.get('type')) {
          case 'tag':
            //dom.tag_sec_ul.appendChild(index_item_view.render().el);
            dom.tag_sec_ul.insertBefore(
              index_item_view.render().el, dom.new_tag
            );
            break;

          case 'note':
            //dom.note_sec_ul.appendChild(index_item_view.render().el);
            dom.note_sec_ul.insertBefore(
              index_item_view.render().el, dom.new_note
            );
            break;

          default:
            //
          }
        });

        // add event handler
        index.on('add', function(coll, idx) {
          var first_item;
          index_item_view = annot_index_item.create(coll);
          index_item_view.configure({
            on_change_annot_check: onChangeAnnotCheck
          });

          switch (coll.get('type')) {
          case 'tag':
            first_item = dom.tag_sec_ul.querySelector('.nav-index-item');
            if (first_item) {
              dom.tag_sec_ul.insertBefore(
                index_item_view.render().el, first_item
              );
            } else {
              dom.tag_sec_ul.insertBefore(
                index_item_view.render().el, dom.new_tag
              );
            }
            break;

          case 'note':
            first_item = dom.note_sec_ul.querySelector('.nav-index-item');
            if (first_item) {
              dom.note_sec_ul.insertBefore(
                index_item_view.render().el, first_item
              );
            } else {
              dom.note_sec_ul.insertBefore(
                index_item_view.render().el, dom.new_note
              );
            }
            break;

          default:
            //
          }
          // animation
          index_item_view.el.scrollIntoView();
          index_item_view.el.classList.add('blink');
          setTimeout(function() {
            index_item_view.el.classList.remove('blink');
          }, 300);
        });  // index.on('add',

        return self;
      };  // self.render

      createColl = function(title, coll_type) {
        var promise;
        promise = new Promise(function(resolve, reject) {
          var coll;
          if (title.trim().length === 0) {
            return Promise.resolve();
          }
          coll = config.create_coll({ name: title.trim(), type: coll_type });
          coll.save().then(function(coll) {
            console.log(coll.get('id'));
            index.add(coll, 0);
            //
            resolve(coll);
          });
        });
        return promise;
      };

      self.setState = function(cards_, annot_type) {
        var freq = {}, checked_ids = [], partial_checked_ids = [];
        state.target = cards_;

        // clear check
        Object.keys(state.checked_colls).forEach(function(coll_id) {
          var checked = false;
          state.target.each(function(card) {
            if (card.get('colls').get(coll_id)) {
              checked = true;
            }
          });
          if (!checked) {
            index.get(coll_id).set({ annot_check: null });
          }
        });

        // set check status
        state.target.each(function(card) {
          card.get('colls').each(function(coll) {
            var coll_id = coll.get('id');
            freq[coll_id] = ((freq.hasOwnProperty(coll_id))
                             ? freq[coll_id] + 1 : 1);
          });
        });
        Object.keys(freq).forEach(function(coll_id) {
          if (state.target.len() === freq[coll_id]) {
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

    create = function(model) {  // model: cards.model.models.card
      var
      self = { el: null, render: null, configure: null, destroy: null },
      config = { set_edit_target: null, set_annot_target: null },
      state = { opened: false },
      dom = {},
      onChangeChecked
      ;

      if (!tmpl) {
        tmpl = document.getElementById(tmpl_id).text.trim();
      }

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };

      self.render = function() {
        var coll_array;  // for sort
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
          self.el.querySelector('.item-content').addEventListener(
            'click',
            function(event) {
              if (state.opened) {
                self.el.classList.remove('opened');
                state.opened = false;
              }
              else {
                self.el.classList.add('opened');
                state.opened = true;
              }
            },
            false
          );
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

          model.on('change', self.render);
          model.get('colls').on('add', self.render);
          model.get('colls').on('remove', self.render);
          model.on('change:checked', onChangeChecked);
        }

        // render model content
        dom.title.innerHTML = model.get('title');
        dom.body.innerHTML = model.get('body');

        // render coll
        dom.colls.innerHTML = null;
        // sort: note -> tag
        coll_array = [];
        model.get('colls').each(function(coll) {
          if (coll.get('type') === 'note') {
            coll_array.push(coll);
          }
        });
        model.get('colls').each(function(coll) {
          if (coll.get('type') === 'tag') {
            coll_array.push(coll);
          }
        });
        coll_array.forEach(function(coll) {
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

      self.destroy = function() {
        model.off('change', self.render);
        model.get('colls').off('add', self.render);
        model.get('colls').off('remove', self.render);
        model.set({ checked: false });
        model.off('change:checked', onChangeChecked);
        self.el.remove();
      };

      onChangeChecked = function() {
        config.set_annot_target(model);
        if (model.get('checked')) {
          self.el.classList.add('checked');
        } else {
          self.el.classList.remove('checked');
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
