// 練習サイト共通の道具（通信は一切しない。状態はこの端末のブラウザの中だけに保存）
window.P = (() => {
  const K = (k) => 'practice:' + k;
  const get = (k, d) => { try { const v = localStorage.getItem(K(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch (e) {} };
  const del = (k) => { try { localStorage.removeItem(K(k)); } catch (e) {} };
  const sget = (k) => { try { return sessionStorage.getItem(K(k)); } catch (e) { return null; } };
  const sset = (k, v) => { try { sessionStorage.setItem(K(k), String(v)); } catch (e) {} };
  const sdel = (k) => { try { sessionStorage.removeItem(K(k)); } catch (e) {} };

  const DEFAULT = { delaySec: 20, sorryRate: 30, busyRate: 20, needLogin: true, sold29: false, sold28: false, hideSold: false, startAt: 0 };
  const cfg = () => Object.assign({}, DEFAULT, get('cfg', {}));
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
    const url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'order.html?gLcode=99999';
    document.cookie = 'ScheduleUrl=' + encodeURIComponent(url) + ';path=/;max-age=600';
    mark('アクセス集中の画面');
    location.href = 'sorry.html';
  };

  // 申し込みへ進む（公演ページと、カートからの両方で使う）
  const submit = () => {
    const c = cfg();
    mark('「申し込みへ進む」');
    if (chance(c.sorryRate)) return toSorry();
    location.href = c.needLogin && !sget('loggedIn') ? 'login.html' : 'payment.html';
  };

  const reset = () => { ['cart', 'marks', 'flowStart', 'payment', 'fromSorry'].forEach(del); sdel('loggedIn'); };

  const openModal = (id) => document.getElementById(id)?.setAttribute('aria-hidden', 'false');
  const closeModal = (id) => document.getElementById(id)?.setAttribute('aria-hidden', 'true');

  // 個人情報を残さないため、ページを離れるとき・「戻る」で表示し直したときに入力欄を空にする
  const wipe = () => document.querySelectorAll('input[type=text], input[type=email], input[type=password], input[inputmode=numeric]').forEach((i) => { i.value = ''; });
  window.addEventListener('pagehide', wipe);
  window.addEventListener('pageshow', (e) => { if (e.persisted) wipe(); });

  return { get, set, del, sget, sset, sdel, cfg, chance, sleep, rand, mark, flowStart, toSorry, submit, reset, openModal, closeModal };
})();
