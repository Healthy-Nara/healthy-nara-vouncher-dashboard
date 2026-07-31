# Routing & Auth — စည်းမျဉ်း (Rule)

Route အသစ်ထည့်တာ၊ auth ကာကွယ်တာ လုပ်တဲ့အခါ ဒီစည်းမျဉ်းကို လိုက်နာပါ။

## Route အားလုံး `App.tsx` ထဲမှာ

- Route အသစ်တိုင်းကို **`src/App.tsx`** (lines 68-205) ထဲမှာပဲ ထည့်ပါ။ တစ်ခြား route config ဖိုင်တွေ မဖန်တီးပါနဲ့။
- Admin/staff pages တွေက `Navbar` + `Sidebar` + `<main>` layout အောက်မှာ (catch-all `path="*"` route)။
- Route group ၄ ခုရှိတယ်:
  1. **Public** — `/book/:token`၊ `/login`
  2. **NA portal** (layout မရှိ) — `/na/login`၊ `/na`၊ `/na/report/:id`...
  3. **Family** — `/family/:token`
  4. **Admin/staff** — `PrivateRoute` နဲ့ ကာကွယ်

## `PrivateRoute` (App.tsx:45-53)

- Login မရှိရင် → `/login`။ `roles` ပေးထားပြီး `user.role` က ထဲမပါရင် → `/`။ Loading ချိန်မှာ "Loading..." ပြတယ်။
- Admin ပဲ လိုတဲ့ page → `roles={['admin']}`။ Admin+staff → `roles={['admin','staff']}` (သို့မဟုတ် မထည့်ဘဲ)။

## Auth flow သုံးမျိုး (Three auth flows)

1. **Admin/staff** — `AuthContext` (`useAuth()`) → `localStorage('token')` + user။ `Login.tsx` က `useMutation(loginApi)` နဲ့ login။ Session restore က `fetchMe()` (`GET /auth/me`)။
2. **NA portal** — `localStorage('na_token')` + `na_user`။ `NALogin.tsx`။ **`PrivateRoute` မသုံးဘူး** — client-side redirect နဲ့ NA API ကိုယ်တိုင်က bad token reject လုပ်တယ်။
3. **Public/family** — token-in-URL (`/book/:token`၊ `/family/:token`)။ Login မရှိ။

## ဘယ်တော့ ဘာသုံးမလဲ (Which guard)

| Page အမျိုး | Guard |
|---|---|
| Admin/staff pages | `PrivateRoute` + role |
| NA pages | `PrivateRoute` မဟုတ် — NA client redirect |
| Public booking / family | token-in-URL ပဲ |

## သတိထားစရာ (Caveats)

- NA logout ကို `localStorage` ထဲက `na_token` + `na_user` နှစ်ခုလုံး ဖျက်ပါ။
- Sidebar ထဲ item အသစ်ထည့်ဖို့ `Sidebar.tsx` ရဲ့ `navItems` (lines 23-87) မှာ `roles` သတ်မှတ်ပါ — role မကိုက်တဲ့ link တွေကို မပြဘဲ filter လုပ်တယ်။
- `/na/dashboard` link က route (`/na`) နဲ့ မကိုက်တဲ့ dangling link ရှိတယ် (NADashboard.tsx:317) — အသစ်ရေးရင် ဒါမျိုး မဖန်တီးပါနဲ့။
