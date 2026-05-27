/**
 * formulaire.js — La Sonnette · Boîte à idées
 * ═══════════════════════════════════════════════════════════════════
 *
 * Responsabilités :
 *  - Validation côté client avant envoi
 *  - Envoi asynchrone via fetch() vers Formspree
 *  - Affichage des messages de confirmation / erreur
 *  - Réinitialisation du formulaire après succès
 *
 * SÉCURITÉ :
 *  - Validation stricte : longueur, caractères autorisés
 *  - Les données ne sont JAMAIS injectées dans le DOM via innerHTML
 *  - Le pseudo est optionnel et limité en taille
 *  - Honeypot anti-spam (champ caché dans le HTML)
 *  - L'URL Formspree doit être configurée dans le HTML (pas en JS)
 *    pour éviter toute modification côté client
 *  - Pas de token ni secret dans ce fichier
 *
 * NOTE IMPORTANTE :
 *  Remplacer VOTRE_ID_FORMSPREE dans index.html par l'ID réel
 *  obtenu après inscription sur https://formspree.io
 */

'use strict';


/* ─────────────────────────────────────────────────────────────────
   CONFIGURATION DE LA VALIDATION
   On centralise les règles pour faciliter la maintenance.
   ───────────────────────────────────────────────────────────────── */
