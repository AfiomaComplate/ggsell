/**
 * Aurora — бот меню + поддержка Mini App.
 *
 * Сообщения из вкладки «Помощь» приходят тебе в этот бот.
 * Ответь РЕПЛАЕМ — текст уйдёт человеку в Mini App и в Telegram от имени бота.
 *
 * Переменные окружения:
 *   BOT_TOKEN    токен от @BotFather
 *   ADMIN_ID     твой числовой Telegram ID (бот пришлёт его на /id)
 *   WEBAPP_URL   https://afiomacomplate.github.io/ggsell/
 *   PUBLIC_URL   публичный https этого сервера (для webhook и Mini App)
 *   PORT         порт HTTP, по умолчанию 3000
 *
 * Запуск: node bot.js
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_ID = String(process.env.ADMIN_ID || "").trim();
const WEBAPP = (process.env.WEBAPP_URL || "https://afiomacomplate.github.io/ggsell/").replace(/\/$/, "");
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");
const SITE = "https://ggsel.net/sellers";
const PORT = Number(process.env.PORT || 3000);
const FILE = path.join(__dirname, "data", "support.json");
const MARKET = path.join(__dirname, "data", "market.json");

if (!TOKEN) {
  console.error("Нужен BOT_TOKEN");
  process.exit(1);
}

function empty() {
  return { tickets: [], map: {}, offset: 0 };
}

function load() {
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch {
    return empty();
  }
}

let store = load();

function save() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(store));
  } catch (e) {
    console.error("save", e.message);
  }
}

function loadMarket() {
  try {
    const raw = JSON.parse(fs.readFileSync(MARKET, "utf8"));
    return { listings: Array.isArray(raw.listings) ? raw.listings : [] };
  } catch {
    return { listings: [] };
  }
}

let market = loadMarket();

function saveMarket() {
  try {
    fs.mkdirSync(path.dirname(MARKET), { recursive: true });
    fs.writeFileSync(MARKET, JSON.stringify(market));
  } catch (e) {
    console.error("saveMarket", e.message);
  }
}

function cleanPhotos(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((p) => typeof p === "string" && p.startsWith("data:image/") && p.length < 450000)
    .slice(0, 4);
}

function cleanListing(raw, user) {
  if (!raw || typeof raw !== "object") return null;
  const photos = cleanPhotos(raw.photos && raw.photos.length ? raw.photos : raw.photo ? [raw.photo] : []);
  if (!photos.length) return null;
  const title = String(raw.title || "").trim().slice(0, 120);
  if (!title) return null;
  const price = Number(raw.price);
  const category = String(raw.category || "accounts").slice(0, 32);
  return {
    id: String(raw.id || uid()).slice(0, 40),
    sellerId: "tg-" + user.id,
    sellerName: String(user.first_name || user.username || "").slice(0, 64),
    category,
    title,
    description: String(raw.description || "").trim().slice(0, 2000),
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    currency: String(raw.currency || "USDT").slice(0, 8),
    stock: Math.max(0, Number(raw.stock) || 1),
    accent: String(raw.accent || "#31b545").slice(0, 16),
    photo: photos[0],
    photos,
    gameId: raw.gameId ? String(raw.gameId).slice(0, 32) : undefined,
    wantGameId: raw.wantGameId ? String(raw.wantGameId).slice(0, 32) : undefined,
    at: Number(raw.at) || Date.now(),
  };
}

function upsertListing(item) {
  const i = market.listings.findIndex((x) => x.id === item.id);
  if (i >= 0) {
    if (market.listings[i].sellerId !== item.sellerId) return market.listings[i];
    market.listings[i] = item;
  } else {
    market.listings.unshift(item);
  }
  if (market.listings.length > 250) market.listings = market.listings.slice(0, 250);
  saveMarket();
  return item;
}

function uid() {
  return "m" + Math.random().toString(36).slice(2, 10);
}

async function tg(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return r.json();
}

async function tgForm(method, fields, fileField, buf, filename) {
  const boundary = "----aurora" + Date.now();
  const chunks = [];
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  chunks.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`
  ));
  chunks.push(buf);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: Buffer.concat(chunks),
  });
  return r.json();
}

function appUrl(hash) {
  return hash ? `${WEBAPP}/#/${hash}` : `${WEBAPP}/`;
}

function menuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "↗ Открыть", web_app: { url: appUrl("profile") }, style: "success" }],
      [
        { text: "👤 Профиль", web_app: { url: appUrl("profile") } },
        { text: "💼 Кошелек", web_app: { url: appUrl("wallet") } },
      ],
      [
        { text: "💬 Чаты", web_app: { url: appUrl("chats") } },
        { text: "➕ Создать", web_app: { url: appUrl("sell") } },
      ],
      [
        { text: "🎧 Поддержка", web_app: { url: appUrl("support") } },
        { text: "🔗 Сайт", url: SITE },
      ],
    ],
  };
}

function supportKeyboard() {
  return {
    inline_keyboard: [[{ text: "Открыть поддержку", web_app: { url: appUrl("support") } }]],
  };
}

const CAPTION =
  "<b>🟢 Сервис для создания и проведения сделок между пользователями</b>\n\n" +
  "Покупайте, продавайте и обменивайте товары или услуги безопасно и удобно";

async function sendMenu(chatId) {
  const markup = menuKeyboard();
  const fields = {
    chat_id: String(chatId),
    caption: CAPTION,
    parse_mode: "HTML",
    reply_markup: JSON.stringify(markup),
  };
  try {
    const img = await fetch(`${WEBAPP}/start.jpg?t=${Date.now()}`, { cache: "no-store" });
    if (img.ok) {
      const buf = Buffer.from(await img.arrayBuffer());
      if (buf.length > 100 && buf[0] === 0xff && buf[1] === 0xd8) {
        const r = await tgForm("sendPhoto", fields, "photo", buf, "start.jpg");
        if (r && r.ok) return;
        console.error("sendPhoto file", r);
      }
    }
  } catch (e) {
    console.error("start.jpg", e.message);
  }
  const r = await tg("sendPhoto", {
    chat_id: chatId,
    photo: `${WEBAPP}/start.jpg?v=${Date.now()}`,
    caption: CAPTION,
    parse_mode: "HTML",
    reply_markup: markup,
  });
  if (!r || !r.ok) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: CAPTION,
      parse_mode: "HTML",
      reply_markup: markup,
    });
  }
}

function upsert(tgId, username, firstName) {
  const userId = "tg-" + tgId;
  let t = store.tickets.find((x) => x.userId === userId);
  if (!t) {
    t = { userId, tgId: Number(tgId), username: username || "", firstName: firstName || "", messages: [], updatedAt: Date.now() };
    store.tickets.push(t);
  }
  t.username = username || t.username;
  t.firstName = firstName || t.firstName;
  t.tgId = Number(tgId) || t.tgId;
  return t;
}

async function notifyAdmin(ticket, text) {
  if (!ADMIN_ID) return;
  const name = ticket.firstName || ticket.username || "Гость";
  const handle = ticket.username ? "@" + ticket.username : "id " + ticket.tgId;
  const r = await tg("sendMessage", {
    chat_id: ADMIN_ID,
    text: `💬 ${name} · ${handle}\nТикет ${ticket.userId}\n\n${text}\n\n↩ Ответьте реплаем на это сообщение.`,
    reply_markup: { force_reply: true, selective: true },
  });
  if (r && r.ok && r.result && r.result.message_id) {
    store.map[String(r.result.message_id)] = ticket.userId;
    save();
  }
}

async function notifyUser(ticket, text) {
  if (!ticket.tgId) return;
  await tg("sendMessage", {
    chat_id: ticket.tgId,
    text: `Ответ поддержки\n\n${text}`,
    reply_markup: supportKeyboard(),
  });
}

function ticketFromReply(reply) {
  if (!reply || !reply.message_id) return null;
  const mapped = store.map[String(reply.message_id)];
  if (mapped) return store.tickets.find((t) => t.userId === mapped) || null;
  const blob = `${reply.text || ""}\n${reply.caption || ""}`;
  const m = blob.match(/Тикет\s+(\S+)/);
  if (m) return store.tickets.find((t) => t.userId === m[1]) || null;
  return null;
}

function addUserMsg(ticket, text) {
  const msg = { id: uid(), from: "user", text, at: Date.now() };
  ticket.messages.push(msg);
  ticket.updatedAt = Date.now();
  save();
  return msg;
}

function addSupportMsg(ticket, text) {
  const msg = { id: uid(), from: "support", text, at: Date.now() };
  ticket.messages.push(msg);
  ticket.updatedAt = Date.now();
  save();
  return msg;
}

async function handleMessage(msg) {
  const fromId = msg.from && msg.from.id;
  if (!fromId) return;
  const text = (msg.text || msg.caption || (msg.photo ? "[фото]" : "")).trim();
  if (!text) return;
  const isAdmin = ADMIN_ID && String(fromId) === String(ADMIN_ID);

  if (/^\/id\b/.test(text)) {
    await tg("sendMessage", {
      chat_id: fromId,
      text: `Ваш Telegram ID: ${fromId}\n\nПропишите его в ADMIN_ID, если это вы оператор.`,
    });
    return;
  }

  if (/^\/(start|menu)\b/.test(text)) {
    await sendMenu(fromId);
    if (!ADMIN_ID) {
      await tg("sendMessage", { chat_id: fromId, text: `ADMIN_ID ещё не задан. Ваш ID: ${fromId}` });
    }
    return;
  }

  if (/^\/support\b/.test(text)) {
    await tg("sendMessage", {
      chat_id: fromId,
      text: "Напишите сообщение — оно уйдёт в поддержку. Или откройте чат в Mini App.",
      reply_markup: supportKeyboard(),
    });
    return;
  }

  if (isAdmin) {
    const ticket = ticketFromReply(msg.reply_to_message);
    if (!ticket) {
      await tg("sendMessage", {
        chat_id: fromId,
        text: "Ответьте реплаем на сообщение тикета, чтобы ответ ушёл пользователю.",
      });
      return;
    }
    addSupportMsg(ticket, text);
    await notifyUser(ticket, text);
    await tg("sendMessage", { chat_id: fromId, text: "✓ Ответ отправлен" });
    return;
  }

  const ticket = upsert(fromId, (msg.from && msg.from.username) || "", (msg.from && msg.from.first_name) || "");
  addUserMsg(ticket, text);
  await notifyAdmin(ticket, text);
  await tg("sendMessage", {
    chat_id: fromId,
    text: "Приняли. Ответим здесь и в Mini App.",
    reply_markup: supportKeyboard(),
  });
}

function timingEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyInitData(initData) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(TOKEN).digest();
  const check = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (!timingEqual(check, hash)) return null;
  const authDate = Number(params.get("auth_date") || 0);
  if (authDate && Date.now() / 1000 - authDate > 86400 * 2) return null;
  try {
    return JSON.parse(params.get("user") || "null");
  } catch {
    return null;
  }
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Init-Data");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, code, obj) {
  cors(res);
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

async function onRequest(req, res) {
  cors(res);
  const url = new URL(req.url, "http://localhost");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    send(res, 200, { ok: true, bot: "aurora", admin: Boolean(ADMIN_ID), listings: market.listings.length });
    return;
  }
  if (req.method === "POST" && (url.pathname === "/telegram" || url.pathname === "/webhook")) {
    try {
      const update = JSON.parse(await readBody(req));
      if (update.message) await handleMessage(update.message);
    } catch (e) {
      console.error("webhook", e);
    }
    send(res, 200, { ok: true });
    return;
  }
  if (url.pathname === "/api/thread") {
    const user = verifyInitData(req.headers["x-telegram-init-data"] || "");
    if (!user || !user.id) {
      send(res, 401, { ok: false, error: "Откройте Mini App из Telegram" });
      return;
    }
    const ticket = upsert(user.id, user.username || "", user.first_name || "");
    if (req.method === "GET") {
      send(res, 200, { ok: true, messages: ticket.messages });
      return;
    }
    if (req.method === "POST") {
      let body = {};
      try {
        body = JSON.parse(await readBody(req) || "{}");
      } catch {
        body = {};
      }
      const text = String(body.text || "").trim().slice(0, 2000);
      if (!text) {
        send(res, 400, { ok: false, error: "Пустое сообщение" });
        return;
      }
      addUserMsg(ticket, text);
      await notifyAdmin(ticket, text);
      send(res, 200, { ok: true, messages: ticket.messages });
      return;
    }
  }
  if (url.pathname === "/api/listings") {
    if (req.method === "GET") {
      send(res, 200, { ok: true, listings: market.listings });
      return;
    }
    if (req.method === "POST") {
      const user = verifyInitData(req.headers["x-telegram-init-data"] || "");
      if (!user || !user.id) {
        send(res, 401, { ok: false, error: "Откройте Mini App из Telegram" });
        return;
      }
      let body = {};
      try {
        body = JSON.parse(await readBody(req) || "{}");
      } catch {
        body = {};
      }
      const item = cleanListing(body.listing || body, user);
      if (!item) {
        send(res, 400, { ok: false, error: "Нужны фото и название" });
        return;
      }
      upsertListing(item);
      send(res, 200, { ok: true, listing: item, listings: market.listings });
      return;
    }
  }
  if (url.pathname === "/api/buy" && req.method === "POST") {
    const user = verifyInitData(req.headers["x-telegram-init-data"] || "");
    if (!user || !user.id) {
      send(res, 401, { ok: false, error: "Откройте Mini App из Telegram" });
      return;
    }
    let body = {};
    try {
      body = JSON.parse(await readBody(req) || "{}");
    } catch {
      body = {};
    }
    const id = String(body.id || "");
    const listing = market.listings.find((x) => x.id === id);
    if (!listing) {
      send(res, 404, { ok: false, error: "Лот не найден" });
      return;
    }
    if (listing.sellerId === "tg-" + user.id) {
      send(res, 400, { ok: false, error: "Это ваш лот" });
      return;
    }
    if (listing.stock < 1) {
      send(res, 400, { ok: false, error: "Нет в наличии" });
      return;
    }
    listing.stock -= 1;
    saveMarket();
    send(res, 200, { ok: true, listing, listings: market.listings });
    return;
  }
  send(res, 404, { ok: false });
}

async function poll() {
  try {
    const r = await tg("getUpdates", { offset: store.offset, timeout: 25, allowed_updates: ["message"] });
    if (r && r.ok) {
      for (const u of r.result) {
        store.offset = u.update_id + 1;
        if (u.message) await handleMessage(u.message);
      }
      save();
    } else if (r && r.description) {
      console.error("getUpdates", r.description);
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch (e) {
    console.error("poll", e.message);
    await new Promise((r) => setTimeout(r, 2000));
  }
  poll();
}

async function boot() {
  const me = await tg("getMe");
  if (!me.ok) {
    console.error("Токен не принят:", me.description);
    process.exit(1);
  }
  await tg("setMyCommands", {
    commands: [
      { command: "start", description: "Открыть меню" },
      { command: "menu", description: "Сделки и кошелёк" },
      { command: "support", description: "Написать в поддержку" },
      { command: "id", description: "Показать мой Telegram ID" },
    ],
  });
  await tg("setChatMenuButton", {
    menu_button: { type: "web_app", text: "Открыть", web_app: { url: appUrl("profile") } },
  });

  http.createServer((req, res) => {
    onRequest(req, res).catch((e) => {
      console.error(e);
      send(res, 500, { ok: false });
    });
  }).listen(PORT, "0.0.0.0", () => {
    console.log("HTTP :" + PORT, "bot @" + me.result.username);
  });

  // Старый Render-бот выключен: не поллим и не ставим webhook,
  // чтобы Railway ggselbot мог забрать тот же BOT_TOKEN.
  await tg("deleteWebhook", { drop_pending_updates: false });
  console.log("Render bot idle (polling disabled). HTTP /health only.");
}

boot().catch((e) => {
  console.error(e);
  process.exit(1);
});
