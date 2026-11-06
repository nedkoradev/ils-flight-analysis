/* Single release-version source used by both ILS analysis pages. */
globalThis.ILS_VERSION = '1.1.17';
document.querySelectorAll('[data-app-version]').forEach(el => { el.textContent = 'v' + globalThis.ILS_VERSION; });
