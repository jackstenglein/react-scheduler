# Post-cleanup benchmark comparison

Compared against `benchmarks/baseline.json` via `npm run bench:compare` after:

- Removing hot-path `console.log`s
- Deleting unused week multi-day helpers
- Non-mutating sorts / default merges
- Stabilizing Week remote-fetch bounds
- Fixing `useSyncScroll` effect deps

## Scheduler render vs baseline

| Benchmark | Baseline hz | After hz | Delta |
|-----------|-------------|----------|-------|
| week view · 100 events | 3.87 | 4.20 | **1.08x faster** |
| week view · 500 events | 0.61 | 0.76 | **1.25x faster** |
| month view · 100 events | 1.53 | 1.52 | ~flat (noise) |
| month view · 500 events | 0.20 | 0.18 | noisy (RME >100%) |

Week render improved as expected from removing debug logging in `WeekTable` / `PositionProvider`. Month 500 is too noisy for a firm claim (outliers up to 30s).

## Helpers

Pipeline benches stayed within ~±5% of baseline (sort copy overhead is negligible at this scale). Correctness fixes (non-mutating sorts/defaults, fetch stability) are covered by unit tests rather than hz gains.

## Commands

```bash
npm run bench              # run benches
npm run bench:baseline     # overwrite baseline.json
npm run bench:compare      # compare to baseline.json
```
