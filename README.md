# Site NRBC — Guys Mode

Documentation interne de la division **N**ucléaire · **R**adiologique · **B**iologique · **C**himique.
Site statique : aucun serveur, aucune dépendance, aucune étape de build.

---

## Arborescence

```
nrbc-site/
├── index.html              ← toutes les pages du site (une <section class="view"> par page)
├── 404.html                ← page d'erreur
├── README.md
├── .gitignore
└── assets/
    ├── css/
    │   ├── base.css        ← variables de couleur, reset, typographie, accessibilité
    │   ├── layout.css      ← en-tête, navigation (dont menu mobile), pied de page
    │   ├── components.css  ← éléments réutilisables : onglets, tableaux, encarts, recherche
    │   └── views.css       ← styles propres à chaque page
    ├── js/
    │   ├── config.js       ← ⚙ LE SEUL FICHIER À MODIFIER pour paramétrer le site
    │   ├── router.js       ← navigation entre pages et sous-onglets + URL (#page/onglet)
    │   ├── search.js       ← moteur de recherche global (Ctrl + F)
    │   ├── effectif.js     ← registre de l'effectif lu depuis un Google Sheet
    │   └── main.js         ← démarrage
    └── img/
        ├── logo-nrbc.png    ← emblème de l'en-tête
        ├── favicon.ico      ← icône d'onglet (16/32/48 px)
        ├── favicon-180.png  ← icône écran d'accueil mobile
        ├── virus-niveau-1.svg
        ├── virus-niveau-2.svg
        └── grades/          ← emplacement prévu pour les insignes (voir LISEZ-MOI.txt)
```

---

## Utilisation en local

Ouvrir `index.html` dans un navigateur suffit — **registre de l'effectif
compris**. La lecture du Google Sheet se fait en JSONP (balise `<script>`),
la seule méthode qui passe aussi bien depuis un fichier ouvert en `file://`
que depuis un site hébergé.

> Si un jour tu remplaces ce mécanisme par `fetch()`, le registre cessera de
> fonctionner en local : le navigateur interdit à un fichier `file://`
> d'appeler un autre domaine. Il faudrait alors passer par un serveur
> (`python3 -m http.server 8080`).

---

## Mise en ligne

| Hébergeur | Marche à suivre |
|---|---|
| **GitHub Pages** | Pousser le dossier sur un dépôt → Settings → Pages → Branch `main` / dossier `/root`. |
| **Netlify / Vercel** | Glisser-déposer le dossier `nrbc-site` sur le tableau de bord. |
| **Google Sites** | Impossible d'y héberger du HTML brut : utiliser un des hébergeurs ci-dessus et intégrer le lien. |

Le site fonctionne aussi tel quel dans un sous-dossier (tous les chemins sont relatifs).

---

## Modifier le contenu

Tout le texte est dans `index.html`, chaque page repérée par un gros bandeau de
commentaire (`1 · ACCUEIL`, `3 · HIÉRARCHIE`, …).

**Ajouter une entrée au journal des nouveautés** — page Accueil, copier un bloc :

```html
<article class="news-item">
  <p class="news-date"><time datetime="2026-09-20">20/09/2026</time></p>
  <div class="news-content">
    <strong>Catégorie</strong>
    <p>Description de la modification.</p>
  </div>
</article>
```

**Ajouter un document au répertoire** — page Répertoire, copier un bloc :

```html
<a class="doc-btn" href="https://…" target="_blank" rel="noopener">
  <svg aria-hidden="true"><use href="#icon-document"></use></svg> Nom du document
</a>
```

**Ajouter un grade** — page Hiérarchie, copier un `<li class="rank-item">` entier
et adapter l'échelon, le titre, les missions et les prérequis.

**Ajouter une page entière** — trois endroits à toucher :

1. un bouton `<button class="navlink" data-view="manouvellepage">` dans le `<nav>` ;
2. une `<section class="view" id="view-manouvellepage" hidden>` dans le `<main>` ;
3. rien d'autre : le routeur détecte automatiquement la nouvelle page.

---

## Registre de l'effectif (Google Sheets)

**Déjà branché** sur la feuille « Effectif NRBC »
(`1QJKFsmRvWvfzENbZi-m7Za8uSNOmNLoV7bydauz0D6Y`). Le tableau se remplit tout
seul à l'ouverture de l'onglet Effectif, avec filtre et bouton d'actualisation.

Réglages dans `assets/js/config.js` :

```js
effectif: {
  sheetId:    '1QJKFsmRvWvfzENbZi-m7Za8uSNOmNLoV7bydauz0D6Y',
  sheetName:  '',      // vide = premier onglet
  gid:        '',      // identifiant numérique de l'onglet, prioritaire
  range:      'A5:H',  // les vrais en-têtes sont en ligne 5
  headerRows: 1,
  maxRows:    300,
  badges: { 'actif': 'ok', 'inactif': 'bad', /* … */ }
}
```

