const api = require('../components/api');
const kit = require('../components/kanzakit');
const toast = require('../components/toast');

const live = require('./live');

class admin {
  static toggle(mode, is_force = false) {
    if (!config.live.is_broadcaster && !config.live.is_collabo && !is_force)
      return false;

    if (confirm('よろしいですか？')) {
      if (
        mode === 'stop' &&
        is_force &&
        !confirm(
          '【警告】\n配信を管理者権限で強制終了します！！後からやり直す事は出来ません。本当によろしいですか？'
        )
      )
        return;
      api
        .request('client/live/setting', 'POST', {
          type: mode,
          live_id: config.live.id,
          force: is_force ? 1 : 0
        })
        .then(json => {
          if (json['success']) {
            toast.new(`${mode}: 設定しました。`, '.bg-success');
          }
        });
    }
  }

  static openListenerModal() {
    if (!config.live.is_broadcaster) return false;
    $('#listenerModal').modal('show');

    api.request('client/live/listener', 'GET').then(json => {
      if (json) {
        let html = '';
        for (let item of json) {
          item.name = kit.escape(item.name);
          html += `<tr><td><img src="${
            item.avatar_url
          }" width="25" height="25"/> <b>${item.name}</b> <small>@${
            item.acct
          }</small></td></tr>`;
        }
        kit.elemId('listener_list').innerHTML = html;
      }
    });
  }

  static openEditLive() {
    if (!config.live.is_broadcaster) return false;

    $('.live_info').addClass('invisible');
    $('.live_edit').removeClass('invisible');
  }

  static undoEditLive() {
    if (!config.live.is_broadcaster) return false;

    kit.elemId('edit_name').value = config.live.watch_data['name'];

    const parser = document.createElement('div');
    parser.innerHTML = config.live.watch_data['description'];
    kit.elemId('edit_desc').value = parser.textContent;

    $('.live_info').removeClass('invisible');
    $('.live_edit').addClass('invisible');
  }

  static editLive() {
    if (!config.live.is_broadcaster) return false;

    const name = kit.elemId('edit_name').value;
    const desc = kit.elemId('edit_desc').value;

    if (!name || !desc) {
      toast.new('エラー: タイトルか説明が入力されていません。', '.bg-warning');
      return;
    }

    api
      .request('client/edit_live', 'POST', {
        name,
        description: desc
      })
      .then(json => {
        $('.live_info').removeClass('invisible');
        $('.live_edit').addClass('invisible');
        live.watch();
        toast.new(`編集しました。`, '.bg-success');
      });
  }

  static addBlocking(live_id = null) {
    const acct = kit.elemId('blocking_acct').value;
    if (confirm(`「${acct}」をブロックします。\nよろしいですか？`)) {
      api
        .request('client/ngs/manage_users', 'POST', {
          type: 'add',
          acct,
          is_permanent: kit.elemId('blocking_permanent').checked ? 1 : 0,
          is_blocking_watch: kit.elemId('blocking_blocking_watch').checked
            ? 1
            : 0,
          live_id: live_id
        })
        .then(json => {
          if (json['success']) {
            kit.elemId('blocking_acct').value = '';
            $('#blockingModal').modal('hide');
            if (!config.live) location.reload();
          } else {
            toast.new(
              'エラーが発生しました。データベースに問題が発生している可能性があります。',
              '.bg-danger'
            );
          }
        });
    }
  }

  static removeBlocking(acct, obj = null) {
    if (confirm(`「${acct}」のブロックを解除します。\nよろしいですか？`)) {
      api
        .request('client/ngs/manage_users', 'POST', {
          type: 'remove',
          user_id: acct
        })
        .then(json => {
          if (json['success']) {
            $(obj)
              .parent()
              .parent()
              .remove();
          } else {
            toast.new(
              'エラーが発生しました。データベースに問題が発生している可能性があります。',
              '.bg-danger'
            );
          }
        });
    }
  }

  static updateNGWord(name, type, obj = null) {
    const mode = type ? '追加' : '削除';
    if (confirm(`「${name}」を${mode}します。\nよろしいですか？`)) {
      api
        .request('client/ngs/manage_words', 'POST', {
          type: type ? 'add' : 'remove',
          word: name
        })
        .then(json => {
          if (json['success']) {
            if (type) {
              $('tbody').prepend(
                `<tr><td><a href="#" onclick="knzk.live.admin.updateNGWord('${
                  json['word']
                }', false, this);return false">削除</a>　${
                  json['word']
                }</td></tr>`
              );
              kit.elemId('word').value = '';
            } else
              $(obj)
                .parent()
                .parent()
                .remove();
          } else {
            toast.new(
              'エラーが発生しました。データベースに問題が発生している可能性があります。',
              '.bg-danger'
            );
          }
        });
    }
  }

  static addCH() {
    const currency = kit.elemId('addch_currency').innerText;
    const acct = kit.elemId('addch_acct');
    const amount = kit.elemId('addch_amount');

    if (confirm(`「${acct.value}」を追加します。\nよろしいですか？`)) {
      api
        .request('client/live/add_ch', 'POST', {
          acct: acct.value,
          amount: amount.value,
          currency
        })
        .then(json => {
          if (json['success']) {
            acct.value = '';
            amount.value = '';
            $('#addChModal').modal('hide');
          } else {
            toast.new(
              'エラーが発生しました。データベースに問題が発生している可能性があります。',
              '.bg-danger'
            );
          }
        });
    }
  }

  static openCollaboModal() {
    if (!config.live.is_broadcaster) return false;
    $('#collaboModal').modal('show');

    api
      .request('client/collabo/member', 'POST', {
        live_id: config.live.id
      })
      .then(json => {
        if (json) {
          let html = '';
          for (let item of json) {
            item.name = kit.escape(item.name);
            html += `<tr><td><img src="${
              item.avatar_url
            }" width="25" height="25"/> <b>${item.name}</b> <small>@${
              item.acct
            }</small>
            <button onclick="live.admin.manageCollabo('remove', ${
              item.id
            })" class="btn btn-danger btn-sm float-right">削除</button>
            </td></tr>`;
          }
          kit.elemId('collabo_list').innerHTML = html;
        }
      });
  }

  static manageCollabo(type, id = null) {
    if (!config.live.is_broadcaster) return false;
    if (type === 'remove' && !confirm('削除します。よろしいですか？'))
      return false;

    api
      .request('client/collabo/member', 'POST', {
        type: type,
        user_id: id,
        user_acct: kit.elemId('addcollabo_acct').value,
        live_id: config.live.id
      })
      .then(json => {
        if (type === 'add') kit.elemId('addcollabo_acct').value = '';
        toast.new('設定しました。', '.bg-success');
        admin.openCollaboModal();
      });
  }

  static getCollaboSlot() {
    api
      .request('client/collabo/slot', 'POST', {
        live_id: config.live.id
      })
      .then(json => {
        alert(
          '取得しました！今からページを再読み込みします。もう一度「配信に参加」をクリックしてください。'
        );
        location.reload();
      });
  }
}

module.exports = admin;
