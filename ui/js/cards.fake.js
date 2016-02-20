/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global cards, Promise */

cards.fake = (function() {
  "use strict";
  var
  cards_ = {}, colls = {}, card_ids, coll_ids, num_card, num_coll,
  getCollections, saveColl, deleteColl,
  getCards, saveCard, deleteCard, search
  ;

  card_ids = [
    'card_01', 'card_02', 'card_03', 'card_04', 'card_05', 'card_06', 'card_07',
    'card_08', 'card_09', 'card_10', 'card_11', 'card_12', 'card_13', 'card_14',
    'card_15', 'card_16', 'card_17', 'card_18', 'card_19', 'card_20', 'card_21',
    'card_23', 'card_24', 'card_26', 'card_25', 'card_22'
  ];
  num_card = card_ids.length;
  cards_ = {
    card_01: {
      title: 'Episode I: The Phantom Menace',
      body: 'Turmoil has engulfed the Galactic Republic. The taxation of trade routes to outlying star systems is in dispute.',
      id: 'card_01',
      coll_ids: ['tag_06', 'note_04']
    },
    card_02: {
      title: 'Episode II: Attack of the Clones',
      body: 'There is unrest in the Galactic Senate. Several thousand solar systems have declared their intentions to leave the Republic.',
      id: 'card_02',
      coll_ids: ['tag_06', 'note_04']
    },
    card_03: {
      title: 'Episode III: Revenge of the Sith',
      body: 'War! The Republic is crumbling under attacks by the ruthless Sith Lord, Count Dooku. There are heroes on both sides. Evil is everywhere.',
      id: 'card_03',
      coll_ids: ['tag_06', 'note_04']
    },
    card_04: {
      title: 'Episode IV: A New Hope',
      body: 'It is a period of civil war. Rebel spaceships, striking from a hidden base, have won their first victory against the evil Galactic Empire.',
      id: 'card_04',
      coll_ids: ['tag_06', 'note_04']
    },
    card_05: {
      title: 'Episode V: The Empire Strikes Back',
      body: 'It is a dark time for the Rebellion. Although the Death Star has been destroyed, Imperial troops have driven the Rebel forces from their hidden base and pursued them across the galaxy.',
      id: 'card_05',
      coll_ids: ['tag_06', 'note_04']
    },
    card_06: {
      title: 'Episode VI: Return of the Jedi',
      body: 'Luke Skywalker has returned to his home planet of Tatooine in an attempt to rescue his friend Han Solo from the clutches of the vile gangster Jabba the Hutt.',
      id: 'card_06',
      coll_ids: ['tag_06', 'note_04']
    },
    card_07: {
      title: 'Episode VII: The Force Awakens',
      body: 'Luke Skywalker has vanished. In his absence, the sinister FIRST ORDER has risen from the ashes of the Empire and will not rest until Skywalker, the last Jedi, has been destroyed.',
      id: 'card_07',
      coll_ids: ['tag_06', 'note_04']
    },
    card_08: {
      title: 'margin',
      body: 'margin: top right bottom left<br>t rl b<br>tb rl',
      id: 'card_08',
      coll_ids: ['tag_02']
    },
    card_09: {
      title: 'traisition',
      body: '.cards-editor {<br>  position: absolute;<br>  bottom: 0;<br>  height: 3em;<br>  transition: height 250ms ease;<br>}<br>.cards-editor.opened {<br>  height: calc(100vh - 3.5em);<br>}',
      id: 'card_09',
      coll_ids: ['tag_02']
    },
    card_10: {
      title:'blink',
      body: "/* css */<br>.blink {<br>box-shadow: 0 0 .6em #40C0CB;<br>}<br><br>// js<br>el.classList.add('blink');<br>setTimeout(function() { el.classList.remove('blink') }, 300);",
      id: 'card_10',
      coll_ids: ['tag_02', 'tag_03']
    },
    card_11: {
      title: 'custom variables',
      body: "Chrome 49+ (Feb 29th, 2016)<br>:root {<br> --nav-head-color: #eee;<br>}<br>",
      id: 'card_11',
      coll_ids: ['tag_02']
    },
    card_12: {
      title: 'placeholder for contenteditable',
      body: '/* css */<br>div[contentEditable]:empty:not(:focus):before {<br> content: attr(data-text);<br> color: #aaa;<br>}<br><br> &lt;div contenteditable="true" data-text="New"&gt;&lt;/div&gt;',
      id: 'card_12',
      coll_ids: ['tag_02', 'tag_01']
    },
    card_13: {
      title: 'prepare storage',
      body: "pvcreate /dev/sda3<br> vgcreate debian-vg /dev/sda3<br> lvcreate -L 6G debian-vg -n swap<br> lvcreate -l +100%FREE debian-vg -n root<br><br> mkfs.ext4 /dev/sda2<br> mkfs.ext4 /dev/debian-vg/root<br> mkswap /dev/debian-vg/swap<br><br>swapon /dev/debian-vg/swap<br> mkdir /mnt/debian<br> mount /dev/debian-vg/root /mnt/debian/<br> mkdir /mnt/debian/boot<br> mount /dev/sda2 /mnt/debian/boot",
      id: 'card_13',
      coll_ids: ['note_03']
    },
    card_14: {
      title: 'bootstrap',
      body: "sudo apt-get install debootstrap<br> debootstrap --arch amd64 jessie /mnt/debian http://ftp.jp.debian.org/debian<br>",
      id: 'card_14',
      coll_ids: ['note_03']
    },
    card_15: {
      title: 'follow the official guide',
      body: 'https://www.debian.org/releases/stable/i386/apds03.html',
      id: 'card_15',
      coll_ids: ['note_03']
    },
    card_16: {
      title: 'note',
      body: "before chroot<br> mount -o bind /dev /mnt/debian/dev<br> mount -t proc none /mnt/debian/proc<br><br> apt-get install lvm2<br> tasksel  # gnome, laptop",
      coll_ids: ['note_03']
    },
    card_17: {
      title: 'create model',
      body: 'rails g model review<br> emacs db/migrate/20151223082746_create_reviews.rb<br> bundle exec rake db:migrate<br><br> rails g migration AddNicknameToUsers nickname:string  # 複数形<br> rails g migration RemoveNicknameFromReviews nickname:string',
      id: 'card_17',
      coll_ids: ['note_02', 'tag_05']
    },
    card_18: {
      title: 'rollback',
      body: 'bundle exec rake db:rollback',
      id: 'card_18',
      coll_ids: ['note_02', 'tag_05']
    },
    card_19: {
      title: 'controller',
      body: 'rails g controller users  # 複数形',
      id: 'card_19',
      coll_ids: ['note_02', 'tag_05']
    },
    card_20: {
      title: 'check router',
      body: 'bundle exec rake routes',
      id: 'card_20',
      coll_ids: ['note_02', 'tag_05']
    },
    card_21: {
      title: 'devise',
      body: 'rails generate devise:install<br> rails g devise user<br> rails g devise:views<br><br> user_signed_in?<br><br> before_action authenticate_user!, only: [:new, :create]<br><br> devise_parameter_sanitizer.for(追加したいメソッドの種類).push(追加したいパラメータ名)',
      id: 'card_21',
      coll_ids: ['note_02', 'tag_05']
    },
    card_22: {
      title: 'Hello World!',
      body: 'Cardsはモバイルデバイス用のノートアプリです．左上のメニューアイコンをタップして，Cards Helpを覗いてみましょう!',
      id: 'card_22',
      coll_ids: ['note_01']
    },
    card_23: {
      title: 'Cardの作成',
      body: '画面下にあるエディタ右のえんぴつアイコンをタップして，Cardを作ってみましょう．',
      id: 'card_23',
      coll_ids: ['note_01']
    },
    card_24: {
      title: 'Tag，Note',
      body: 'Tag, Noteを使うことで，Cardをグループ化することが出来ます．<br>Tagはその名の通り，Cardをグループ化するだけですが，NoteはCardの順序を保存します．',
      id: 'card_24',
      coll_ids: ['note_01']
    },
    card_25: {
      title: 'Warning!',
      body: 'これはCardsのデモ版です．ページをリロードすると，変更が破棄されます．',
      id: 'card_25',
      coll_ids: []
    },
    card_26: {
      title: 'ホーム画面に追加',
      body: 'ブラウザのメニューから「ホーム画面に追加」すると，画面を広く使えます．',
      id: 'card_26',
      coll_ids: ['note_01']
    }
  };

  coll_ids = [
    'tag_01', 'tag_02', 'tag_03', 'tag_04', 'tag_05', 'tag_06',
    'note_01', 'note_02', 'note_03', 'note_04'
  ];
  num_coll = coll_ids.length;
  colls = {
    tag_01: { name: 'HTML', id: 'tag_01', type: 'tag' },
    tag_02: { name: 'CSS', id: 'tag_02', type: 'tag' },
    tag_03: { name: 'JavaScript', id: 'tag_03', type: 'tag' },
    tag_04: { name: 'Ruby', id: 'tag_04', type: 'tag' },
    tag_05: { name: 'Rails', id: 'tag_05', type: 'tag' },
    tag_06: { name: 'Star Wars', id: 'tag_06', type: 'tag' },
    note_01: {
      name: 'Cards Help', id: 'note_01', type: 'note',
      card_ids: ['card_22', 'card_23', 'card_24', 'card_26']
    },
    note_02: {
      name: 'Rails cheat sheet', id: 'note_02', type: 'note',
      card_ids: ['card_17', 'card_18', 'card_19', 'card_20', 'card_21']
    },
    note_03: {
      name: 'Debian install log (looooooooooooooong title test)',
      id: 'note_03', type: 'note',
      card_ids: ['card_13', 'card_14', 'card_15', 'card_16']
    },
    note_04: {
      name: 'Star Wars Opening', id: 'note_04', type: 'note',
      card_ids: [
        'card_01', 'card_02', 'card_03', 'card_04', 'card_05',
        'card_06', 'card_07'
      ]
    }
  };

  // TODO
  // tagging = [
  //   ['card_', 'coll_'], ...
  // ];

  getCollections = function() {
    var promise;
    promise = new Promise(function(resolve, reject) {
      var i, reversed = [];
      //for (i = coll_ids.length - 1; i >= 0; i--) {
      for (i = 0; i < coll_ids.length; i++) {
        reversed.push(colls[coll_ids[i]]);
      }
      setTimeout(function() { resolve(reversed); }, 700);
    });
    return promise;
  };

  saveColl = function(data_) {
    var promise;
    promise = new Promise(function(resolve, reject) {
      if (!data_.id) {  // new coll
        data_.id = '_coll_' + num_coll;
        num_coll += 1;
        coll_ids.push(data_.id);
        if (data_.type === 'note') {
          data_.card_ids = [];
        }
        colls[data_.id] = data_;
      } else {
        cards.util.updateObj(colls[data_.id], data_);
      }
      //
      setTimeout(function() { resolve(data_); }, 700);
    });
    return promise;
  };

  deleteColl = function(coll_id) {
    var promise;
    promise = new Promise(function(resolve, reject) {
      var coll_idx = coll_ids.indexOf(coll_id);
      // update cards
      card_ids.forEach(function(card_id) {
        var card = cards_[card_id], idx;
        idx = card.coll_ids.indexOf(coll_id);
        if (idx > -1) {
          card.coll_ids.splice(idx, 1);
        }
      });
      // delete self
      coll_ids.splice(coll_idx, 1);
      delete colls[coll_id];

      setTimeout(function() { resolve(coll_id); }, 700);
    });
    return promise;
  };

  getCards = function(coll_id, last_card_id) {
    var promise;
    promise = new Promise(function(resolve, reject) {
      var i, card_array_ = [], start_idx = 0;
      if (coll_id === 'special:all' || colls[coll_id].type === 'tag') {
        for (i = 0; i < card_ids.length; i++) {
          if (coll_id === 'special:all'
              || cards_[card_ids[i]].coll_ids.indexOf(coll_id) > -1
             ) {
            card_array_.push(cards_[card_ids[i]]);
          }
        }
        card_array_.reverse();
        // simulate pagination
        if (last_card_id) {
          start_idx = card_array_.indexOf(cards_[last_card_id]) + 1;
        }
        card_array_ = card_array_.slice(start_idx, start_idx + 10);
      }
      else {  // note
        colls[coll_id].card_ids.forEach(function(card_id) {
          card_array_.push(cards_[card_id]);
        });
      }

      setTimeout(function() { resolve(card_array_); }, 700);
    });
    return promise;
  };

  saveCard = function(data_) {
    var promise;
    promise = new Promise(function(resolve, reject) {
      // TODO: handle error
      if (!data_.id) {  // new card
        data_.id = '_card_' + num_card;
        num_card += 1;
        card_ids.push(data_.id);
      }
      else {  // update
        // if title or body is changed -> change order
        if (data_.title !== cards_[data_.id].title
            || data_.body !== cards_[data_.id].body
           ) {
          card_ids.splice(card_ids.indexOf(data_.id), 1);
          card_ids.push(data_.id);
        }
        //
        cards_[data_.id].coll_ids.forEach(function(coll_id) {
          if (colls[coll_id].type === 'note'
              && data_.coll_ids.indexOf(coll_id) === -1
             ) {
            // remove card from note
            colls[coll_id].card_ids.splice(
              colls[coll_id].card_ids.indexOf(data_.id), 1
            );
          }
        });
      }
      cards_[data_.id] = data_;

      // update notes
      data_.coll_ids.forEach(function(coll_id) {
        var coll = colls[coll_id];
        if (coll.type === 'note' && coll.card_ids.indexOf(data_.id) === -1) {
          coll.card_ids.push(data_.id);
        }
      });
      // TODO: update index item order; updated first

      setTimeout(function() { resolve(data_); }, 700);
    });
    return promise;
  };

  deleteCard = function(card_id) {
    var promise;
    promise = new Promise(function(resolve, reject) {
      var idx = card_ids.indexOf(card_id);
      if (idx > -1) {
        // update note
        cards_[card_id].coll_ids.forEach(function(coll_id) {
          var coll = colls[coll_id];
          if (coll.type === 'note') {
            coll.card_ids.splice(coll.card_ids.indexOf(card_id), 1);
          }
        });
        // delete self
        card_ids.splice(idx, 1);
        delete cards_[card_id];
      }

      setTimeout(function() { resolve(card_id); }, 700);
    });
    return promise;
  };

  search = function(query, last_card_id) {
    var promise;
    promise = new Promise(function(resolve, reject) {
      var i, result = [], card, start_idx = 0;
      query = query.toLowerCase();
      for (i = card_ids.length - 1; i >= 0; i--) {
        card = cards_[card_ids[i]];
        if (card.title.toLowerCase().indexOf(query) > -1
            || card.body.toLowerCase().indexOf(query) > -1
           ) {
          result.push(card);
        }
      }
      // simulate pagination
      if (last_card_id) {
        start_idx = result.indexOf(cards_[last_card_id]) + 1;
      }
      result = result.slice(start_idx, start_idx + 10);

      setTimeout(function() { resolve(result); }, 700);
    });
    return promise;
  };

  return {
    getCollections: getCollections,
    saveColl: saveColl,
    deleteColl: deleteColl,
    getCards: getCards,
    saveCard: saveCard,
    deleteCard: deleteCard,
    search: search
  };
}());
