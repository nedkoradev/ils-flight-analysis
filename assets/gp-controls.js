(function () {
  'use strict';
  const panel = document.getElementById('altitudeControls');
  panel.innerHTML = `<h2>Altitude reference for GP analysis</h2>
    <p>CSV Altitude is read in feet; KML coordinate altitude in metres. The importer does not establish the vertical datum. Confirm it from the source documentation. Ellipsoid heights cannot be treated as MSL heights.</p>
    <form id="altitudeForm">
      <label>Altitude type <select id="altitudeType"><option value="unknown">Unknown — GP undetermined</option><option value="geometric">Geometric / documented height</option><option value="barometric">Barometric</option></select></label>
      <label>Reference <select id="altitudeReference"><option value="unknown">Unknown</option><option value="threshold">Height above threshold (same vertical datum)</option><option value="msl">MSL — same datum as threshold elevation</option><option value="manual">Documented total conversion to threshold height</option></select></label>
      <label>Manual correction [m] <input id="altitudeCorrection" type="number" step="any" value="0" required></label>
      <label>Correction basis / source <input id="altitudeBasis" type="text" placeholder="Document, datum conversion, date…"></label>
      <label>Altitude uncertainty [m] (optional) <input id="altitudeUncertainty" type="number" min="0" step="any"></label>
      <button type="submit">Apply reference</button>
    </form>
    <p>Correction is added to the input height (after MSL threshold subtraction, if selected). “Total conversion” must already include all datum offsets; it is never estimated from the flight track.</p>
    <p id="altitudeMessage" role="status" aria-live="polite">Altitude reference unknown: absolute GP deviation is undetermined. LOC analysis remains available.</p>
    <p>Nominal geometry uses the existing runway angle and configured TCH (50 ft = 15.24 m). These runway data are not independently AIP-verified. The calculated GP origin is a virtual line intersection, not the antenna location. Displayed envelopes are unverified geometric references, not an ICAO compliance assessment.</p>`;
  document.getElementById('altitudeForm').addEventListener('submit', event => {
    event.preventDefault();
    const uncertainty = document.getElementById('altitudeUncertainty').value;
    altitudeSettings = {
      type: document.getElementById('altitudeType').value,
      reference: document.getElementById('altitudeReference').value,
      correctionM: document.getElementById('altitudeCorrection').valueAsNumber,
      basis: document.getElementById('altitudeBasis').value.trim(),
      uncertaintyM: uncertainty === '' ? null : document.getElementById('altitudeUncertainty').valueAsNumber
    };
    refreshAltitudeMessage();
    if (detectedRunway) updateDisplay();
  });
  refreshAltitudeMessage();
})();
