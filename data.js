window.DATA = {
  site: "https://ggsel.net/sellers",
  botApi: "",
  currencies: [
    { id: "RUB", label: "RUB", name: "Рубль", mark: "₽" },
    { id: "UAH", label: "UAH", name: "Гривна", mark: "₴" },
    { id: "KZT", label: "KZT", name: "Тенге", mark: "₸" },
    { id: "BYN", label: "BYN", name: "Бел. рубль", mark: "Br" },
    { id: "USD", label: "USD", name: "Доллар", mark: "$" },
    { id: "EUR", label: "EUR", name: "Евро", mark: "€" },
    { id: "STARS", label: "STARS", name: "Telegram Stars", mark: "⭐" },
    { id: "USDT", label: "USDT", name: "Tether", mark: "₮" },
    { id: "GRAM", label: "GRAM", name: "Gram", mark: "G" }
  ],
  games: [
    { id: "pubg", name: "PUBG Mobile", coin: "UC", color: "#f0b429", logo: "games/pubg.jpg" },
    { id: "fortnite", name: "Fortnite", coin: "V-Bucks", color: "#5ac8fa", logo: "games/fortnite.jpg" },
    { id: "brawl", name: "Brawl Stars", coin: "Гемы", color: "#ffcc33", logo: "games/brawl.jpg" },
    { id: "mlbb", name: "Mobile Legends", coin: "Алмазы", color: "#c9a227", logo: "games/mlbb.jpg" },
    { id: "cs2", name: "CS2", coin: "Steam", color: "#de9b35", logo: "games/cs2.jpg" },
    { id: "dota", name: "Dota 2", coin: "Steam", color: "#c23c2a", logo: "games/dota.jpg" },
    { id: "roblox", name: "Roblox", coin: "Robux", color: "#00a2ff", logo: "games/roblox.jpg" },
    { id: "standoff", name: "Standoff 2", coin: "Gold", color: "#8fd14f", logo: "games/standoff.jpg" }
  ],
  catalogs: [
    { id: "topup", name: "Пополнение", hint: "Баланс сервиса", cats: ["topup"] },
    { id: "onaccount", name: "На ваш аккаунт", hint: "Зачисление на логин", cats: ["onaccount"] },
    { id: "accounts", name: "Аккаунты", hint: "Готовый аккаунт", cats: ["accounts"] },
    { id: "keys", name: "Ключи", hint: "Код активации", cats: ["keys"] },
    { id: "gift", name: "Гифты", hint: "Подарок в магазине", cats: ["gift"] },
    { id: "items", name: "Предметы", hint: "Скины и вещи", cats: ["items"] },
    { id: "subs", name: "Подписки", hint: "Доступ на срок", cats: ["subs"] },
    { id: "buysub", name: "Покупка подписки", hint: "Токен или ключ", cats: ["buysub"] },
    { id: "giftcard", name: "Подарочные карты", hint: "Гифт-карта", cats: ["giftcard"] },
    { id: "paycard", name: "Карты оплаты", hint: "Код пополнения", cats: ["paycard"] },
    { id: "service", name: "Услуги", hint: "Буст и выполнение", cats: ["service"] },
    { id: "telegram", name: "Telegram", hint: "NFT и Stars", cats: ["nft", "stars"] },
    { id: "exchange", name: "Обмен", hint: "Аккаунт на аккаунт", cats: ["exchange"] }
  ],
  labels: {
    accounts: "Аккаунт", keys: "Ключ", gift: "Гифт", topup: "Пополнение", items: "Предмет",
    service: "Услуга", giftcard: "Подарочная карта", paycard: "Карта оплаты", subs: "Подписка",
    buysub: "Покупка подписки", onaccount: "Покупка на ваш аккаунт", nft: "NFT Telegram",
    stars: "Stars", exchange: "Обмен", other: "Другое"
  },
  services: [
    { id: "accounts", label: "Аккаунт", hint: "Готовый аккаунт" },
    { id: "keys", label: "Ключ", hint: "Код активации" },
    { id: "gift", label: "Гифт", hint: "Подарок в магазине" },
    { id: "topup", label: "Пополнение", hint: "Баланс сервиса" },
    { id: "items", label: "Предмет", hint: "Скин, вещь, пасса" },
    { id: "onaccount", label: "На ваш аккаунт", hint: "Зачисление на логин" },
    { id: "subs", label: "Подписка", hint: "Доступ на срок" },
    { id: "buysub", label: "Покупка подписки", hint: "Токен или ключ" },
    { id: "giftcard", label: "Подарочная карта", hint: "Гифт-карта" },
    { id: "paycard", label: "Карта оплаты", hint: "Код пополнения" },
    { id: "service", label: "Услуга", hint: "Буст и выполнение" },
    { id: "nft", label: "NFT Telegram", hint: "Официальная передача" },
    { id: "stars", label: "Stars", hint: "Заявка в кассе Telegram" },
    { id: "exchange", label: "Обмен", hint: "Аккаунт на аккаунт" },
    { id: "other", label: "Другое", hint: "Всё остальное" }
  ],
  gameCats: ["accounts","topup","items","keys","gift","onaccount","service","exchange","giftcard","paycard","subs","buysub"],
  showcases: {
    roblox: { collections: [
      { id: "giftcards", title: "Подарочные карты", badge: "топ продаж", image: "showcases/giftcards.jpg", category: "giftcard" },
      { id: "gamepass", title: "Game Pass", badge: "выгодно", image: "showcases/gamepass.jpg", category: "onaccount" },
      { id: "login", title: "Robux со входом", badge: "Быстрое пополнение", image: "showcases/login.jpg", category: "onaccount" },
      { id: "plus", title: "Подписка Robux Plus", badge: "Подписка", image: "showcases/plus.jpg", category: "subs" }
    ]},
    pubg: { collections: [
      { id: "ucid", title: "UC Пополнение по ID", badge: "Быстрое пополнение", image: "showcases/uc.jpg", category: "topup" },
      { id: "uccode", title: "UC пополнение кодом", badge: "без входа", image: "showcases/pubg-code.jpg", category: "paycard" },
      { id: "passes", title: "Пропуск / Prime", badge: "Подписка", image: "showcases/pubg-pass.jpg", category: "subs" },
      { id: "metro", title: "Metro Royale", image: "showcases/pubg-metro.jpg", category: "items" },
      { id: "accounts", title: "Аккаунты", badge: "топ продаж", image: "showcases/pubg-accounts.jpg", category: "accounts" }
    ]},
    fortnite: { collections: [
      { id: "onacc", title: "Покупка на ваш аккаунт", badge: "Быстрое пополнение", image: "showcases/fn-account.jpg", category: "onaccount" },
      { id: "gifts", title: "Подарки", badge: "гифт", image: "showcases/fn-gifts.jpg", category: "gift" },
      { id: "cards", title: "Подарочные карты", badge: "топ продаж", image: "showcases/fn-cards.jpg", category: "giftcard" },
      { id: "crew", title: "Отряды The Crew", badge: "Подписка", image: "showcases/fn-crew.jpg", category: "subs" },
      { id: "pass", title: "Боевой пропуск", image: "showcases/fn-pass.jpg", category: "buysub" },
      { id: "drops", title: "Twitch Drops", image: "showcases/fn-drops.jpg", category: "items" },
      { id: "boost", title: "Прокачка", image: "showcases/fn-boost.jpg", category: "service" }
    ]},
    brawl: { hero: "showcases/bs-hero.jpg", heroTag: "Brawl Pass + Гемы", heroTitle: "Гарантия доната", collections: [
      { id: "pass", title: "Brawl Pass", badge: "Подписка", image: "showcases/bs-pass.jpg", category: "subs" },
      { id: "gems", title: "Гемы", badge: "Быстрое пополнение", image: "showcases/bs-gems.jpg", category: "topup" },
      { id: "sale", title: "Акции", badge: "выгодно", image: "showcases/bs-sale.jpg", category: "gift" },
      { id: "accounts", title: "Аккаунты", badge: "топ продаж", image: "showcases/bs-accounts.jpg", category: "accounts" },
      { id: "pro", title: "Pro Pass", badge: "Подписка", image: "showcases/bs-pro.jpg", category: "buysub" },
      { id: "store", title: "Supercell Store", image: "showcases/bs-store.jpg", category: "giftcard" },
      { id: "combo", title: "Комбо наборы", image: "showcases/bs-combo.jpg", category: "onaccount" },
      { id: "fighters", title: "Бойцы", image: "showcases/bs-fighters.jpg", category: "items" },
      { id: "boost", title: "Буст", image: "showcases/bs-boost.jpg", category: "service" }
    ]},
    standoff: { hero: "showcases/so-hero.jpg", collections: [
      { id: "market", title: "Золото через рынок", badge: "топ продаж", image: "showcases/so-market.jpg", category: "items" },
      { id: "goldid", title: "Золото по ID", badge: "Быстрое пополнение", image: "showcases/so-id.jpg", category: "topup" },
      { id: "drops", title: "Twitch Drops", image: "showcases/so-drops.jpg", category: "gift" },
      { id: "pass", title: "Gold Pass", badge: "Подписка", image: "showcases/so-pass.jpg", category: "subs" },
      { id: "packs", title: "Наборы", image: "showcases/so-packs.jpg", category: "onaccount" },
      { id: "items", title: "Предметы", image: "showcases/so-items.jpg", category: "items" },
      { id: "boost", title: "Прокачка", image: "showcases/so-boost.jpg", category: "service" }
    ]},
    mlbb: { collections: [
      { id: "dias", title: "Алмазы MLBB", badge: "Быстрое пополнение", image: "showcases/diamonds.jpg", category: "topup",
        regions: [
          { id: "ru", label: "Россия", flag: "🇷🇺" }, { id: "global", label: "Глобал", flag: "🌐" },
          { id: "ph", label: "Филиппины", flag: "🇵🇭" }, { id: "id", label: "Индонезия", flag: "🇮🇩" },
          { id: "sg", label: "Сингапур", flag: "🇸🇬" }, { id: "my", label: "Малайзия", flag: "🇲🇾" },
          { id: "tr", label: "Турция", flag: "🇹🇷" }, { id: "br", label: "Бразилия", flag: "🇧🇷" }
        ]},
      { id: "accounts", title: "Аккаунты", badge: "аккаунты", image: "showcases/accounts.jpg", category: "accounts" },
      { id: "weekly", title: "Weekly Pass", badge: "Подписка", image: "showcases/pass.jpg", category: "subs" },
      { id: "login", title: "Алмазы на аккаунт", image: "showcases/login.jpg", category: "onaccount" }
    ]},
    cs2: { collections: [
      { id: "accounts", title: "Аккаунты", badge: "топ продаж", image: "showcases/operators.jpg", category: "accounts" },
      { id: "skins", title: "Скины", image: "showcases/skins-gun.jpg", category: "items" },
      { id: "prime", title: "Prime", badge: "Подписка", image: "showcases/crew.jpg", category: "subs" },
      { id: "steam", title: "Steam-кошелёк", badge: "пополнение", image: "showcases/rune.jpg", category: "topup" }
    ]},
    dota: { collections: [
      { id: "accounts", title: "Аккаунты", badge: "топ продаж", image: "showcases/accounts.jpg", category: "accounts" },
      { id: "plus", title: "Dota Plus", badge: "Подписка", image: "showcases/crew.jpg", category: "subs" },
      { id: "items", title: "Предметы", image: "showcases/rune.jpg", category: "items" },
      { id: "steam", title: "Steam-кошелёк", badge: "пополнение", image: "showcases/code.jpg", category: "topup" }
    ]}
  }
};
