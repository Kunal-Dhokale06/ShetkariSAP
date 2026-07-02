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