const REGLES_VALIDATION = {
  nom: {
    longueurMax: 100,
    // Autorise lettres, chiffres, espaces, tirets, apostrophes, guillemets
    // Interdit les caractères HTML dangereux
    pattern: /^[^<>&"]{1,100}$/,
    messageVide: 'Ce champ est obligatoire.',
    messageTropLong: 'Maximum 100 caractères.',
    messageInvalide: 'Ce champ contient des caractères non autorisés.',
  },
  description: {
    longueurMax: 500,
    pattern: /^[^<>&"]{1,500}$/,
    messageVide: 'Ce champ est obligatoire.',
    messageTropLong: 'Maximum 500 caractères.',
    messageInvalide: 'Ce champ contient des caractères non autorisés.',
  },
  pseudo: {
    longueurMax: 50,
    // Facultatif, donc peut être vide
    pattern: /^[^<>&"]{0,50}$/,
    messageTropLong: 'Maximum 50 caractères.',
    messageInvalide: 'Ce champ contient des caractères non autorisés.',
  },
};


/* ─────────────────────────────────────────────────────────────────
   AFFICHAGE DES ERREURS
   On affiche/efface les messages d'erreur de façon accessible.
   ───────────────────────────────────────────────────────────────── */

/**
 * Affiche un message d'erreur sous un champ.
 * @param {HTMLElement} champ - L'input ou textarea
 * @param {string} message - Le message d'erreur
 */
function afficherErreurChamp(champ, message) {
  champ.classList.add('en-erreur');
  champ.setAttribute('aria-invalid', 'true');

  // L'élément d'erreur est le prochain .formulaire__erreur après le champ
  const conteneurChamp = champ.closest('.formulaire__champ');
  const elementErreur = conteneurChamp?.querySelector('.formulaire__erreur');

  if (elementErreur) {
    // On utilise textContent, JAMAIS innerHTML (sécurité)
    elementErreur.textContent = message;
  }
}

/**
 * Efface le message d'erreur d'un champ.
 * @param {HTMLElement} champ
 */
function effacerErreurChamp(champ) {
  champ.classList.remove('en-erreur');
  champ.setAttribute('aria-invalid', 'false');

  const conteneurChamp = champ.closest('.formulaire__champ');
  const elementErreur = conteneurChamp?.querySelector('.formulaire__erreur');

  if (elementErreur) {
    elementErreur.textContent = '';
  }
}

/**
 * Efface toutes les erreurs du formulaire.
 * @param {HTMLFormElement} formulaire
 */
function effacerToutesLesErreurs(formulaire) {
  formulaire.querySelectorAll('.en-erreur').forEach(champ => {
    effacerErreurChamp(champ);
  });
}


/* ─────────────────────────────────────────────────────────────────
   VALIDATION
   ───────────────────────────────────────────────────────────────── */

/**
 * Valide un champ selon les règles définies dans REGLES_VALIDATION.
 * @param {HTMLElement} champ - L'input ou textarea à valider
 * @param {string} nomChamp - Clé dans REGLES_VALIDATION
 * @param {boolean} [obligatoire=true]
 * @returns {boolean} true si valide
 */
function validerChamp(champ, nomChamp, obligatoire = true) {
  const regles = REGLES_VALIDATION[nomChamp];
  if (!regles) return true; // Pas de règle = on laisse passer

  const valeur = champ.value.trim();

  // Vérification : champ vide
  if (!valeur && obligatoire) {
    afficherErreurChamp(champ, regles.messageVide);
    return false;
  }

  // Vérification : trop long
  if (valeur.length > regles.longueurMax) {
    afficherErreurChamp(champ, regles.messageTropLong);
    return false;
  }

  // Vérification : caractères autorisés (si la valeur n'est pas vide)
  if (valeur && regles.pattern && !regles.pattern.test(valeur)) {
    afficherErreurChamp(champ, regles.messageInvalide);
    return false;
  }

  // Tout est bon
  effacerErreurChamp(champ);
  return true;
}

/**
 * Valide l'ensemble du formulaire.
 * @param {HTMLFormElement} formulaire
 * @returns {boolean} true si tous les champs sont valides
 */
function validerFormulaire(formulaire) {
  const champNom         = formulaire.querySelector('#champ-nom-lieu');
  const champDescription = formulaire.querySelector('#champ-description');
  const champPseudo      = formulaire.querySelector('#champ-pseudo');

  // On valide tous les champs (pour afficher toutes les erreurs d'un coup)
  const nomValide         = validerChamp(champNom, 'nom', true);
  const descriptionValide = validerChamp(champDescription, 'description', true);
  const pseudoValide      = validerChamp(champPseudo, 'pseudo', false);

  // Le formulaire est valide si tous les champs le sont
  return nomValide && descriptionValide && pseudoValide;
}


/* ─────────────────────────────────────────────────────────────────
   ENVOI DU FORMULAIRE
   Envoi asynchrone via fetch() vers Formspree.
   En cas de succès : message de confirmation.
   En cas d'erreur réseau : message d'erreur avec suggestion de fallback.
   ───────────────────────────────────────────────────────────────── */

/**
 * Gère l'état de chargement du bouton d'envoi.
 * @param {HTMLButtonElement} bouton
 * @param {boolean} enChargement
 */
function etatChargementBouton(bouton, enChargement) {
  if (enChargement) {
    bouton.disabled = true;
    // On sauvegarde le texte original pour le restaurer
    bouton.dataset.texteOriginal = bouton.textContent;
    bouton.textContent = 'Envoi en cours…';
  } else {
    bouton.disabled = false;
    bouton.textContent = bouton.dataset.texteOriginal || 'Envoyer l\'idée 🚀';
  }
}

/**
 * Envoie le formulaire vers Formspree via fetch().
 * @param {HTMLFormElement} formulaire
 */
async function envoyerFormulaire(formulaire) {
  const boutonEnvoi       = formulaire.querySelector('#bouton-envoi');
  const divConfirmation   = formulaire.querySelector('#confirmation-envoi');
  const divErreur         = formulaire.querySelector('#erreur-envoi');

  // Cacher les messages précédents
  if (divConfirmation) divConfirmation.hidden = true;
  if (divErreur)       divErreur.hidden = true;

  // Passer le bouton en état de chargement
  if (boutonEnvoi) etatChargementBouton(boutonEnvoi, true);

  try {
    const donnees = new FormData(formulaire);

    const reponse = await fetch(formulaire.action, {
      method: 'POST',
      body: donnees,
      headers: {
        // Formspree attend ce header pour répondre en JSON
        'Accept': 'application/json',
      },
    });

    if (reponse.ok) {
      // Succès : afficher la confirmation et réinitialiser
      if (divConfirmation) divConfirmation.hidden = false;
      formulaire.reset();

      // Scroll doux vers le message de confirmation
      divConfirmation?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // Erreur serveur (Formspree a répondu mais avec une erreur)
      if (divErreur) divErreur.hidden = false;
    }

  } catch (erreurReseau) {
    // Erreur réseau (pas de connexion, timeout, etc.)
    console.error('Erreur lors de l\'envoi du formulaire :', erreurReseau);
    if (divErreur) divErreur.hidden = false;

  } finally {
    // Dans tous les cas, réactiver le bouton
    if (boutonEnvoi) etatChargementBouton(boutonEnvoi, false);
  }
}


/* ─────────────────────────────────────────────────────────────────
   VALIDATION EN TEMPS RÉEL
   On valide à la sortie du champ (blur) pour un retour immédiat.
   ───────────────────────────────────────────────────────────────── */

/**
 * Active la validation en temps réel sur les champs du formulaire.
 * @param {HTMLFormElement} formulaire
 */
function initialiserValidationTempsReel(formulaire) {
  const champsAValider = [
    { element: formulaire.querySelector('#champ-nom-lieu'), nom: 'nom', obligatoire: true },
    { element: formulaire.querySelector('#champ-description'), nom: 'description', obligatoire: true },
    { element: formulaire.querySelector('#champ-pseudo'), nom: 'pseudo', obligatoire: false },
  ];

  champsAValider.forEach(({ element, nom, obligatoire }) => {
    if (!element) return;

    // Validation à la perte de focus
    element.addEventListener('blur', () => {
      // On ne valide que si le champ a été touché
      if (element.value.length > 0 || obligatoire) {
        validerChamp(element, nom, obligatoire);
      }
    });

    // Effacement de l'erreur à la saisie
    element.addEventListener('input', () => {
      if (element.classList.contains('en-erreur')) {
        effacerErreurChamp(element);
      }
    });
  });
}


/* ─────────────────────────────────────────────────────────────────
   INITIALISATION
   ───────────────────────────────────────────────────────────────── */

/**
 * Initialise le comportement du formulaire boîte à idées.
 */
function initialiserFormulaire() {
  const formulaire = document.getElementById('formulaire-idees');
  if (!formulaire) return;

  // Validation en temps réel
  initialiserValidationTempsReel(formulaire);

  // Gestion de la soumission
  formulaire.addEventListener('submit', async (evenement) => {
    // On empêche la soumission HTML native
    evenement.preventDefault();

    // Effacer les erreurs précédentes
    effacerToutesLesErreurs(formulaire);

    // Valider avant d'envoyer
    const formulaireValide = validerFormulaire(formulaire);

    if (!formulaireValide) {
      // Donner le focus au premier champ en erreur
      const premierChampEnErreur = formulaire.querySelector('.en-erreur');
      premierChampEnErreur?.focus();
      return;
    }

    // Tout est bon : on envoie
    await envoyerFormulaire(formulaire);
  });
}

document.addEventListener('DOMContentLoaded', initialiserFormulaire);
