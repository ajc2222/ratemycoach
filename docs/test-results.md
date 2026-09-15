# Test Results

Most recent verification: 2026-09-15.

| Check                             | Result                                                    |
| --------------------------------- | --------------------------------------------------------- |
| TypeScript                        | Pass — `next typegen && tsc --noEmit`                     |
| ESLint                            | Pass — zero errors and zero warnings                      |
| Vitest                            | Pass — 6 files, 151 tests                                 |
| Production build                  | Pass — Next.js 16.3.5, Webpack, 27 static/generated pages |
| Playwright journeys/accessibility | Not run — user opted for manual browser review            |
| Prettier                          | Pass — all matched files formatted                        |

Environment-dependent failures must be reported separately from application failures; a retained
artifact or an older build is not evidence that the current checkout passes.
