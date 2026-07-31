# Frontend Conventions — စည်းမျဉ်း (Rule)

ကုဒ်ရေးတဲ့အခါ ဒီနည်းလမ်းတွေကို လိုက်နာပါ — ရှိပြီးသား codebase နဲ့ ကိုက်ညီအောင်။

## TypeScript

- **`verbatimModuleSyntax` ဖွင့်ထားတယ်** (`tsconfig.app.json`) — type-only import တွေမှာ **`import type`** သုံးပါ။ မဟုတ်ရင် build fail ဖြစ်တယ်။
- `noUnusedLocals` / `noUnusedParameters` ဖွင့်ထားတယ် — unused import/variable မထားပါနဲ့။
- Path alias မရှိဘူး (`tsconfig` ထဲ `paths` မပါ) — **relative import** ပဲ သုံးပါ။

## TanStack React Query ပုံစံ (Pattern)

- Data ဖတ်ဖို့ → `useQuery({ queryKey, queryFn })`။ queryKey ထဲ filter state ထည့်ပါ (ဥပမာ `['invoices', filter]`)။
- Data ပြောင်းဖို့ → `useMutation` + `onSuccess` ထဲ **`queryClient.invalidateQueries({ queryKey })`** ခေါ်ပြီး data refresh လုပ်ပါ။
- ရှိပြီးသား ပုံစံကို `src/pages/Invoices.tsx` (lines 114-171) မှာ ကြည့်နိုင်တယ်။

## Styling (Tailwind v4)

- Utility classes inline JSX မှာသုံးတယ် — CSS modules / styled-components / CSS-in-JS **မသုံးဘူး**။
- Brand color token သုံးပါ: `primary` = `#1CB89B` (teal)၊ `primary-dark`၊ `primary-light` — `src/index.css:3-11` `@theme`။ Hardcoded hex တွေ ထပ်မထည့်ဘဲ token သုံးတာ ပိုကောင်းတယ်။
- Modal/animate မှာ `animate-in fade-in zoom-in-95` (tailwindcss-animate) သုံးနိုင်တယ်။

## Don't introduce dead code

- `src/App.css` က မသုံးတဲ့ Vite demo CSS — import မလုပ်ပါနဲ့၊ အသစ်မျိုးမထည့်ပါနဲ့။
- မသုံးတော့တဲ့ ဖိုင်တွေကို မထားခဲ့ပါနဲ့။
- ရှိပြီးသား သီးခြားဖိုင်ထဲ logic ထပ်ရေးစရာမလိုရင် `src/api/index.ts`၊ `src/App.tsx` ထဲ ထည့်လိုက်တာ codebase ပုံစံနဲ့ ကိုက်တယ်။

## NA portal (Burmese sub-app)

- `src/pages/na/` ဖိုင်တွဲက မြန်မာလို၊ mobile-first UI။ ဒီထဲ admin page ပုံစံကို copy မလုပ်ဘဲ ကိုယ်ပိုင် ပုံစံလိုက်ပါ။
