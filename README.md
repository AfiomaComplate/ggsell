# Aurora Mini App

Telegram Mini App: аккаунты, подарки, NFT Telegram, Stars.

## Сайт

**https://afiomacomplate.github.io/ggsell/**

## Mini App в BotFather

1. [@BotFather](https://t.me/BotFather) → `/newbot` → сохрани токен
2. Main App URL:

```
https://afiomacomplate.github.io/ggsell/
```

3. Launch Mode: **Fullsize** → Save

## Поддержка в боте

Сообщения из вкладки «Помощь» приходят оператору в Telegram.
Ответ **реплаем** уходит пользователю от имени бота и в чат Mini App.

Нужен хостинг Node 18+ (Render, Railway, VPS). GitHub Pages бота не запускает.

1. Напиши боту `/id` — это твой `ADMIN_ID`
2. Запусти `bot/bot.js`:

```
BOT_TOKEN=токен_бота
ADMIN_ID=твой_числовой_id
WEBAPP_URL=https://afiomacomplate.github.io/ggsell/
PUBLIC_URL=https://адрес-твоего-сервера
```

```
node bot.js
```

3. URL сервера (`PUBLIC_URL`) пропиши в Mini App: открой
   `https://afiomacomplate.github.io/ggsell/#/ops`
   и вставь адрес сервера. Или поле `botApi` в `data.js`.

## Важно

Пополнение баланса — демо. Лоты хранятся в браузере пользователя.
