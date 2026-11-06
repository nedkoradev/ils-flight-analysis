# Changelog

## v1.1.17 — 2026-11-06

- Remove automatic median fitting of altitude to the nominal glide path: constant vertical offsets are preserved.
- Share pure altitude conversion, GP geometry and deviation calculations between both analysis pages.
- Require user-declared altitude type and reference. Unknown datum leaves LOC available and suppresses unsupported absolute GP tracks.
- Add documented manual corrections in metres and optional altitude uncertainty; barometric data require an explicit total conversion to threshold height.
- Use the existing runway `tchFt` field (50 ft = 15.24 m), instead of hardcoded 15.5 m. The virtual GP origin is not the physical antenna location. Existing AIP data remain unverified.
- Mark geometric envelopes as unverified references; no ICAO compliance conclusions.
- Fix upload success/error messages and clear stale analysis after failed imports.
- Use one version source for both entry points; unreleased work is explicitly marked. Version shared by both published entry points.
- Add 14 mathematical regression tests, browser checks on both entry points, and GitHub Actions checks.

## v1.1.16 — existing baseline

- Existing root application baseline at commit `6a97b010c35d8e8ff86e3c4615e7314857bdb5d0`.
- No Git release tags were present when the GP fix was started. The legacy `/ils-analysis/` page previously displayed v1.1.0.
