# Benchmark comparison notes

## Baseline (pre-cleanup)
See `BASELINE.md` / `baseline.json`.

## After cleanup PR
Week render ~1.08–1.25× vs baseline (debug log removal).

## After store-selector PR

Scheduler render (jsdom), vs original baseline:

| Benchmark | Baseline hz | After store split | Delta |
|-----------|-------------|-------------------|-------|
| week view · 100 events | 3.87 | **6.91** | **1.78×** |
| week view · 500 events | 0.61 | **1.51** | **2.49×** |
| month view · 100 events | 1.53 | 1.66 | ~1.09× |
| month view · 500 events | 0.20 | 0.25 | noisy |

Changes that drive this:
- External store + `useStore(selector)` / `shallowEqual`
- Stable action identities (no fetch-dep churn)
- Cells read `currentDragged` via `getState()` (no drag re-render storm)
- `memo(EventItem)` + precomputed per-day timed events in `WeekTable`

```bash
npm run bench:compare
```
