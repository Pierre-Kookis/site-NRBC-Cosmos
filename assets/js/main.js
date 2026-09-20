/* =========================================================================
   MAIN — Point d'entrée : démarre les modules dans le bon ordre
   ========================================================================= */

(function (NRBC) {
  'use strict';

  /* -----------------------------------------------------------------------
     Bandeau d'environnement
     -----------------------------------------------------------------------
     Sur le site publié : rien. Sur une copie ouverte en local : un rappel.
     Dans le dossier de test : un rappel plus visible encore.
     Aucun fichier ne diffère entre les copies — c'est l'adresse de la page
     qui décide, donc rien à retirer au moment de publier.
     --------------------------------------------------------------------- */
  function showEnvironmentBanner() {
    var config = NRBC.config || {};

    if (config.publishedHost && window.location.hostname === config.publishedHost) return;

    var path = '';
    try { path = decodeURIComponent(window.location.pathname); } catch (e) { path = window.location.pathname; }

    var marker = config.testFolderMarker || 'site_nrbc_test';
    var isTest = path.toLowerCase().indexOf(marker.toLowerCase()) !== -1;

    var banner = document.createElement('div');
    banner.className = 'env-banner' + (isTest ? ' env-banner--test' : '');
    banner.setAttribute('role', 'status');
    banner.textContent = isTest
      ? 'Version de test — en attente de validation, non publiée'
      : 'Prévisualisation locale — peut différer du site en ligne';

    document.body.insertBefore(banner, document.body.firstChild);
  }

  function boot() {
    showEnvironmentBanner();

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
