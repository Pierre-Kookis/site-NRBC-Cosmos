/* =========================================================================
   EFFECTIF — Registre alimenté par un Google Sheet
   ---------------------------------------------------------------------------
   Lit la feuille via l'API « gviz » de Google (aucune clé d'API, aucun
   serveur nécessaire). La feuille doit simplement être partagée en lecture
   à toute personne disposant du lien.

   La réponse est récupérée en JSONP (balise <script> + fonction de rappel)
   et non avec fetch() : c'est la seule méthode qui fonctionne aussi bien
   sur un site hébergé que sur un fichier index.html ouvert en local
   (un fichier ouvert en file:// n'a pas le droit de faire un fetch
   vers un autre domaine — le navigateur le bloque avant l'envoi).

   Paramétrage : assets/js/config.js → NRBC.config.effectif
   ========================================================================= */

(function (NRBC) {
  'use strict';

  var settings = (NRBC.config && NRBC.config.effectif) || {};
  var el = {};
  var rows = [];
  var headers = [];
  var loaded = false;
  var counter = 0;

  /* --------------------------------------------------------------------- */
  /* Construction de l'URL                                                  */
  /* --------------------------------------------------------------------- */

  function buildUrl(handlerName) {
    var url = 'https://docs.google.com/spreadsheets/d/' + settings.sheetId +
              '/gviz/tq?tqx=out:json;responseHandler:' + handlerName;

    if (settings.gid) url += '&gid=' + encodeURIComponent(settings.gid);
    else if (settings.sheetName) url += '&sheet=' + encodeURIComponent(settings.sheetName);

    if (settings.range) url += '&range=' + encodeURIComponent(settings.range);
    if (settings.headerRows) url += '&headers=' + encodeURIComponent(settings.headerRows);

    url += '&_=' + Date.now();   /* évite une réponse mise en cache */
    return url;
  }

  /* --------------------------------------------------------------------- */
  /* Requête JSONP                                                          */
  /* --------------------------------------------------------------------- */

  function request(done) {
    var name = 'NRBC_gviz_' + (++counter) + '_' + Date.now();
    var script = document.createElement('script');
    var finished = false;
    var timer;

    function cleanup() {
      finished = true;
      window.clearTimeout(timer);
      try { delete window[name]; } catch (e) { window[name] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[name] = function (payload) {
      if (finished) return;
      cleanup();
      done(null, payload);
    };

    script.onerror = function () {
      if (finished) return;
      cleanup();
      done(new Error('Google Sheets est injoignable (connexion ?)'));
    };

    timer = window.setTimeout(function () {
      if (finished) return;
      cleanup();
      done(new Error('pas de réponse — la feuille est-elle partagée en lecture ?'));
    }, settings.timeoutMs || 15000);

    script.src = buildUrl(name);
    (document.head || document.documentElement).appendChild(script);
  }

  /* --------------------------------------------------------------------- */
  /* Lecture de la réponse gviz                                             */
  /* --------------------------------------------------------------------- */

  function parseResponse(payload) {
    if (!payload) throw new Error('réponse illisible');

    if (payload.status === 'error') {
      var first = (payload.errors && payload.errors[0]) || {};
      var reason = first.detailed_message || first.message || 'accès refusé';
      reason = reason.replace(/<[^>]*>/g, '').trim();
      throw new Error(reason.length > 120 ? reason.slice(0, 120) + '…' : reason);
    }

    if (!payload.table) throw new Error('réponse illisible');

    var table = payload.table;
    var cols = table.cols || [];
    var data = table.rows || [];

    var labels = cols.map(function (col) {
      return col.label ? col.label.trim() : '';
    });

    /* Si aucune colonne n'est nommée, la 1re ligne de données sert d'en-tête. */
    if (labels.every(function (label) { return !label; }) && data.length) {
      labels = (data[0].c || []).map(cellValue);
      data = data.slice(1);
    }

    var table2d = data.map(function (row) { return (row.c || []).map(cellValue); });

    /* Colonnes de mise en page (sans nom et sans contenu) : on les écarte. */
    var keep = labels.map(function (label, index) {
      if (label) return true;
      return table2d.some(function (cells) { return (cells[index] || '') !== ''; });
    });

    headers = labels.filter(function (_, index) { return keep[index]; })
                    .map(function (label, index) { return label || String.fromCharCode(65 + index); });

    rows = table2d
      .map(function (cells) { return cells.filter(function (_, index) { return keep[index]; }); })
      .filter(function (cells) {
        return cells.some(function (value) { return value !== ''; });
      })
      .slice(0, settings.maxRows || 300);
  }

  /** Classe CSS associée au contenu d'une cellule (voir config.effectif.badges). */
  function badgeClass(value) {
    var badges = settings.badges || {};
    var key = String(value).trim().toLowerCase();
    return badges[key] ? 'cell-' + badges[key] : '';
  }

  function cellValue(cell) {
    if (!cell) return '';
    if (cell.f) return String(cell.f);
    if (cell.v === null || cell.v === undefined) return '';
    return String(cell.v);
  }

  /* --------------------------------------------------------------------- */
  /* Rendu                                                                  */
  /* --------------------------------------------------------------------- */

  function render(filter) {
    var needle = (filter || '').trim().toLowerCase();
    var visible = needle
      ? rows.filter(function (cells) {
          return cells.join(' ').toLowerCase().indexOf(needle) !== -1;
        })
      : rows;

    var thead = el.table.querySelector('thead');
    var tbody = el.table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    var headRow = document.createElement('tr');
    headers.forEach(function (label) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    visible.forEach(function (cells) {
      var tr = document.createElement('tr');
      headers.forEach(function (_, index) {
        var value = cells[index] || '';
        var cell;
        if (index === 0) {
          cell = document.createElement('th');
          cell.scope = 'row';
        } else {
          cell = document.createElement('td');
          var classes = [];
          if (value.length > 24) classes.push('is-text');
          var badge = badgeClass(value);
          if (badge) classes.push(badge);
          if (classes.length) cell.className = classes.join(' ');
        }
        cell.textContent = value;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    el.tableWrap.hidden = false;
    el.placeholder.hidden = true;
    el.filter.hidden = false;

    el.status.classList.remove('is-error');
    el.status.textContent = needle
      ? visible.length + ' résultat' + (visible.length > 1 ? 's' : '') + ' sur ' + rows.length
      : rows.length + ' membre' + (rows.length > 1 ? 's' : '') + ' au registre';
  }

  function fail(message) {
    el.status.classList.add('is-error');
    el.status.textContent = 'Registre indisponible — ' + message;
    el.tableWrap.hidden = true;
    el.placeholder.hidden = false;
  }

  /* --------------------------------------------------------------------- */
  /* Chargement                                                             */
  /* --------------------------------------------------------------------- */

  function load(force) {
    if (loaded && !force) return;

    if (!settings.sheetId) {
      el.status.textContent = 'Registre non configuré.';
      el.placeholder.hidden = false;
      return;
    }

    loaded = true;
    el.status.classList.remove('is-error');
    el.status.textContent = 'Chargement du registre…';
    if (el.refresh) el.refresh.disabled = true;

    request(function (error, payload) {
      if (el.refresh) el.refresh.disabled = false;

      if (error) {
        loaded = false;
        fail(error.message);
        return;
      }

      try {
        parseResponse(payload);
      } catch (parseError) {
        loaded = false;
        fail(parseError.message || 'erreur inconnue');
        return;
      }

      if (!rows.length) {
        el.status.textContent = 'Le registre est vide.';
        return;
      }
      render(el.filter.value || '');
    });
  }

  /* --------------------------------------------------------------------- */
  /* Initialisation                                                         */
  /* --------------------------------------------------------------------- */

  function init() {
    el.status      = document.getElementById('effectif-status');
    el.filter      = document.getElementById('effectif-filter');
    el.tableWrap   = document.getElementById('effectif-table-wrap');
    el.table       = document.getElementById('effectif-table');
    el.placeholder = document.getElementById('effectif-placeholder');
    el.refresh     = document.getElementById('effectif-refresh');

    if (!el.status || !el.table) return;

    el.filter.addEventListener('input', function () {
      if (rows.length) render(el.filter.value);
    });

    if (el.refresh) {
      el.refresh.addEventListener('click', function () { load(true); });
    }

    /* Chargement différé : uniquement quand l'onglet Effectif est ouvert. */
    document.addEventListener('nrbc:subview', function (event) {
      if (event.detail.view === 'hierarchie' && event.detail.sub === 'effectif') load();
    });
  }

  NRBC.effectif = { init: init, load: load };

})(window.NRBC = window.NRBC || {});
