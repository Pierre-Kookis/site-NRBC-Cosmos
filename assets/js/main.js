/* =========================================================================
   MAIN — Point d'entrée : démarre les modules dans le bon ordre
   ========================================================================= */

(function (NRBC) {
  'use strict';

  function boot() {
    /* L'effectif s'abonne aux événements du routeur : il s'initialise avant. */
    if (NRBC.effectif) NRBC.effectif.init();
    if (NRBC.router)   NRBC.router.init();
    if (NRBC.search)   NRBC.search.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window.NRBC = window.NRBC || {});
