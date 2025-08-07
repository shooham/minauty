# minauty – Codebase Context

## अवलोकन
minauty एक निजी, पीयर-टू-पीयर (P2P) चैट एप है जो 3-शब्दों वाले यूज़र-ID से कनेक्ट होता है। रीयल-टाइम मैसेजिंग WebRTC डेटा चैनल पर होती है और ऑफ़लाइन संदेशों/उपस्थिति (presence) के लिए एक हल्का बैकएंड (Cloudflare D1 + Hono) उपलब्ध है। क्लाइंट React + Vite पर आधारित है और UI TailwindCSS से संचालित है।

## टेक स्टैक
- React 19, React Router
- Vite 6, @vitejs/plugin-react, Cloudflare Vite plugin
- TypeScript 5
- Hono (Edge/Workers API फ्रेमवर्क)
- Cloudflare D1 (SQLite आधारित) स्टोरेज
- Zod स्कीमा वैलिडेशन
- TailwindCSS, PostCSS, Autoprefixer
- आइकन: `lucide-react`

## रेपो संरचना
```
/                         – प्रोजेक्ट रूट
├─ package.json           – स्क्रिप्ट्स/डिपेंडेंसीज़
├─ vite.config.ts         – Vite कॉन्फ़िग (अलियस @ → ./src)
├─ tsconfig*.json         – TypeScript प्रोजेक्ट रेफरेंसेज़
├─ wrangler.jsonc         – Cloudflare Workers कॉन्फ़िग
├─ src/
│  ├─ react-app/          – फ्रंटएंड (React)
│  │  ├─ components/      – UI कंपोनेंट्स
│  │  ├─ hooks/           – कस्टम hooks (WebRTC, presence, आदि)
│  │  ├─ pages/           – रूट-स्तरीय pages (Dashboard, Chat, Welcome)
│  │  ├─ utils/           – उपयोगिताएँ: userManager, encryption, validation
│  │  ├─ App.tsx, main.tsx, index.css, vite-env.d.ts
│  ├─ shared/             – साझा types/utilities
│  │  ├─ types.ts         – Zod आधारित टाइप्स/स्कीमा
│  │  └─ utils/           – (उपलब्ध: `encryption.ts`)
│  └─ worker/
│     └─ index.ts         – Hono APIs (offline messages, presence, heartbeat, cleanup)
└─ migrations/            – D1 DB माइग्रेशन SQL (1.sql, 2.sql, 3.sql)
```

## कॉन्फ़िग फाइलें और स्क्रिप्ट्स
- `package.json`
  - scripts:
    - `dev`: Vite dev server
    - `build`: `tsc -b && vite build`
    - `check`: `tsc && vite build && wrangler deploy --dry-run`
    - `cf-typegen`: `wrangler types`
    - `lint`: ESLint रन
  - dependencies (मुख्य): `react`, `react-dom`, `react-router`, `hono`, `zod`, `lucide-react`
  - devDependencies (मुख्य): `vite`, `@vitejs/plugin-react`, `@cloudflare/vite-plugin`, `typescript`, `tailwindcss`, `wrangler`
- `vite.config.ts`
  - plugins: `mochaPlugins(...)`, `react()`, `cloudflare()`
  - alias: `@` → `./src`
  - server.allowedHosts: `true`, build.chunkSizeWarningLimit: `5000`
- TypeScript configs
  - `tsconfig.json`: प्रोजेक्ट रेफरेंसेज़ (`app`, `node`, `worker`)
  - `tsconfig.app.json`: React app के लिए strict/paths `@/* → ./src/*`, lib DOM/ES2020
  - `tsconfig.node.json`: Node/Vite कॉन्फ़िग TS
  - `tsconfig.worker.json`: worker के लिए types: `vite/client`, `./worker-configuration.d.ts`
- `tailwind.config.js`, `postcss.config.js`, `eslint.config.js` मौजूद हैं और मानक सेटअप दर्शाते हैं।
- `wrangler.jsonc`: Cloudflare Workers के बूटस्ट्रैप/बाइंडिंग्स (DB) कॉन्फ़िग के लिए।

## फ्रंटएंड (`src/react-app/`)

