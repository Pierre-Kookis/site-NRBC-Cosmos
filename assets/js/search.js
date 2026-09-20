/* =========================================================================
   SEARCH — Moteur de recherche global (Ctrl + F)
   ---------------------------------------------------------------------------
   Parcourt le texte de toutes les pages, y compris celles qui ne sont pas
   affichées, surligne les occurrences et bascule automatiquement sur la
   bonne page / le bon sous-onglet lorsqu'on navigue entre les résultats.
   ========================================================================= */

(function (NRBC) {
  'use strict';

  var MIN_LENGTH = 2;
  var el = {};
  var hits = [];
  var current = -1;
  var debounce = null;

  /* --------------------------------------------------------------------- */
  /* Ouverture / fermeture                                                  */
  /* --------------------------------------------------------------------- */

  function isOpen() {
    return !el.overlay.hidden;
  }

  function open() {
    el.overlay.hidden = false;
    el.input.focus();
    el.input.select();
  }

  function close() {
    el.overlay.hidden = true;
    clearHits();
    el.input.value = '';
  }

  /* --------------------------------------------------------------------- */
  /* Surlignage                                                             */
  /* --------------------------------------------------------------------- */

  function clearHits() {
    hits.forEach(function (mark) {
      var parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
    hits = [];
    current = -1;
    setCount(0);
  }

  function setCount(total, index) {
    if (!total) {
      el.count.textContent = el.input.value.trim().length >= MIN_LENGTH
        ? 'Aucun résultat'
        : '0 résultat';
      return;
    }
    el.count.textContent = (index === undefined)
      ? total + ' résultat' + (total > 1 ? 's' : '')
      : (index + 1) + ' / ' + total + ' résultat' + (total > 1 ? 's' : '');
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function collectTextNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      if (node.parentNode.closest('script, style, .visually-hidden')) continue;
      nodes.push(node);
    }
    return nodes;
  }

  function run() {
    clearHits();

    var query = el.input.value.trim();
    if (query.length < MIN_LENGTH) return;

    var needle = query.toLowerCase();
    var regex = new RegExp('(' + escapeRegExp(query) + ')', 'gi');

    collectTextNodes(el.scope).forEach(function (node) {
      if (node.nodeValue.toLowerCase().indexOf(needle) === -1) return;

      var fragment = document.createDocumentFragment();
      node.nodeValue.split(regex).forEach(function (part) {
        if (!part) return;
        if (part.toLowerCase() === needle) {
          var mark = document.createElement('mark');
          mark.className = 'search-hit';
          mark.textContent = part;
          fragment.appendChild(mark);
          hits.push(mark);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(fragment, node);
    });

    setCount(hits.length);

    if (hits.length) {
      current = 0;
      focusHit();
    }
  }

  /* --------------------------------------------------------------------- */
  /* Navigation entre les résultats                                         */
  /* --------------------------------------------------------------------- */

  function focusHit() {
    hits.forEach(function (mark, index) {
      mark.classList.toggle('is-current', index === current);
    });

    var mark = hits[current];
    if (!mark) return;

    /* Bascule sur la page et le sous-onglet qui contiennent le résultat. */
    var view = mark.closest('.view');
    var subview = mark.closest('.subview');
    if (view) {
      NRBC.router.showView(
        view.id.replace('view-', ''),
        subview ? subview.id.replace('sub-', '') : undefined,
        { scroll: false }
      );
    }

    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setCount(hits.length, current);
  }

  function go(direction) {
    if (!hits.length) return;
    current = (current + direction + hits.length) % hits.length;
    focusHit();
  }

  /* --------------------------------------------------------------------- */
  /* Initialisation                                                         */
  /* --------------------------------------------------------------------- */

  function init() {
    el.overlay = document.getElementById('search-overlay');
    el.input   = document.getElementById('search-input');
    el.count   = document.getElementById('search-count');
    el.prev    = document.getElementById('search-prev');
    el.next    = document.getElementById('search-next');
    el.closeBtn = document.getElementById('search-close');
    el.trigger = document.getElementById('search-trigger');
    el.scope   = document.getElementById('contenu');

    if (!el.overlay || !el.input || !el.scope) return;

    el.trigger.addEventListener('click', open);
    el.closeBtn.addEventListener('click', close);
    el.next.addEventListener('click', function () { go(1); });
    el.prev.addEventListener('click', function () { go(-1); });

    /* Clic sur le fond : fermeture */
    el.overlay.addEventListener('mousedown', function (event) {
      if (event.target === el.overlay) close();
    });

    el.input.addEventListener('input', function () {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(run, 180);
    });

    el.input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (!hits.length) { run(); return; }
      go(event.shiftKey ? -1 : 1);
    });

    window.addEventListener('keydown', function (event) {
      var isFindShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f';

      if (isFindShortcut) {
        event.preventDefault();
        if (isOpen()) { el.input.focus(); el.input.select(); }
        else open();
        return;
      }

      if (event.key === 'Escape' && isOpen()) close();
    });
  }

  NRBC.search = { init: init, open: open, close: close };

})(window.NRBC = window.NRBC || {});
