# ILS Flight Analysis

Browser-based analysis and visualization of aircraft ILS approach trajectories using ADS-B data. Static HTML/JavaScript, served by GitHub Pages; no backend or application build is required.

## Local development

Use Node.js 22+ and Python 3:

```sh
npm ci
python3 -m http.server 8000 --directory .
```

Both `/` and `/ils-analysis/` use `assets/gp-analysis.js` for GP calculations, `assets/gp-controls.js` for altitude declarations, and `assets/version.js` for the displayed version. Their existing approach selection interfaces are preserved.

## Altitude interpretation

CSV `Altitude` values are read as feet. KML coordinate altitudes are converted from metres. Neither importer proves altitude type or datum: each new file starts with unknown altitude reference and GP aircraft curves suppressed. LOC remains available. KML altitudeMode normalization and general import validation remain follow-up work; do not infer an absolute datum from a KML filename.

Select the documented altitude type and reference, then apply it:

- **Height above threshold**: geometric/documented heights already relative to the threshold in the same vertical datum.
- **MSL**: geometric heights in the same vertical datum as the configured threshold elevation; subtract threshold elevation. Ellipsoid altitude is not MSL.
- **Total conversion to threshold height**: add a documented total offset in metres, including all necessary datum offsets. Required for barometric input; it is the user's responsibility to establish the conversion from reliable source information. A GP fit is never used as calibration.

A nonzero correction, or any total-conversion declaration, requires a written basis. The correction, basis and optional altitude uncertainty are retained with calculated points and shown in the controls. Unknown uncertainty remains labelled unknown; it is not a confidence bound for combined position/geometry errors. Settings apply to the current file only and reset on the next import. Mixed altitude datums within one file must be normalized before import.

Nominal GP uses the existing runway angle and `tchFt`, with a virtual straight-line origin behind the threshold. It does not locate the GP antenna. Existing runway values and reference envelopes require independent AIP/ICAO verification. ADS-B trajectory deviations do not measure ILS signal-in-space or establish facility compliance.

## Validation

```sh
npm test
npx playwright install --with-deps chromium
npm run test:browser
```

Browser checks use `CHROMIUM_PATH` if supplied, otherwise system `/usr/bin/chromium` when available, or Playwright's installed Chromium. They start their own temporary local HTTP server. The Chart.js CDN must be reachable. In a managed cloud environment the inherited HTTPS proxy is used, with loopback bypass and TLS verification preserved.

The unit suite checks nominal and ±15 m trajectories for runway 09/27 fixtures, MSL subtraction, manual conversion metadata, unknown datum, invalid input, and configured TCH. Browser checks upload synthetic files into both entry points and assert the actual GP/zoom datasets, LOC availability, warnings, manual corrections, upload errors and narrow viewport behaviour.

## Releases

The current release is v1.1.17 (2026-11-06), including the GP altitude-datum correction. Keep `assets/version.js` as the single display-version source and update `CHANGELOG.md` when releasing. Do not create a release tag for a failed or unpublished change. Before merging, require successful checks and an up-to-date branch; do not bypass branch protections. After merging, verify the Pages deployment and its version before reporting publication.

### Existing detection limitation

The approach detector can merge two immediately adjacent recorded passes even when separated by a timestamp gap, because its final overlap merge expands both segment boundaries. This change does not alter approach detection. The multi-approach regression uses an intervening off-approach segment and verifies that each detected approach retains its own vertical offset. Timestamp-only segmentation requires a separate fix.
