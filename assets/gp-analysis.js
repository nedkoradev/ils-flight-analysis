/* Shared pure altitude/GP calculations; usable in browsers and node:test. */
(function (root) {
  'use strict';
  const FT_TO_M = 0.3048, NM_TO_M = 1852;
  function finite(value, name) {
    if (!Number.isFinite(value)) throw new Error(name + ' must be a finite number.');
    return value;
  }
  function geometry(runway) {
    const angle = finite(runway.gpAngle, 'GP angle');
    const tchM = finite(runway.tchFt, 'Threshold crossing height') * FT_TO_M;
    if (angle <= 0 || angle >= 10 || tchM <= 0) throw new Error('Invalid nominal GP geometry.');
    const slope = Math.tan(angle * Math.PI / 180);
    return { angle, tchM, slope, originNM: tchM / slope / NM_TO_M };
  }
  function nominalHeight(distanceNM, runway) {
    const g = geometry(runway);
    return g.tchM + finite(distanceNM, 'Distance') * NM_TO_M * g.slope;
  }
  function defaults() {
    return { type: 'unknown', reference: 'unknown', correctionM: 0, basis: '', uncertaintyM: null };
  }
  function validate(settings, runway) {
    const s = { ...defaults(), ...settings };
    if (!['geometric', 'barometric'].includes(s.type)) throw new Error('Altitude type is unknown. LOC remains available; absolute GP deviation is undetermined.');
    if (!['threshold', 'msl', 'manual'].includes(s.reference)) throw new Error('Altitude datum is unknown. Select a documented reference before interpreting GP deviation.');
    finite(s.correctionM, 'Correction');
    if (s.uncertaintyM !== null && (finite(s.uncertaintyM, 'Uncertainty') < 0)) throw new Error('Uncertainty must be non-negative.');
    if ((s.correctionM !== 0 || s.reference === 'manual') && !s.basis.trim()) throw new Error('Enter the documented basis for the manual correction.');
    if (s.type === 'barometric' && s.reference !== 'manual') throw new Error('Barometric altitude requires a documented total conversion to height above threshold. A GP fit is not a datum conversion.');
    if (s.reference === 'msl') finite(runway.thrElevFt, 'Threshold elevation');
    return s;
  }
  function aircraftHeight(altitudeFt, runway, settings) {
    const s = validate(settings, runway);
    const rawM = finite(altitudeFt, 'Altitude') * FT_TO_M;
    const datumOffsetM = s.reference === 'msl' ? -runway.thrElevFt * FT_TO_M : 0;
    return { heightM: rawM + datumOffsetM + s.correctionM, datumOffsetM, correctionM: s.correctionM, basis: s.basis, uncertaintyM: s.uncertaintyM, type: s.type, reference: s.reference };
  }
  function analyzePoint(point, runway, settings) {
    const converted = aircraftHeight(point.source.altitude, runway, settings);
    const gpHeightM = nominalHeight(point.x, runway);
    return { x: point.x, y: converted.heightM, aircraftHeightM: converted.heightM, gpHeightM, gpDeviationM: converted.heightM - gpHeightM, rawAltitude: point.source.altitude, ...converted, source: point.source };
  }
  const api = { FT_TO_M, geometry, nominalHeight, defaults, validate, aircraftHeight, analyzePoint };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GPAnalysis = api;
})(globalThis);
