# Frontend — Healthy Nara (မြန်မာ)

Frontend ကို တည်းဖြတ်လုပ်ကိုင်တဲ့အခါ ဒီဖိုင်ကို လမ်းညွှန်အဖြစ် သုံးပါ။

## နည်းပညာ (Stack)

- **React 19 + TypeScript** (~6.0)၊ **Vite 8** build tool
- **React Router 7** (react-router-dom)၊ **TanStack React Query 5**
- **axios** HTTP client၊ **Tailwind CSS v4** (utility classes)၊ **lucide-react** icons
- `date-fns`၊ `react-date-range`၊ `react-datepicker`၊ `@hello-pangea/dnd`၊ `html-to-image` + `jspdf` (export)

## ဖိုင်ဖွဲ့စည်းပုံ (Structure)

- **`src/App.tsx`** — route အားလုံး **တစ်ဖိုင်တည်းထဲ** (lines 65-209)။ Provider: `QueryClientProvider` → `AuthProvider` → `Router`။ Route အသစ် ထည့်ဖို့ ဒီမှာပဲ ပြင်ရမယ်။
- **`src/api/index.ts`** (447 လိုင်း) — backend call အားလုံး ဒီကနေသွားတယ်။ Client နှစ်ခု: `api` နဲ့ `naApi`။ Function ~60 ခု။
- **`src/pages/`** — admin/staff pages (~23 ခု)၊ `src/pages/na/` — **မြန်မာလို** ရေးထားတဲ့ NA (ကလေးထိန်း) mobile portal (သီးခြား sub-app)။
- **`src/components/`** — shared component ၃ ခုပဲ: `Navbar`၊ `Sidebar`၊ `CustomDatePicker`။
- **`src/context/AuthContext.tsx`** — admin/staff auth state (`{ user, login, logout, isLoading }`)။
- **`src/utils/export.ts`** — `downloadAsImage` (PNG) + `downloadAsPDF` (jspdf)။
- `src/App.css` က **dead code** (import မလုပ်ဘူး) — အသုံးမပြုပါနဲ့။

## အမိန့်များ (Commands) — `frontend/` ထဲက ဖွင့်ပါ

| Command | လုပ်ဆောင်ချက် |
|---|---|
| `npm run dev` | Vite dev server `--host`၊ port `5173` |
| `npm run build` | `tsc -b && vite build` (typecheck ပြီးမှ build) |
| `npm run lint` | ESLint (flat config) |

## Env files

`frontend/.env`:

```
VITE_API_BASE_URL=https://healthy-nara-vouncher-api.vercel.app/api
VITE_HEALTHY_NARA_API_URL=...
```

Code fallback: `VITE_API_BASE_URL || 'http://localhost:5000/api'` (`src/api/index.ts:3`).

## API client စည်းမျဉ်း (Conventions)

- **Backend call အားလုံး `src/api/index.ts` ကနေ** သွားရမယ် — component ထဲမှာ `fetch`/`axios` တိုက်ရိုက် မသုံးဘူး။
- **`api`** (admin/staff) — header `Authorization: Bearer <token>` (localStorage `token`)။ **`naApi`** (NA/family) — localStorage `na_token`။
- Response interceptor (lines 19-32) က `{ success, message, data }` envelope ကို ဖြည်ပြီး `data` ကို return လုပ်တယ်။ Error ရင် `error.message` က server message ဖြစ်တယ်။
- Public booking/family pages တွေက `api` client သုံးပေမဲ့ token-in-URL endpoints မို့ header ထဲ stray token ပါသွားနိုင်တယ် — သတိထားပါ။

## Routing & Auth

- Route အသစ်တိုင်း **`App.tsx` ထဲ ထည့်ပါ**။ Admin/staff pages တွေက `PrivateRoute` (App.tsx:45-53) နဲ့ ကာကွယ်တယ် — login မရှိရင် `/login`၊ role မကိုက်ရင် `/` ပြန်ပို့တယ်။
- Auth flow သုံးမျိုး:
  1. **Admin/staff** — `AuthContext` + `localStorage('token')`၊ `Login.tsx` → `/login`။
  2. **NA portal** — `localStorage('na_token')` + cached `na_user`၊ `NALogin.tsx`။ `PrivateRoute` မသုံးဘူး — NA API ကိုယ်တိုင်က token reject လုပ်တယ်။
  3. **Public/family** — token-in-URL (`/book/:token`၊ `/family/:token`)၊ login မလို။
- Sidebar ထဲ item အသစ်ထည့်ဖို့ `Sidebar.tsx` ရဲ့ `navItems` array (lines 23-87) မှာ `roles` တွေ ထည့်ပါ။

## စတိုင် (Styling)

- Tailwind v4 — `@theme` tokens (brand color `#1CB89B` နဲ့ `primary-dark`/`primary-light`၊ radius/shadow) `src/index.css:3-11`။
- Utility classes inline JSX မှာသုံးတယ် — CSS modules / styled-components မသုံးဘူး။
- Modal/animate တွေမှာ `animate-in fade-in zoom-in-95` (tailwindcss-animate) သုံးတယ်။

## Deployment (Vercel/Netlify)

- Vite build → `dist/`။ `public/_redirects` (`/* /index.html 200`) — SPA fallback။
- `vite.config.ts` က minimal (react plugin ပဲ) — aliases/proxy မရှိဘူး။

## Rules (ထပ်ဆင့် စည်းမျဉ်းများ)

- [`frontend/.claude/rules/`](.claude/rules/) ထဲက rule ဖိုင်တွေကိုလည်း လိုက်နာပါ။
