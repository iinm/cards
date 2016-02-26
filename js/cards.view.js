/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, Promise */

cards.view = (function() {
  "use strict";
  var
  index_item, index_item_new, index,
  annot_index_item, annot_index,
  search, card;

  index_item = (function() {
    var tmpl_id = 'tmpl-nav-index-item', tmpl = null, create;

    create = function(model) {  // model: cards.model/models.coll
      var
      self = { el: null, render: null, configure: null },
      config = {
        set_content_anchor: null,
        remove_editor_coll: null,
        remove_coll: null
      },
      state = { mode: null },
      dom = {},
      onClickDone, onMatchSearchInput
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
          'click',
          function(event) {
            event.preventDefault();
            if (state.mode === 'edit') {
              return;
            }
            console.log('click:', model.get('id'), model.get('name'));
            config.set_content_anchor(model.get('id'));
          },
          false
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
              config.remove_coll(model).then(function(coll) {
                // animation
                self.el.classList.add('blink-red');
                setTimeout(function() {
                  self.el.classList.remove('blink-red');
                }, 300);
                setTimeout(function() {
                  // off
                  model.off('change:match_search_input', onMatchSearchInput);
                  self.el.remove();
                }, 600);
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

        dom.title.addEventListener('keydown', function(event) {
          // Note: 'keyCode' is deprecated
          // https://developer.mozilla.org/en-US/docs/Web/Events/keydown
          if (event.keyCode === 13) {
            onClickDone(event);
          }
        }, false);

        self.el.querySelector('.item-config-menu .done').addEventListener(
          'click', onClickDone, false
        );

        model.on('change:match_search_input', onMatchSearchInput);

        return self;
      };  // render

      onMatchSearchInput = function() {
        var match = model.get('match_search_input');
        if (match === null || match === true) {
          self.el.classList.remove('cards-util-hide');
          if (match === true) {
            self.el.classList.add('blink');
            setTimeout(function() {
              self.el.classList.remove('blink');
            }, 300);
          }
        } else if (match === false) {
          self.el.classList.add('cards-util-hide');
        }
      };

      onClickDone = function(event) {
        var model_clone;
        event.preventDefault();
        state.mode = null;
        dom.title.focus();
        dom.title.setAttribute('contenteditable', 'false');
        self.el.classList.remove('config-menu-opened');
        self.el.classList.remove('edit-mode');

        if (dom.title.innerHTML.trim() !== model.get('name')) {
          model_clone = model.clone();
          model_clone.set({ name: dom.title.innerHTML.trim() });
          self.el.classList.add('syncing');
          model_clone.save().then(function(coll) {
            // modify draft coll
            config.remove_editor_coll(null);
            dom.title.innerHTML = coll.get('name');
            // animation
            self.el.classList.remove('syncing');
            self.el.classList.add('blink');
            setTimeout(function() {
              self.el.classList.remove('blink');
            }, 300);
          });
        }
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
      dom = {},
      onClickAdd
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
        onClickAdd = function(event) {
          event.preventDefault();
          if (dom.title.textContent.trim().length === 0) {
            return;
          }
          self.el.classList.add('syncing');
          config.create_coll(dom.title.innerHTML, coll_type)
            .then(function(coll) {
              if (coll) { dom.title.innerHTML = ''; }
              self.el.classList.remove('syncing');
            });
        };

        dom.title.addEventListener('keydown', function(event) {
          // Note: 'keyCode' is deprecated
          // https://developer.mozilla.org/en-US/docs/Web/Events/keydown
          if (event.keyCode === 13) {
            onClickAdd(event);
          }
        }, false);

        self.el.querySelector('.item-add-trigger').addEventListener(
          'click', onClickAdd, false
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
      config = {
        set_content_anchor: null,
        create_coll: null,
        remove_editor_coll: null
      },
      dom = {
        special_sec: null, special_sec_ul: null,
        tag_sec: null, tag_sec_ul: null,
        note_sec: null, note_sec_ul: null
      },
      addItem, createColl, removeColl
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
        var item_view;
        self.el = document.createElement('div');

        // special index
        dom.special_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Special' })
        );
        dom.special_sec_ul = dom.special_sec.querySelector('ul');
        dom.special_sec.classList.add('special');
        self.el.appendChild(dom.special_sec);
        item_view = index_item.create(index.get('special:all'));
        item_view.configure({
          set_content_anchor: config.set_content_anchor
        });
        dom.special_sec_ul.appendChild(item_view.render().el);

        // notes
        dom.note_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Notes' })
        );
        dom.note_sec_ul = dom.note_sec.querySelector('ul');
        self.el.appendChild(dom.note_sec);
        // new item
        item_view = index_item_new.create('note');
        item_view.configure({ create_coll: createColl });
        dom.new_note = item_view.render().el;
        dom.note_sec_ul.appendChild(dom.new_note);

        // tags
        dom.tag_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Tags' })
        );
        dom.tag_sec_ul = dom.tag_sec.querySelector('ul');
        self.el.appendChild(dom.tag_sec);
        // new item
        item_view = index_item_new.create('tag');
        item_view.configure({ create_coll: createColl });
        dom.new_tag = item_view.render().el;
        dom.tag_sec_ul.appendChild(dom.new_tag);

        // add to index
        index.each(function(coll) {
          addItem(coll, null);
        });

        // add event handler
        index.on('add', addItem);

        return self;
      };  // render

      addItem = function(coll, idx) {
        var item_view, item_el, first_item_el;

        item_el = self.el.querySelector(
          cards.util.formatTmpl('li[coll-id="{{id}}"]', { id: coll.get('id') })
        );
        if (!item_el) {
          item_view = index_item.create(coll);
          item_view.configure({
            set_content_anchor: config.set_content_anchor,
            remove_editor_coll: config.remove_editor_coll,
            remove_coll: removeColl
          });
          item_el = item_view.render().el;
        }

        switch (coll.get('type')) {
        case 'tag':
          first_item_el = dom.tag_sec_ul.querySelector('.nav-index-item');
          if (idx === 0 && first_item_el) {
            dom.tag_sec_ul.insertBefore(item_el, first_item_el);
          } else {
            dom.tag_sec_ul.insertBefore(item_el, dom.new_tag);
          }
          break;
        case 'note':
          first_item_el = dom.note_sec_ul.querySelector('.nav-index-item');
          if (idx === 0 && first_item_el) {
            dom.note_sec_ul.insertBefore(item_el, first_item_el);
          } else {
            dom.note_sec_ul.insertBefore(item_el, dom.new_note);
          }
          break;
        default:
          //
        }
        // animation
        //item_el.scrollIntoView();
        item_el.classList.add('blink');
        setTimeout(function() { item_el.classList.remove('blink'); }, 300);
      };

      createColl = function(title, coll_type) {
        var promise;
        promise = new Promise(function(resolve, reject) {
          var coll;
          if (title.trim().length === 0) {
            return Promise.resolve();
          }
          coll = config.create_coll({ name: title.trim(), type: coll_type });
          coll.save().then(resolve);
        });
        return promise;
      };

      removeColl = function(coll) {
        var promise;
        promise = new Promise(function(resolve, reject) {
          coll.destroy().then(function(coll) {
            config.remove_editor_coll(coll.get('id'));
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
      config = { on_change_annot_check: null },
      dom = {},
      onChangeName, onMatchSearchInput
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
        dom.name = self.el.querySelector('.title');

        // event handlers
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

        model.on('change:name', onChangeName);
        model.on('change:match_annot_search_input', onMatchSearchInput);

        model.on('destroy', function() {
          model.set({ annot_check: null });
          // Note: doesn't need 'off', see model_util/model/destroy ???
          model.off('change:name', onChangeName);
          model.off('change:match_annot_search_input', onMatchSearchInput);
          self.el.remove();
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
      };  // render

      onChangeName = function() {
        dom.name.innerHTML = model.get('name');
      };

      onMatchSearchInput = function() {
        var match = model.get('match_annot_search_input');
        if (match === null || match === true) {
          self.el.classList.remove('cards-util-hide');
          if (match === true) {
            self.el.classList.add('blink');
            setTimeout(function() {
              self.el.classList.remove('blink');
            }, 300);
          }
        } else if (match === false) {
          self.el.classList.add('cards-util-hide');
        }
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
      addItem, onChangeAnnotCheck, createColl
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
        var item_view;
        self.el = document.createElement('div');

        // notes
        dom.note_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Notes' })
        );
        dom.note_sec_ul = dom.note_sec.querySelector('ul');
        self.el.appendChild(dom.note_sec);
        // new item
        item_view = index_item_new.create('note');
        item_view.configure({ create_coll: createColl });
        dom.new_note = item_view.render().el;
        dom.note_sec_ul.appendChild(dom.new_note);

        // tags
        dom.tag_sec = cards.util.createElement(
          cards.util.formatTmpl(tmpl_sec, { title: 'Tags' })
        );
        dom.tag_sec_ul = dom.tag_sec.querySelector('ul');
        self.el.appendChild(dom.tag_sec);
        // new item
        item_view = index_item_new.create('tag');
        item_view.configure({ create_coll: createColl });
        dom.new_tag = item_view.render().el;
        dom.tag_sec_ul.appendChild(dom.new_tag);

        // add to index
        index.each(function(coll) {
          addItem(coll, null);
        });

        // add event handler
        index.on('add', addItem);
     
        return self;
      };  // self.render

      onChangeAnnotCheck = function(coll) {
        // update card. coll is updated in cards.model.saveCard
        if (coll.get('annot_check') === 'checked') {
          state.checked_colls[coll.get('id')] = coll;
          state.target.each(function(card) {
            card.get('colls').add(coll);
          });
        }
        else if (coll.get('annot_check') === 'partial') {
          state.checked_colls[coll.get('id')] = coll;
        }
        else {
          delete state.checked_colls[coll.get('id')];
          state.target.each(function(card) {
            if (card.get('colls').get(coll.get('id'))) {
              card.get('colls').remove(coll.get('id'));
            }
          });
        }
      };

      addItem = function(coll, idx) {
        var item_view, item_el, first_item_el;

        item_el = self.el.querySelector(
          cards.util.formatTmpl('li[coll-id="{{id}}"]', { id: coll.get('id') })
        );
        if (!item_el) {
          item_view = annot_index_item.create(coll);
          item_view.configure({
            on_change_annot_check: onChangeAnnotCheck
          });
          item_el = item_view.render().el;
        }

        switch (coll.get('type')) {
        case 'tag':
          first_item_el = dom.tag_sec_ul.querySelector('.nav-index-item');
          if (idx === 0 && first_item_el) {
            dom.tag_sec_ul.insertBefore(item_el, first_item_el);
          } else {
            dom.tag_sec_ul.insertBefore(item_el, dom.new_tag);
          }
          break;
        case 'note':
          first_item_el = dom.note_sec_ul.querySelector('.nav-index-item');
          if (idx === 0 && first_item_el) {
            dom.note_sec_ul.insertBefore(item_el, first_item_el);
          } else {
            dom.note_sec_ul.insertBefore(item_el, dom.new_note);
          }
          break;
        default:
          //
        }
        // animation
        //item_el.scrollIntoView();
        item_el.classList.add('blink');
        setTimeout(function() { item_el.classList.remove('blink'); }, 300);
      };  // addItem

      createColl = function(title, coll_type) {
        var promise;
        promise = new Promise(function(resolve, reject) {
          var coll;
          if (title.trim().length === 0) {
            return Promise.resolve();
          }
          coll = config.create_coll({ name: title.trim(), type: coll_type });
          coll.save().then(resolve);
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
      };  // self.setState
      
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
          onChangeChecked();
        }

        // render model content
        dom.title.innerHTML = model.get('title');
        dom.body.innerHTML = model.get('body');

        // render coll
        dom.colls.innerHTML = null;
        // render date
        dom.colls.appendChild(
          cards.util.createElement('<li>' + model.get('created_date') + '</li>')
        );

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
        //model.set({ checked: false });
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

  search = (function() {
    var tmpl_id = 'tmpl-search', tmpl = null, create;

    create = function(model) {  // cards.models/search
      var
      self = { el: null, render: null, configure: null },
      config = {
        set_edit_target: null, set_annot_target: null, load_more: null
      },
      state = { card_id2view: {} },
      onAddItem, onRemoveItem, onChangeState
      ;

      if (!tmpl) {
        tmpl = document.getElementById(tmpl_id).text.trim();
      }

      self.configure = function(kv_map) {
        cards.util.updateObj(config, kv_map);
      };

      self.render = function() {
        if (!self.el) {
          self.el = cards.util.createElement(tmpl);
        }

        // event handlers
        model.on('change:searching', onChangeState);
        model.get('cards').on('add', onAddItem);
        model.get('cards').on('remove', onRemoveItem);

        return self;
      };  // render

      onChangeState = function() {
        if (model.get('searching') && !model.get('fetched')) {
          self.el.classList.add('searching');
        } else {
          self.el.classList.remove('searching');
          // after rendering results
          setTimeout(config.load_more, 100);
        }
      };

      onAddItem = function(card) {
        var card_view = cards.view.card.create(card);
        state.card_id2view[card.get('id')] = card_view;
        card_view.configure({
          set_edit_target: config.set_edit_target,
          set_annot_target: config.set_annot_target
        });
        //card.on('destroy', function() { onRemoveItem(card); });
        self.el.appendChild(card_view.render().el);
        setTimeout(function() { card_view.el.classList.add('blink'); }, 300);
        setTimeout(function() { card_view.el.classList.remove('blink'); }, 600);
      };

      onRemoveItem = function(card) {
        var card_view = state.card_id2view[card.get('id')];
        card.set({ checked: false });
        // animation
        card_view.el.classList.add('blink-red');
        setTimeout(function() {
          card_view.el.classList.remove('blink-red');
        }, 300);
        setTimeout(function() {
          card_view.destroy();
          delete state.card_id2view[card.get('id')];
        }, 600);
      };

      return self;
    };  // create
 
    return { create: create };
  }());
  
  return {
    index: index, index_item: index_item,
    annot_index: annot_index,
    search: search, card: card
  };
}());