**À savoir**

- La feuille doit rester partagée en **Lecteur** pour « tout utilisateur
  disposant du lien ». Si le partage est retiré, la section affiche
  « Registre indisponible » sans casser le reste du site.
- `range: 'A5:H'` saute le titre et les en-têtes fusionnés de la feuille.
  Si tu ajoutes une colonne I, passe à `'A5:I'`. Si tu insères des lignes
  au-dessus des en-têtes, décale le 5.
- `badges` colore les cellules selon leur contenu : `ok` vert, `warn` ambre,
  `bad` rouge, `muted` gris. Ajoute tes propres valeurs (comparaison
  insensible à la casse), par exemple `'en formation': 'warn'`.
- Les nombres gardent le format de la feuille (« 39 j » et non « 39 »).
- Le filtre cherche dans toutes les colonnes ; la recherche globale
  (Ctrl + F) trouve aussi les noms du registre une fois celui-ci chargé.
- Les colonnes sans nom **et** entièrement vides sont ignorées à l'affichage.

**Si le tableau ne se charge pas**

| Message affiché | Cause probable |
|---|---|
| « pas de réponse — la feuille est-elle partagée en lecture ? » | Partage retiré, ou la feuille répond une page de connexion |
| « Google Sheets est injoignable » | Pas de connexion, ou un bloqueur/antivirus filtre `docs.google.com` |
| « Sorry… » (message de Google) | La feuille refuse l'accès : revoir le partage |
| « réponse illisible » | `range` ou `gid` invalide dans `config.js` |

---

## Raccourcis

| Raccourci | Action |
|---|---|
| `Ctrl + F` / `Cmd + F` | Ouvre la recherche interne (toutes les pages, même masquées) |
| `Entrée` | Résultat suivant |
| `Maj + Entrée` | Résultat précédent |
| `Échap` | Ferme la recherche ou le menu mobile |

---

## Ce qui a été corrigé par rapport à l'ancienne version

**Bugs**

- Le moteur de recherche plantait : il cherchait six éléments (`#search-modal`,
  `#search-input`, …) qui n'existaient nulle part dans le HTML, et appelait une
  fonction `switchView()` inexistante. La modale, le CSS de surlignage et la
  navigation entre résultats ont été écrits.
- Trois `<div class="news-list">` ouverts et jamais fermés dans le journal des
  nouveautés (imbrication en cascade).
- Des `<h4>` et des `<br>` placés directement dans des `<ul>` (HTML invalide) :
  les prérequis d'échelon sont désormais un bloc `.rank-prereq` à part.
- Le menu disparaissait complètement sous 900 px (`nav { display: none }`) :
  le site était inutilisable sur téléphone. Remplacé par un vrai menu déroulant.
- Les photos de grades étaient enveloppées dans un lien vers la page d'accueil
  d'imgbb, avec l'attribut obsolète `border="0"`.
- La règle `.rank-photo img` était écrite deux fois à l'identique.

**Structure**

- CSS découpé en quatre fichiers thématiques, JavaScript en cinq modules.
- Les deux images « Virus / Vaccin » étaient encodées en base64 dans le HTML
  (≈ 6 000 caractères) : extraites en vrais fichiers SVG.
- Les icônes répétées (nucléaire, radiologique, biologie, chimie, document)
  sont définies une seule fois et réutilisées via `<use>`.
- L'URL suit la navigation (`#procedure/radio`) : un rafraîchissement ou un lien
  partagé retombe sur la bonne page.

**Accessibilité et sémantique**

- Boutons de navigation en `<button>` (navigables au clavier) au lieu de `<div>`.
- Un seul `<h1>` par page, hiérarchie de titres cohérente, `role="tablist"` sur
  les onglets, lien d'évitement, `caption` et `scope` sur les tableaux.
- `prefers-reduced-motion` respecté globalement.

**Orthographe** (corrections mineures dans le texte)

- « dénigration » → « dénigrement »
- « Désinfection du matériel réguliers et personnel » → « Désinfection régulière du matériel et du personnel »
- « EPI version Bêta recommandée » → « recommandé »
- « Distribution des équipement » → « des équipements »
- « liste des pathogène » → « pathogènes »

---

## Revenir sur Google Apps Script ?

L'ancien site tournait sur Apps Script (`doGet` + `HtmlService`). Si besoin, le
contenu de `index.html` peut y être recollé tel quel, à condition de réinjecter
le CSS et le JS dans la page (Apps Script ne sert pas de fichiers statiques) ou
d'utiliser des fichiers `.html` inclus via `<?!= include('nom') ?>`.

---

Créé par Shin R. · Modifier par Pierre Pic · Édité par Shin R. et Pierre Pic
