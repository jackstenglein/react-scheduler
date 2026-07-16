# Performance baseline

Captured before the cleanup PR (debug logs still present, mutating sorts/defaults, unstable Week fetch deps, `useSyncScroll` rebinding every render).

Run: `npm run bench:baseline`  
Compare later: `npm run bench:compare`

## Scheduler render (jsdom)

| Benchmark | hz | mean | p99 |
|-----------|-----|------|-----|
| week view · 100 events | 3.87 | 258 ms | 288 ms |
| week view · 500 events | 0.61 | 1,645 ms | 4,728 ms |
| month view · 100 events | 1.53 | 653 ms | 725 ms |
| month view · 500 events | 0.20 | 4,993 ms | 15,926 ms |

## Event pipeline helpers

| Benchmark | hz | mean |
|-----------|-----|------|
| filterTodayEvents · 100 | 133 | 7.5 ms |
| filterTodayEvents · 500 | 27 | 37 ms |
| filterTodayEvents · 1000 | 13 | 76 ms |
| filterTodayEvents · 500 × 7 days | 3.8 | 264 ms |
| sortEventsByTheLengthest · 500 | 75 | 13 ms |
| sortEventsByTheEarliest · 500 | 140 | 7.1 ms |
| traversCrossingEvents · dense day | 1,480 | 0.68 ms |
| filterMultiDaySlot · 500 × week | 25 | 39 ms |
| getTimeZonedDate · no tz · 1000 | 28 | 36 ms |
| getTimeZonedDate · America/New_York · 1000 | 26 | 38 ms |

Source: `benchmarks/baseline.json`
