/* Petit Piano — réglages de la synchronisation entre téléphones (DESIGN §9).
 * La clé d'API Firebase est publique par nature : la sécurité est dans les règles
 * Firestore (collection « familles », clés v / profiles / updatedAt uniquement).
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  PP.SYNC_CONFIG = {
    apiKey: 'AIzaSyB7alhfGFXrRiu7fTunWEg5LeCnsr045o4',
    projectId: 'petit-piano',
    collection: 'familles',
    docVersion: 1,                     // version du format du document distant (§9.9)
    timeoutMs: 10000,                  // délai max d'une requête
    retryPauses: [300, 1000, 2000],    // pauses entre essais en cas de conflit d'écriture (§9.7 étape 7)
    debounceMs: 3000,                  // anti-rebond après une leçon ou un changement parent
    errorRetryMs: 60000,               // après un échec (hors ligne, erreur) : nouvel essai 1 min plus tard
    visibleMinGapMs: 30000,            // retour dans l'appli : pas de synchro si la dernière a < 30 s
    startDelayMs: 500                  // démarrage : après le 1er affichage
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PP.SYNC_CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
