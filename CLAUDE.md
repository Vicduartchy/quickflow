# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173/quickflow/
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm test             # Vitest (45 tests, run once)
npm run test:watch   # Vitest in watch mode
npm run test:coverage

# Run a single test file
npx vitest run src/lib/mapping.test.ts

# Add shadcn components (components.json already configured)
npx shadcn@latest add <component>
```

## Architecture

The app is a **4-step client-side wizard** with no backend. All data stays in `localStorage`.

**Step flow** (`Step` type): `upload → mapping → policy → dashboard`

`App.tsx` renders one screen component per step, all wrapped in `AppProvider`. Navigation is done by calling `setStep()` from context — there is no router.

**Data pipeline:**
1. **UploadScreen** — reads CSV/XLSX via SheetJS into `rawRows: Record<string, unknown>[]` and `headers: string[]`
2. **MappingScreen** — maps spreadsheet columns to the 6 fields in `ColumnMapping` (id, type, team, entryDate, exitDate, currentStatus). `autoMapColumns()` in `mapping.ts` scores headers with regex patterns to pre-fill this automatically (Azure DevOps / Jira / Trello naming conventions baked in)
3. **PolicyScreen** — assigns each unique `currentStatus` value to a `StatusCategory` (`backlog | wip | done | unclassified`) and a `FlowLayer`
4. **DashboardScreen** — renders 6 Recharts charts + `InsightsPanel`. Filters (date range, team, type, status) live in context and are applied at render time, not stored

**State** — single `AppContext` (`src/lib/context.tsx`) holds all wizard state. `useApp()` is the only hook to access it. Exposes: `t`, `lang`, `toggleLang`, `step`, `setStep`, `workItems`, `mapping`, `flowPolicy`, `groupBy`, `selectedTeams`, `selectedStatuses`, `selectedTypes`, `dateFrom`, `dateTo`, `resetAll`.

**Persistence** — `src/lib/storage.ts` syncs `workItems`, `mapping`, `flowPolicy`, and `headers` to `localStorage` via `useEffect` watchers in the provider. On mount, if `workItems` exist the app boots directly to `dashboard`.

**Metrics** (`src/lib/mapping.ts`):
- `buildWorkItems()` — converts raw rows + mapping into `WorkItem[]`, calls `parseDate()` (handles dd/mm/yyyy, yyyy-mm-dd, M/D/YY, and Excel numeric serials) and `computeCycleTime()`
- `getPercentile()` — used for P50/P85/P95 cycle time
- `computeThroughputMedian()` — excludes the last partial period if its count is < 50% of the median
- `getGroupLabel(groupBy, lang)` — always pass `lang` from context, never hardcode `"pt-BR"`

**i18n** — `src/i18n/translations.ts` holds all UI strings for `pt-BR` and `en-US`. Access via `t` and `lang` from `useApp()`. Default language is `pt-BR`.

## UI — shadcn/ui

shadcn/ui is initialized. Config lives in `components.json`. Installed components:
- `src/components/ui/button.tsx` — `Button` with variants: `default | destructive | outline | secondary | ghost | link`
- `src/components/ui/alert.tsx` — `Alert`, `AlertTitle`, `AlertDescription`

**Utilities:**
- `src/lib/utils.ts` — exports `cn()` (clsx + tailwind-merge). Import as `@/lib/utils`.
- Path alias `@/` → `src/` configured in both `vite.config.ts` and `tsconfig.app.json`.

**Theme** — CSS variables in `src/index.css` map the brand palette:
- `--primary` → `#BF452A` (orange)
- `--foreground` → `#092140` (navy)
- `--muted-foreground` → `#D99789` (salmon)
- `--border` → `#F2C5BB` (light border)

**Rules when adding UI:**
- Use `Button` instead of raw `<button>`. Use `variant="outline"` for secondary actions, `variant="link"` for inline text actions.
- Use `Alert` + `AlertDescription` instead of styled `<div>` for errors and warnings. Override colors via `className` for amber/yellow variants.
- Never use `space-y-*` / `space-x-*` — use `flex flex-col gap-*` instead.
- Icons inside `Button` must use `data-icon="inline-start"` or `data-icon="inline-end"`.
- Never hardcode `dark:` color overrides — use semantic tokens.

## Key details

- **Base path** is `/quickflow/` — all public assets (logos, images) must be referenced as `/quickflow/<filename>`, not `/`.
- **Brand colors:** `#BF452A` (orange), `#092140` (navy), `#D99789` (salmon), `#F2C5BB` (light border). These are also available as CSS variables via shadcn theme.
- Tests cover only `mapping.ts` and `storage.ts` — component logic is untested.
- `Charts.tsx` contains all 6 chart components in a single file; it's large by design.
- **Deploy** is automatic via GitHub Actions on push to `main` → GitHub Pages at `https://vicduartchy.github.io/quickflow/`.

## Automated browser testing

Use Chrome DevTools MCP tools to test the wizard flow end-to-end. To simulate file upload in React (file input is hidden), inject via React fiber:

```js
const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
const input = document.querySelector('input[type="file"]')
const dt = new DataTransfer()
dt.items.add(file)
Object.defineProperty(input, 'files', { value: dt.files, writable: false })
input.dispatchEvent(new Event('change', { bubbles: true }))
```