### प्रमुख Pages
- `pages/Dashboard.tsx`: यूज़र ID कार्ड, ऑफ़लाइन मैसेज काउंट, कनेक्ट पैनल, सेशंस, लॉगआउट, टेस्ट फ्रेंड शॉर्टकट।
- `pages/Chat.tsx`: मुख्य चैट UI। टेक्स्ट/वॉइस मैसेज, टाइपिंग/स्टेटस, ऑफ़लाइन हैंडलिंग, टाइमस्टैम्प/डिलीवरी स्टेटस, peer presence।
- `pages/Welcome.tsx`: नई/पुरानी यूज़र फ्लो—ID निर्माण, लॉगिन, ID सेव-कनफ़र्मेशन, टेस्ट फ्रेंड विकल्प।

### Components
- `components/ConnectPanel.tsx`: 3-शब्द ID इनपुट, वैलिडेशन, रेट-लिमिटेड कनेक्ट प्रयास, लोडिंग/एरर स्टेट।
- `components/VoiceRecorder.tsx`: माइक परमिशन, MediaRecorder से रिकॉर्डिंग, blob + duration भेजना, UI स्टेट्स।
- `components/VoiceMessage.tsx`: वॉइस मैसेज प्लेबैक UI (संक्षेप)
- `components/UserIDCard.tsx`: यूज़र ID दिखाना/कॉपी
- `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx`: थीम कॉन्टेक्स्ट और टॉगल (sun/moon ऐनिमेशन)।
- `components/AnimatedBackground.tsx`: थीम-अनुकूल पार्टिकल/लाइंस ऐनिमेशन कैनवस।

### Hooks
- `hooks/useWebRTC.ts`: WebRTC PeerConnection + DataChannel मैनेजमेंट, कनेक्शन स्टेट, एन्क्रिप्शन/डीक्रिप्शन, रीकनेक्ट, हार्टबीट, मैसेज send/receive।
- `hooks/usePresence.ts`: presence API इंटीग्रेशन, ऑनलाइन/ऑफ़लाइन अपडेट, heartbeat, last-seen फॉर्मैटिंग, कैशिंग।
- `hooks/useOfflineMessages.ts`: ऑफ़लाइन मैसेज fetch/ack स्ट्रीम, लोकल स्टेट मर्ज (संक्षेप)।

### Utils
- `utils/userManager.ts`: यूज़र डेटा निर्माण/सेव/लोड, वैलिडेशन, लॉगिन/सेशन, टेस्ट-फ्रेंड प्रीसेट।
- `utils/encryption.ts`: सरल XOR आधारित एन्क्रिप्शन/डीक्रिप्शन; user IDs से key-derive; base64 एन्कोडिंग; मैसेज ID जेनरेटर।
- `utils/validation.ts`: इनपुट सैनिटाइज़ेशन, 3-शब्द ID/DisplayName/Message वैलिडेशन, बेसिक कंटेंट-फिल्टर, localStorage रेट-लिमिटिंग, URL वैलिडेशन/फ़ॉरमैटिंग।

## Shared (`src/shared/`)
- `types.ts`
  - Zod स्कीमा:
    - `UserIDSchema`: `/^[a-z]+-[a-z]+-[a-z]+$/`
    - `DisplayNameSchema`: min 3, max 20
    - `MessageSchema`: फ़ील्ड्स—`id, from, to, content, timestamp, type('text'|'voice'|'typing'|'status'), delivered, read, audioUrl?, duration?, isOfflineMessage?`
    - `ConnectionRequestSchema`: `fromID, toID, fromDisplayName`
    - `UserStatusSchema`: `userID, displayName, status('online'|'away'|'offline'|'invisible'), lastSeen, socketID?`
  - Derived TS types: `UserID, DisplayName, Message, ConnectionRequest, UserStatus`
  - Interfaces: `UserData`, `ChatSession`, `ConnectionState`
- `utils/encryption.ts` (shared): एन्क्रिप्शन-संबंधित साझा यूटिलिटी (यदि फ्रंट/वर्कर दोनों में reuse)

## Worker/API (`src/worker/index.ts`)
Hono आधारित APIs, CORS सक्षम:
- CORS: origins — `http://localhost:5173`, `https://*.mocha.app`
- Rate limiting हेल्पर: D1 टेबल `rate_limits` पर की-बेस्ड विंडो (डिफ़ॉल्ट 5 प्रयास/घंटा)

### Offline Messages
- `POST /api/message`
  - body: `{ fromID, toID, ciphertext, timestamp, messageID? }`
  - RL: `offline_msg:${fromID}:${toID}` प्रति घंटा 5
  - D1 insert: `offline_messages(message_id, from_user_id, to_user_id, ciphertext, timestamp, expires_at)`
  - TTL: 24 घंटे (ms में `expires_at`)

- `GET /api/messages?userID=...`
  - to_user के लिए non-expired संदेश लौटाता है
  - सफल fetch के बाद उन संदेशों को उसी कॉल में delete कर देता है (delivery semantic)

