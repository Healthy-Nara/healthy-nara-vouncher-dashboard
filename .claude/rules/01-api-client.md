# API Client — စည်းမျဉ်း (Rule)

Frontend ကနေ backend ကို ဒေတာခေါ်တဲ့အခါ ဒီစည်းမျဉ်းကို လိုက်နာပါ။

## အဓိကစည်းမျဉ်း (Core rule)

- **Backend call အားလုံး `src/api/index.ts` ထဲက function ကနေ** သွားရမယ်။ Component/pages ထဲမှာ `fetch()` သို့မဟုတ် `axios` တိုက်ရိုက် မရေးဘူး။
- Function အသစ် လိုရင် `src/api/index.ts` ထဲ ထည့်ပါ — ပြီးတော့မှ page ကနေ import လုပ်ပါ။

## Client နှစ်ခု (Two clients)

| Client | Token (localStorage) | သုံးတဲ့နေရာ |
|---|---|---|
| `api` | `token` | Admin/staff UI + public booking/family pages |
| `naApi` | `na_token` | NA portal၊ admin NA oversight၊ family |

- Request interceptor (lines 10-16) က `Authorization: Bearer <token>` ကို auto-attach လုပ်တယ်။
- Response interceptor (lines 19-32) က `{ success, message, data }` envelope ကို ဖြည်ပြီး **`data` ကို return** လုပ်တယ် — ဒါကြောင့် `useQuery`/`useMutation` ထဲမှာ response က အမြဲ `data` ဖြစ်နေတယ်။ Error ရင် `error.message` က server က ပို့တဲ့ message ဖြစ်တယ်။

## ဘယ်တော့ `api` vs `naApi` (Which client)

- Admin/staff လုပ်ဆောင်ချက်မှန်သမျှ → `api`။
- NA portal (login, duty, reports) → `naApi`။
- Family/public token-in-URL → `naApi` (ဒါမှမဟုတ် `api` — ဒါတွေက token-in-URL မို့ header token ကို မမှီခိုဘူး။ ရှိပြီးသား ပုံစံအတိုင်း လိုက်ပါ)။

## ဥပမာ (Example — page ထဲမှာ သုံးပုံ)

```ts
import { fetchInvoices } from '../api';

useQuery({
  queryKey: ['invoices', filter],
  queryFn: () => fetchInvoices(filter), // returns `data` ဖြစ်နေပြီ
});
```
