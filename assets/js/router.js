/* =========================================================================
   ROUTER — Navigation entre les pages (vues) et les sous-onglets
   ---------------------------------------------------------------------------
   L'URL reflète la page affichée : #hierarchie, #procedure/radio, etc.
   Un rafraîchissement ou un lien partagé retombe donc au bon endroit.
   ========================================================================= */

(function (NRBC) {
  'use strict';

  var config = NRBC.config;
  var MOBILE = '(max-width: 980px)';

  var state = { view: config.defaultView, sub: null };

  var el = {};

  /* --------------------------------------------------------------------- */
  /* Utilitaires                                                            */
  /* --------------------------------------------------------------------- */

  function isMobile() {
    return window.matchMedia(MOBILE).matches;
  }

  function viewExists(name) {
    return !!document.getElementById('view-' + name);
  }

  /* --------------------------------------------------------------------- */
  /* Affichage d'un sous-onglet                                             */
  /* --------------------------------------------------------------------- */

  function showSub(viewName, sub) {
    var container = document.getElementById('view-' + viewName);
    if (!container) return;

    var subviews = container.querySelectorAll('.subview');
    if (!subviews.length) return;

    if (!sub || !container.querySelector('#sub-' + sub)) {
      sub = config.defaultSubs[viewName] || subviews[0].id.replace('sub-', '');
    }

    Array.prototype.forEach.call(subviews, function (sv) {
      sv.hidden = sv.id !== 'sub-' + sub;
    });

    Array.prototype.forEach.call(container.querySelectorAll('.subtab-btn'), function (btn) {
      var active = btn.dataset.sub === sub;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    Array.prototype.forEach.call(document.querySelectorAll('.dropdown button'), function (btn) {
      btn.classList.toggle('is-active', btn.dataset.view === viewName && btn.dataset.sub === sub);
    });

    state.sub = sub;

    document.dispatchEvent(new CustomEvent('nrbc:subview', {
      detail: { view: viewName, sub: sub }
    }));

    return sub;
  }

  /* --------------------------------------------------------------------- */
  /* Affichage d'une page                                                   */
  /* --------------------------------------------------------------------- */

  function showView(name, sub, options) {
    options = options || {};

    if (!viewExists(name)) name = config.defaultView;

    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
      v.hidden = v.id !== 'view-' + name;
    });

    Array.prototype.forEach.call(document.querySelectorAll('.navlink[data-view]'), function (link) {
      link.classList.toggle('is-active', link.dataset.view === name);
    });

    state.view = name;
    var resolvedSub = showSub(name, sub);

    closeMobileNav();

    if (options.updateHash !== false) {
      var hash = '#' + name + (resolvedSub ? '/' + resolvedSub : '');
      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash);
      }
    }

    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.dispatchEvent(new CustomEvent('nrbc:view', {
      detail: { view: name, sub: resolvedSub }
    }));
  }

  /* --------------------------------------------------------------------- */
  /* Menu mobile                                                            */
  /* --------------------------------------------------------------------- */

  function openMobileNav() {
    el.nav.classList.add('is-open');
    el.navToggle.setAttribute('aria-expanded', 'true');
    el.navToggle.setAttribute('aria-label', 'Fermer le menu');
  }

  function closeMobileNav() {
    if (!el.nav) return;
    el.nav.classList.remove('is-open');
    el.navToggle.setAttribute('aria-expanded', 'false');
    el.navToggle.setAttribute('aria-label', 'Ouvrir le menu');
    Array.prototype.forEach.call(document.querySelectorAll('.navgroup.is-open'), function (g) {
      g.classList.remove('is-open');
      var trigger = g.querySelector('.navlink');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function toggleMobileNav() {
    if (el.nav.classList.contains('is-open')) closeMobileNav();
    else openMobileNav();
  }

  function toggleGroup(group) {
    var isOpen = group.classList.toggle('is-open');
    var trigger = group.querySelector('.navlink');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  /* --------------------------------------------------------------------- */
  /* Lecture de l'URL                                                       */
  /* --------------------------------------------------------------------- */

  function readHash() {
    var raw = window.location.hash.replace(/^#/, '');
    if (!raw) return { view: config.defaultView, sub: null };
    var parts = raw.split('/');
    return { view: parts[0], sub: parts[1] || null };
  }

  /* --------------------------------------------------------------------- */
  /* Initialisation                                                         */
  /* --------------------------------------------------------------------- */

  function init() {
    el.nav = document.getElementById('nav-principal');
    el.navToggle = document.getElementById('nav-toggle');

    /* Liens de navigation, entrées de menu déroulant et cartes d'accueil */
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-view]'),
      function (trigger) {
        trigger.addEventListener('click', function (event) {
          var group = trigger.closest('.navgroup');
          var isGroupTrigger = group && trigger.classList.contains('navlink');

          /* Sur mobile, le premier appui sur un onglet à menu ouvre le menu. */
          if (isGroupTrigger && isMobile() && el.nav.classList.contains('is-open')) {
            event.preventDefault();
            toggleGroup(group);
            return;
          }

          if (trigger.tagName === 'A') event.preventDefault();
          showView(trigger.dataset.view, trigger.dataset.sub);
        });
      }
    );

    /* Onglets secondaires */
    Array.prototype.forEach.call(document.querySelectorAll('.subtab-btn'), function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.closest('.view').id.replace('view-', '');
        showSub(view, btn.dataset.sub);
        history.replaceState(null, '', '#' + view + '/' + btn.dataset.sub);
      });
    });

    /* Menu mobile */
    if (el.navToggle) {
      el.navToggle.addEventListener('click', toggleMobileNav);
    }

    document.addEventListener('click', function (event) {
      if (!el.nav.classList.contains('is-open')) return;
      if (el.nav.contains(event.target) || el.navToggle.contains(event.target)) return;
      closeMobileNav();
    });

    window.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMobileNav();
    });

    window.addEventListener('resize', function () {
      if (!isMobile()) closeMobileNav();
    });

    /* Navigation arrière / avant du navigateur */
    window.addEventListener('hashchange', function () {
      var target = readHash();
      showView(target.view, target.sub, { updateHash: false, scroll: false });
    });

    /* État initial */
    var start = readHash();
    showView(start.view, start.sub, { scroll: false });
  }

  NRBC.router = {
    init: init,
    showView: showView,
    showSub: showSub,
    closeMobileNav: closeMobileNav,
    get state() { return { view: state.view, sub: state.sub }; }
  };

})(window.NRBC = window.NRBC || {});
