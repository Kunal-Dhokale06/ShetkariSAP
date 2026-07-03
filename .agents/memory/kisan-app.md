---
name: Kisan Finance Assistant build decisions
description: Key technical decisions and patterns established for the Kisan React Native Expo app.
---

## ID generation
`Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)` — no uuid package needed.

## i18next v26 init
Do NOT use `compatibilityJSON` or `initImmediate` options — they cause TypeScript errors in v26. Use minimal init:
```ts
i18n.use(initReactI18next).init({ resources, lng: 'mr', fallbackLng: 'en', interpolation: { escapeValue: false } });
```

## getCropTotals return shape
Returns `{ investment, revenue, netProfit }` — not `profit`. getTotals() returns `{ investment, revenue, profit, activeCrops }`.
**Why:** Decided to make crop-level totals use `netProfit` to match the CropSummary interface.

## Crop→expense/sale routing
Always pass `?cropId=X` query param when navigating from crop detail to add-expense or add-sale. Forms read `useLocalSearchParams<{ cropId?: string }>()` and preselect the crop.
**Why:** Default to crops[0] without param caused wrong crop attribution.

## Tab icon pattern
ClassicTabLayout uses MaterialIcons only (no SymbolView) — SymbolView type is SFSymbols7_0 union which causes TS errors when passed a plain string. NativeTabs handles SF symbols via Icon component from expo-router/unstable-native-tabs.

## TransactionItem type narrowing
Use `'category' in item` to narrow Expense|Sale union — TypeScript narrows correctly without unsafe `as` casts.

## Date formatting (i18n)
Use `Intl.DateTimeFormat(locale, opts).format(date)` with locale derived from language state.
- mr → 'mr-IN', hi → 'hi-IN', en → 'en-IN'

## Charts key prop
Use `key={item.label}` in SimpleBarChart. Use `key={insight.title}` in AI insight list.

## OTP auth model (intentional client-side trust)
The app is local-first; OTP verifies identity for onboarding only. `verifiedPhone` is stored in AsyncStorage (`@kisan/pending_phone` during flow, `@kisan/verified_phone` after). No server session/JWT — this is acceptable since no server-side protected data exists.
**Why:** Adding JWT session management for a purely local-storage app adds complexity with no security benefit.

## API server URL
Expo `EXPO_PUBLIC_DOMAIN` env var → `https://${EXPO_PUBLIC_DOMAIN}/api` (path `/api` is the artifact previewPath). Localhost fallback: `http://localhost:8080/api`.

## Dev OTP flow
`phone.tsx` stores devOtp to `@kisan/dev_otp` in AsyncStorage before navigating away. `otp.tsx` reads and displays it as a banner. Cleaned up with `multiRemove` on successful verification.

## OTP screen missing-phone guard
If `@kisan/pending_phone` is absent on mount (direct navigation), `otp.tsx` redirects to `/auth/phone` after 800ms.
