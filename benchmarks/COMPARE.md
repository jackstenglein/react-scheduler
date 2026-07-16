# Benchmark comparison notes

## Baseline (pre-cleanup)
See `BASELINE.md` / `baseline.json`.

## After cleanup PR
Week render ~1.08–1.25× vs baseline (debug log removal).

## After store-selector PR

| Benchmark | Baseline hz | After | Delta |
|-----------|-------------|-------|-------|
| week view · 100 events | 3.87 | 6.91 | 1.78× |
| week view · 500 events | 0.61 | 1.51 | 2.49× |

## After layout-pipeline PR

| Benchmark | Baseline hz | After | Delta |
|-----------|-------------|-------|-------|
| week view · 100 events | 3.87 | **7.15** | **1.85×** |
| week view · 500 events | 0.61 | **1.56** | **2.56×** |
| month view · 100 events | 1.53 | **3.30** | **2.16×** |
| month view · 500 events | 0.20 | 0.38 | ~1.9× (noisy) |

Pure layout helpers (`src/lib/layout/eventLayout.ts`) now own slots, week day buckets, timed placements, and month cell event indexes. Views consume the model instead of recomputing per cell/column.

```bash
npm run bench:compare
```
