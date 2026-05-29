/**
 * formulaire.js — La Sonnette · Boîte à idées
 * ═══════════════════════════════════════════════════════════════════
 *
 * Responsabilités :
 *  - Validation côté client avant soumission
 *  - Envoi de l'idée à Formspree (→ email reçu par Jean & Sandrine)
 *
 * SÉCURITÉ :
 *  - Pas d'innerHTML avec des données utilisateur → textContent uniquement
 */

'use strict';


/* ─────────────────────────────────────────────────────────────────
   CONFIGURATION
   ───────────────────────────────────────────────────────────────── */

/** Endpoint Formspree : chaque soumission envoie un email au propriétaire du compte. */
const URL_FORMSPREE = 'https://formspree.io/f/xnjrwvka';

const REGLES_VALIDATION = {
  nom: {
    longueurMax: 100,
    pattern: /^[^<>&"]{1,100}$/,
    messageVide: 'Ce champ est obligatoire.',
    messageTropLong: 'Maximum 100 caractères.',
    messageInvalide: 'Caractères non autorisés.',
  },
  description: {
    longueurMax: 500,
    pattern: /^[^<>&"]{1,500}$/,
    messageVide: 'Ce champ est obligatoire.',
    messageTropLong: 'Maximum 500 caractères.',
    messageInvalide: 'Caractères non autorisés.',
  },
  pseudo: {
    longueurMax: 50,
    pattern: /^[^<>&"]{0,50}$/,
    messageTropLong: 'Maximum 50 caractères.',
    messageInvalide: 'Caractères non autorisés.',
  },
};

const LABELS_TYPE = {
  lieu: '🍺 Lieu',
  evenement: '🎉 Événement',
};


/* ─────────────────────────────────────────────────────────────────
   VALIDATION
   ───────────────────────────────────────────────────────────────── */

function afficherErreurChamp(champ, message) {
  champ.classList.add('en-erreur');
  champ.setAttribute('aria-invalid', 'true');
  const erreur = champ.closest('.formulaire__champ')?.querySelector('.formulaire__erreur');
  if (erreur) erreur.textContent = message;
}

function effacerErreurChamp(champ) {
  champ.classList.remove('en-erreur');
  champ.setAttribute('aria-invalid', 'false');
  const erreur = champ.closest('.formulaire__champ')?.querySelector('.formulaire__erreur');
  if (erreur) erreur.textContent = '';
}

function effacerToutesLesErreurs(formulaire) {
  formulaire.querySelectorAll('.en-erreur').forEach(effacerErreurChamp);
}

function validerChamp(champ, nomChamp, obligatoire = true) {
  const regles = REGLES_VALIDATION[nomChamp];
  if (!regles) return true;
  const valeur = champ.value.trim();
  if (!valeur && obligatoire) { afficherErreurChamp(champ, regles.messageVide); return false; }
  if (valeur.length > regles.longueurMax) { afficherErreurChamp(champ, regles.messageTropLong); return false; }
  if (valeur && regles.pattern && !regles.pattern.test(valeur)) { afficherErreurChamp(champ, regles.messageInvalide); return false; }
  effacerErreurChamp(champ);
  return true;
}

function validerFormulaire(formulaire) {
  const champNom         = formulaire.querySelector('#champ-nom-lieu');
  const champDescription = formulaire.querySelector('#champ-description');
  const champPseudo      = formulaire.querySelector('#champ-pseudo');

  // On stocke chaque résultat AVANT de les combiner pour que les 3 champs
  // affichent leurs erreurs même si le premier est déjà invalide.
  const nomValide         = validerChamp(champNom, 'nom', true);
  const descriptionValide = validerChamp(champDescription, 'description', true);
  const pseudoValide      = validerChamp(champPseudo, 'pseudo', false);

  return nomValide && descriptionValide && pseudoValide;
}


/* ─────────────────────────────────────────────────────────────────
   SOUMISSION DU FORMULAIRE
   ───────────────────────────────────────────────────────────────── */

function etatChargementBouton(bouton, enChargement) {
  if (enChargement) {
    bouton.dataset.texteOriginal = bouton.textContent;
    bouton.textContent = 'Envoi en cours…';
    bouton.disabled = true;
  } else {
    bouton.textContent = bouton.dataset.texteOriginal ?? "Envoyer l'idée 🚀";
    bouton.disabled = false;
  }
}

async function traiterSoumission(formulaire) {
  const boutonEnvoi     = formulaire.querySelector('#bouton-envoi');
  const divConfirmation = formulaire.querySelector('#confirmation-envoi');

  if (boutonEnvoi) etatChargementBouton(boutonEnvoi, true);

  const idee = {
    type:        formulaire.querySelector('input[name="type_idee"]:checked')?.value ?? 'lieu',
    nom:         formulaire.querySelector('#champ-nom-lieu').value.trim(),
    description: formulaire.querySelector('#champ-description').value.trim(),
    pseudo:      formulaire.querySelector('#champ-pseudo').value.trim(),
  };

  // Envoi à Formspree → Jean & Sandrine reçoivent un email.
  try {
    const reponse = await fetch(URL_FORMSPREE, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type:        LABELS_TYPE[idee.type] ?? idee.type,
        nom:         idee.nom,
        description: idee.description,
        pseudo:      idee.pseudo || 'Anonyme',
      }),
    });

    if (!reponse.ok) {
      console.warn('Formspree : échec de l\'envoi (statut', reponse.status, ')');
    }
  } catch (erreurReseau) {
    console.warn('Formspree : erreur réseau —', erreurReseau.message);
  }

  formulaire.reset();

  if (divConfirmation) {
    divConfirmation.hidden = false;
    divConfirmation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { divConfirmation.hidden = true; }, 4000);
  }

  if (boutonEnvoi) etatChargementBouton(boutonEnvoi, false);
}


/* ─────────────────────────────────────────────────────────────────
   VALIDATION EN TEMPS RÉEL
   ───────────────────────────────────────────────────────────────── */

function initialiserValidationTempsReel(formulaire) {
  const champsAValider = [
    { element: formulaire.querySelector('#champ-nom-lieu'),    nom: 'nom',         obligatoire: true  },
    { element: formulaire.querySelector('#champ-description'), nom: 'description', obligatoire: true  },
    { element: formulaire.querySelector('#champ-pseudo'),      nom: 'pseudo',      obligatoire: false },
  ];

  champsAValider.forEach(({ element, nom, obligatoire }) => {
    if (!element) return;
    element.addEventListener('blur',  () => { if (element.value.length > 0 || obligatoire) validerChamp(element, nom, obligatoire); });
    element.addEventListener('input', () => { if (element.classList.contains('en-erreur')) effacerErreurChamp(element); });
  });
}


/* ─────────────────────────────────────────────────────────────────
   INITIALISATION
   ───────────────────────────────────────────────────────────────── */

function initialiserFormulaire() {
  const formulaire = document.getElementById('formulaire-idees');
  if (!formulaire) return;

  initialiserValidationTempsReel(formulaire);

  formulaire.addEventListener('submit', async (e) => {
    e.preventDefault();
    effacerToutesLesErreurs(formulaire);

    if (!validerFormulaire(formulaire)) {
      formulaire.querySelector('.en-erreur')?.focus();
      return;
    }

    await traiterSoumission(formulaire);
  });
}

document.addEventListener('DOMContentLoaded', initialiserFormulaire);
