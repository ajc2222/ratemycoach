# Landing Message Experiment

The test compares two fixed landing headlines:

- A: decision anxiety — research a coach before committing.
- B: evidence gap — real experiences rather than transformation photos.

Assignment is deterministic from the anonymous visitor ID plus `EXPERIMENT_SALT`, stored in the
first-party `pcr_var` cookie, and attached to events and submissions. `?variant=a` or `?variant=b`
is a QA override.

The primary comparison is qualified waitlist completion; search-start rate is secondary. Do not
call a winner before at least 300 qualified visitors per variant, and inspect channel/device balance
before interpreting a difference. Copy is the only intended experimental variable.