- `POST /api/ack`
  - `{ userID, msgIDs }` लॉग/एनालिटिक्स हेतु (नो-ऑथ लॉग)

### Presence
- `POST /api/presence/online` → upsert: user ऑनलाइन
- `POST /api/presence/offline` → last_seen अपडेट + offline
- `GET  /api/presence/:userID` → `{ userID, isOnline, lastSeenAt }`
- `POST /api/heartbeat` → last_seen अपडेट + online true

### Cleanup
- `POST /api/cleanup` → expired `offline_messages` और 24h से पुराने `rate_limits` purge

## DB स्कीमा और माइग्रेशन (`migrations/`)
- `1.sql`
  - `offline_messages`: `id PK`, `message_id`, `from_user_id`, `to_user_id`, `ciphertext`, `timestamp`, `created_at`, `updated_at`
  - इंडेक्स: `to_user_id`, `timestamp`
- `2.sql`
  - `user_presence`: `id PK`, `user_id UNIQUE`, `last_seen_at`, `is_online`, timestamps
  - इंडेक्स: `user_id`
- `3.sql`
  - `ALTER TABLE offline_messages ADD COLUMN expires_at INTEGER`
  - `rate_limits`: `id PK`, `key`, `created_at`, `updated_at`
  - इंडेक्स: `key`, `created_at`

## डेटा फ्लो (उच्च-स्तरीय)
- यूज़र A ↔ यूज़र B: WebRTC data channel (एन्क्रिप्टेड payload)
- ऑफ़लाइन स्थिति में:
  1. क्लाइंट `POST /api/message` (ciphertext) पर मैसेज छोड़ता है
  2. रिसीवर अगली बार `GET /api/messages` से fetch करता है → worker DB से delete करता है
  3. वैकल्पिक `POST /api/ack` एनालिटिक्स के लिए
- Presence: क्लाइंट `online/offline/heartbeat` endpoints से स्टेटस अपडेट करता है; `GET /api/presence/:id` से peer स्टेटस पढ़ता है

## सुरक्षा/गोपनीयता नोट्स
- एन्क्रिप्शन: सरल XOR-आधारित (बेसिक ऑबफुकेशन, मजबूत सुरक्षा नहीं)। संवेदनशील उपयोग के लिए मजबूत क्रिप्टो (AES-GCM/Noise/etc.) पर विचार करें।
- रेट-लिमिटिंग: ऑफ़लाइन संदेशों पर 5/घंटा प्रति जोड़ी; लोकलStorage आधारित क्लाइंट-साइड rate limits भी मौजूद।
- ऑफ़लाइन संदेश TTL: 24h। डिलीवरी के बाद delete।
- Presence endpoints पर कोई ऑथ नहीं—दुरुपयोग से बचाव हेतु भविष्य में टोकन/सिग्नेचर जोड़ें।

## UI/UX
- डार्क/लाइट थीम, `ThemeProvider` + `ThemeToggle`
- रिस्पॉन्सिव UI, Tailwind आधारित
- `AnimatedBackground` से subtle इंटरैक्टिव बैकड्रॉप

## डेवलपमेंट और रन
- Dev: `pnpm|npm run dev` → `http://localhost:5173`
- टाइप-चेक/लिंट: `npm run lint`, `tsc`
- Build: `npm run build`
- Cloudflare Workers dry-run: `npm run check`
- Wrangler Types: `npm run cf-typegen`

## ज्ञात सीमाएँ/भविष्य कार्य
- मजबूत E2E क्रिप्टो (कुंजी विनिमय, रैचेटिंग) लागू करें
- Presence/API पर ऑथन्टिकेशन/रेट-लिमिटिंग सख़्त करें
- ऑफ़लाइन संदेशों के लिए आकार/काउंट सीमाएँ और बैक-प्रेशर
- Voice संदेशों का स्ट्रीम/चंकिंग और बेहतर मेटाडेटा
- टेस्ट कवरेज, इंटीग्रेशन/e2e टेस्ट

## त्वरित संदर्भ
- प्रमुख फोल्डर: `src/react-app/`, `src/shared/`, `src/worker/`, `migrations/`
- एंट्री पॉइंट्स: `src/react-app/main.tsx`, `src/react-app/App.tsx`, `src/worker/index.ts`
- स्कीमा: `src/shared/types.ts`
- वैलिडेशन/एन्क्रिप्शन/यूज़र मैनेजमेंट: `src/react-app/utils/*`
