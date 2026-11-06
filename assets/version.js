/* Single release-version source. Unpublished changes are explicitly marked. */
globalThis.ILS_VERSION = '1.1.16';
document.querySelectorAll('[data-app-version]').forEach(el => { el.textContent = 'v' + globalThis.ILS_VERSION + ' · unreleased'; });
