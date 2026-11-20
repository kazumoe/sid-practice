// 練習サイト共通の道具（通信は一切しない。状態はこの端末のブラウザの中だけに保存）
window.P = (() => {
  const K = (k) => 'practice:' + k;
  const get = (k, d) => { try { const v = localStorage.getItem(K(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch (e) {} };
  const del = (k) => { try { localStorage.removeItem(K(k)); } catch (e) {} };
  const sget = (k) => { try { return sessionStorage.getItem(K(k)); } catch (e) { return null; } };
  const sset = (k, v) => { try { sessionStorage.setItem(K(k), String(v)); } catch (e) {} };
  const sdel = (k) => { try { sessionStorage.removeItem(K(k)); } catch (e) {} };

  const DEFAULT = { delaySec: 20, sorryRate: 30, busyRate: 20, needLogin: true, sold29: false, sold28: false, hideSold: false, blankStock: true, stockMode: 'C', slowRes: false, twoShows: false, soldShow1: true, seats4: true, renameSeats: false, soldSeats: [],
    question: false, longConfirm: true, itemAuth: false, noETicket: false,
    sorryWait: true, sorryKeepCart: false, startAt: 0,
    // 11/15版：開き直してもまたアクセス集中になる確率／サイトの「前のページに戻る」が古い画面に戻る／追加情報入力（同意のチェック）
    reopenSorryRate: 0, sorryNoCookie: false, addInfo: false,
    // 11/21版：公演の形。'basic'＝今までの練習公演（11/28・11/29）、'milk'＝M!LK 73512 と同じ（11/21 18:00・11/22 12:30／17:30、ファミリー席・着席指定席・立見、最大1枚）
    layout: 'basic', milkSold: '1' };
  const cfg = () => Object.assign({}, DEFAULT, get('cfg', {}));
  // 練習公演の Lコード（案内版の希望の設定と対応。99999＝今までの練習公演、99998＝M!LK型）
  const lcode = () => (cfg().layout === 'milk' ? '99998' : '99999');
  const orderUrl = () => 'order.html?gLcode=' + lcode();
  const chance = (pct) => Math.random() * 100 < Number(pct || 0);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  // 時間の記録（完了画面で一覧にする）
  const mark = (name) => {
    const m = get('marks', []);
    m.push({ name, t: Date.now() });
    set('marks', m);
  };
  const flowStart = () => {
    if (!get('flowStart', 0)) { set('flowStart', Date.now()); mark('発売中の公演ページを開いた'); }
  };

  // 本物と同じく、アクセス集中の画面は「直前の公演ページのURL」をクッキーに覚えて戻れるようにする
  const toSorry = () => {
    const url = location.origin + location.pathname.replace(/[^/]*$/, '') + orderUrl();
    // 設定「古い画面に戻る」がオンのときはクッキーを残さない（本物でもクッキーがないことがあり、そのときはブラウザの「戻る」と同じ動きになる）
    if (cfg().sorryNoCookie) document.cookie = 'ScheduleUrl=;path=/;max-age=0';
    else document.cookie = 'ScheduleUrl=' + encodeURIComponent(url) + ';path=/;max-age=600';
    mark('アクセス集中の画面');
    location.href = 'sorry.html';
  };

  // 申し込みへ進む（公演ページと、カートからの両方で使う）
  const submit = () => {
    const c = cfg();
    mark('「申し込みへ進む」');
    // 本物（11/7 MONKEY MAJIK）は「申し込みへ進む」から4〜10秒ほど待たされてからアクセス集中の画面になった
    if (chance(c.sorryRate)) { if (c.sorryWait) setTimeout(toSorry, rand(4000, 10000)); else toSorry(); return; }
    const cart = get('cart', null);
    if (cart && cart.sold) { mark(`在庫なし（${cart.disp}）→ ご案内ページ`); location.href = 'notice.html'; return; }
    if (c.needLogin && !sget('loggedIn')) { location.href = 'login.html'; return; }
    afterLogin();
  };
  // ログインのあと：アイテム認証（設定がオンなら）→ 引取／支払
  const afterLogin = () => {
    const c = cfg();
    location.href = c.itemAuth ? 'itemauth.html' : 'payment.html';
  };

  const reset = () => { ['cart', 'marks', 'flowStart', 'payment', 'fromSorry', 'take', 'stale'].forEach(del); sdel('loggedIn'); };

  const openModal = (id) => document.getElementById(id)?.setAttribute('aria-hidden', 'false');
  const closeModal = (id) => document.getElementById(id)?.setAttribute('aria-hidden', 'true');

  // 個人情報を残さないため、ページを離れるとき・「戻る」で表示し直したときに入力欄を空にする
  const wipe = () => document.querySelectorAll('input[type=text], input[type=email], input[type=password], input[inputmode=numeric]').forEach((i) => { i.value = ''; });
  window.addEventListener('pagehide', wipe);
  window.addEventListener('pageshow', (e) => { if (e.persisted) wipe(); });

  return { get, set, del, sget, sset, sdel, cfg, lcode, orderUrl, chance, sleep, rand, mark, flowStart, toSorry, submit, afterLogin, reset, openModal, closeModal };
})();
