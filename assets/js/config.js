/* =========================================================================
   CONFIG — Le seul fichier à modifier pour paramétrer le site
   ========================================================================= */

window.NRBC = window.NRBC || {};

window.NRBC.config = {

  /* Page affichée au chargement si l'URL ne précise rien. */
  defaultView: 'accueil',

  /* Sous-onglet ouvert par défaut pour chaque page qui en possède. */
  defaultSubs: {
    hierarchie: 'grades',
    procedure:  'bio',
    reglement:  'conduite',
    materiel:   'nucleaire'
  },

  /* -----------------------------------------------------------------------
     REGISTRE DE L'EFFECTIF (Google Sheets)
     -----------------------------------------------------------------------
     La feuille doit être partagée : Partage > Accès général >
     « Tout utilisateur disposant du lien » en LECTEUR.

     L'identifiant se lit dans l'URL de la feuille :
     https://docs.google.com/spreadsheets/d/  ICI_L_IDENTIFIANT  /edit

     range      : plage lue. La feuille commence par un titre et des
                  en-têtes fusionnés ; les vrais noms de colonnes sont en
                  ligne 5, d'où « A5:H » (jusqu'en bas de la colonne H).
                  Si tu ajoutes une colonne I, passe à « A5:I ».
     headerRows : nombre de lignes d'en-tête à l'intérieur de cette plage.

     Tant que sheetId est vide, la section affiche son message d'attente.
     --------------------------------------------------------------------- */
  effectif: {
    sheetId:    '1QJKFsmRvWvfzENbZi-m7Za8uSNOmNLoV7bydauz0D6Y',
    sheetName:  '',      // nom de l'onglet (vide = le premier onglet)
    gid:        '',      // identifiant numérique de l'onglet (prioritaire sur sheetName)
    range:      'A5:H',
    headerRows: 1,
    maxRows:    300,     // garde-fou d'affichage

    /* Couleur des cellules selon leur contenu (comparaison insensible à la
       casse). Classes disponibles : ok (vert), warn (ambre), bad (rouge),
       muted (gris). Ajoute tes propres valeurs ici au besoin. */
    badges: {
      'actif':             'ok',
      'inactif':           'bad',
      'absent':            'warn',
      'en absence':        'warn',
      'quota atteint':     'ok',
      'quota non atteint': 'warn',
      'up possible':       'ok',
      'up non possible':   'muted'
    }
  }
};
