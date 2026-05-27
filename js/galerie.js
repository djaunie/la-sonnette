/**
 * galerie.js — La Sonnette · Galerie photos
 * ═══════════════════════════════════════════════════════════════════
 *
 * Responsabilités :
 *  1. Filtre des photos par catégorie (Tous / Afterwork / Secret Santa / Photobooth)
 *  2. Lightbox : agrandissement des photos au clic
 *     - Navigation précédent / suivant
 *     - Fermeture par Échap ou clic sur le fond
 *     - Piège de focus pour l'accessibilité
 *     - Navigation clavier (flèches)
 *
 * SÉCURITÉ :
 *  - Le contenu des médias est injecté via createElement (jamais innerHTML)
 *  - Les légendes sont insérées via textContent (jamais innerHTML)
 *  - On vérifie l'existence des éléments avant toute opération
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   ÉTAT DE LA GALERIE
   On centralise l'état pour éviter les variables globales éparpillées.
   ───────────────────────────────────────────────────────────────── */
const etatGalerie = {
  /** @type {Element[]} Tous les items de la galerie */
  tousLesItems: [],

  /** @type {Element[]} Items actuellement visibles (après filtre) */
  itemsVisibles: [],

  /** @type {number} Index de la photo ouverte dans la lightbox */
  indexActuel: 0,
};

/**
 * Élément qui avait le focus avant l'ouverture de la lightbox.
 * On le mémorise pour rendre le focus au bon endroit à la fermeture
 * (bonne pratique d'accessibilité clavier).
 *
 * IMPORTANT : cette variable DOIT être déclarée avant ouvrirLightbox(),
 * car les déclarations `let` ne sont pas remontées (hoisting). Si on la
 * déclarait plus bas, ouvrirLightbox() planterait avec une ReferenceError
 * (zone morte temporelle) et la photo ne s'agrandirait jamais.
 * @type {Element|null}
 */
let foyerAvant = null;


/* ─────────────────────────────────────────────────────────────────
   1. FILTRE PAR CATÉGORIE
   Affiche/masque les items selon leur data-categorie.
   ───────────────────────────────────────────────────────────────── */

/**
 * Applique un filtre à la galerie.
 * @param {string} categorie - 'tous' ou une catégorie ('afterwork', etc.)
 */
function appliquerFiltre(categorie) {
  etatGalerie.itemsVisibles = [];

  etatGalerie.tousLesItems.forEach(item => {
    const categorieItem = item.dataset.categorie;
    const doitEtreVisible = (categorie === 'tous') || (categorieItem === categorie);

    if (doitEtreVisible) {
      // Affiche l'item avec animation d'entrée
      item.removeAttribute('hidden');
      item.classList.add('entree-filtre');

      // Retire la classe d'animation après qu'elle soit jouée
      // (pour qu'elle se rejoue si on refiltre)
      setTimeout(() => item.classList.remove('entree-filtre'), 400);

      etatGalerie.itemsVisibles.push(item);
    } else {
      // Cache l'item
      item.setAttribute('hidden', '');
    }
  });
}

/**
 * Initialise les boutons de filtre.
 */
function initialiserFiltres() {
  const boutonsFiltres = document.querySelectorAll('.filtre');
  const grille = document.getElementById('grille-galerie');

  if (!grille || !boutonsFiltres.length) return;

  // Récupère tous les items de la galerie
  etatGalerie.tousLesItems = Array.from(
    grille.querySelectorAll('.galerie__item')
  );
  // Par défaut, tous sont visibles
  etatGalerie.itemsVisibles = [...etatGalerie.tousLesItems];

  boutonsFiltres.forEach(bouton => {
    bouton.addEventListener('click', () => {
      const filtreChoisi = bouton.dataset.filtre;

      // Mettre à jour l'état actif des boutons
      boutonsFiltres.forEach(btn => {
        btn.classList.remove('actif');
        btn.setAttribute('aria-pressed', 'false');
      });
      bouton.classList.add('actif');
      bouton.setAttribute('aria-pressed', 'true');

      // Appliquer le filtre
      appliquerFiltre(filtreChoisi);
    });
  });
}


/* ─────────────────────────────────────────────────────────────────
   2. LIGHTBOX
   Modale pour afficher les photos en grand.
   ───────────────────────────────────────────────────────────────── */

/** Éléments du DOM de la lightbox */
const domLightbox = {
  get boite()    { return document.getElementById('lightbox'); },
  get fond()     { return document.getElementById('lightbox-fond'); },
  get media()    { return document.getElementById('lightbox-media'); },
  get legende()  { return document.getElementById('lightbox-legende'); },
  get fermer()   { return document.getElementById('lightbox-fermer'); },
  get suivant()  { return document.getElementById('lightbox-suivant'); },
  get precedent(){ return document.getElementById('lightbox-precedent'); },
};

/**
 * Ouvre la lightbox sur un item donné.
 * @param {number} index - Index de l'item dans etatGalerie.itemsVisibles
 */
function ouvrirLightbox(index) {
  if (!domLightbox.boite || !domLightbox.fond) return;
  if (index < 0 || index >= etatGalerie.itemsVisibles.length) return;

  etatGalerie.indexActuel = index;

  // Mémoriser l'élément focalisé avant l'ouverture
  foyerAvant = document.activeElement;

  // Charger le média dans la lightbox
  chargerMediaLightbox(index);

  // Afficher la lightbox
  domLightbox.boite.removeAttribute('hidden');
  domLightbox.fond.removeAttribute('hidden');

  // Empêcher le scroll de la page derrière
  document.body.style.overflow = 'hidden';

  // Donner le focus au bouton de fermeture (accessibilité)
  domLightbox.fermer?.focus();
}

/**
 * Charge le média (image ou vidéo) dans la lightbox.
 * SÉCURITÉ : On utilise createElement au lieu de innerHTML
 * pour éviter tout risque d'injection.
 * @param {number} index - Index dans etatGalerie.itemsVisibles
 */
function chargerMediaLightbox(index) {
  const item = etatGalerie.itemsVisibles[index];
  if (!item || !domLightbox.media) return;

  // Vider le contenu précédent
  domLightbox.media.innerHTML = '';

  // Récupérer les données de l'image depuis l'item de la galerie
  const imageSource = item.querySelector('img');

  if (imageSource) {
    // Créer un élément image proprement (jamais via innerHTML)
    const image = document.createElement('img');
    image.src = imageSource.src;
    image.alt = imageSource.alt;
    // Taille explicite pour éviter le reflow
    image.style.maxWidth = '90vw';
    image.style.maxHeight = '75vh';

    domLightbox.media.appendChild(image);
  }

  // Mettre à jour la légende via textContent (jamais innerHTML)
  const legendeSource = item.querySelector('.polaroid__legende');
  if (domLightbox.legende && legendeSource) {
    domLightbox.legende.textContent = legendeSource.textContent;
  }

  // Mettre à jour les boutons de navigation
  mettreAJourNavigationLightbox();
}

/**
 * Met à jour l'état des boutons précédent/suivant.
 * On les désactive si on est au bout de la liste.
 */
function mettreAJourNavigationLightbox() {
  const { indexActuel, itemsVisibles } = etatGalerie;

  if (domLightbox.precedent) {
    domLightbox.precedent.disabled = indexActuel <= 0;
    domLightbox.precedent.style.opacity = indexActuel <= 0 ? '0.3' : '1';
  }

  if (domLightbox.suivant) {
    domLightbox.suivant.disabled = indexActuel >= itemsVisibles.length - 1;
    domLightbox.suivant.style.opacity =
      indexActuel >= itemsVisibles.length - 1 ? '0.3' : '1';
  }
}

/**
 * Ferme la lightbox et restaure le focus.
 */
function fermerLightbox() {
  if (!domLightbox.boite || !domLightbox.fond) return;

  domLightbox.boite.setAttribute('hidden', '');
  domLightbox.fond.setAttribute('hidden', '');

  // Vider le média pour libérer les ressources
  if (domLightbox.media) domLightbox.media.innerHTML = '';

  // Restaurer le scroll
  document.body.style.overflow = '';

  // Rendre le focus à l'élément qui l'avait avant l'ouverture
  if (foyerAvant && typeof foyerAvant.focus === 'function') {
    foyerAvant.focus();
  }
}

/**
 * Navigue vers la photo suivante.
 */
function photoSuivante() {
  if (etatGalerie.indexActuel < etatGalerie.itemsVisibles.length - 1) {
    chargerMediaLightbox(etatGalerie.indexActuel + 1);
    etatGalerie.indexActuel++;
    mettreAJourNavigationLightbox();
  }
}

/**
 * Navigue vers la photo précédente.
 */
function photoPrecedente() {
  if (etatGalerie.indexActuel > 0) {
    chargerMediaLightbox(etatGalerie.indexActuel - 1);
    etatGalerie.indexActuel--;
    mettreAJourNavigationLightbox();
  }
}

/**
 * Piège le focus à l'intérieur de la lightbox quand elle est ouverte.
 * Nécessaire pour l'accessibilité clavier (WCAG 2.1 - 2.4.3).
 * @param {KeyboardEvent} evenement
 */
function piegerFocus(evenement) {
  if (!domLightbox.boite || domLightbox.boite.hasAttribute('hidden')) return;

  // Éléments focalisables dans la lightbox
  const elementsFocalisables = Array.from(
    domLightbox.boite.querySelectorAll(
      'button:not([disabled]), [tabindex="0"]'
    )
  );

  if (!elementsFocalisables.length) return;

  const premier = elementsFocalisables[0];
  const dernier = elementsFocalisables[elementsFocalisables.length - 1];

  if (evenement.key === 'Tab') {
    if (evenement.shiftKey) {
      // Shift+Tab : si on est sur le premier, aller au dernier
      if (document.activeElement === premier) {
        evenement.preventDefault();
        dernier.focus();
      }
    } else {
      // Tab : si on est sur le dernier, aller au premier
      if (document.activeElement === dernier) {
        evenement.preventDefault();
        premier.focus();
      }
    }
  }
}

/**
 * Initialise tous les événements de la lightbox.
 */
function initialiserLightbox() {
  const grille = document.getElementById('grille-galerie');
  if (!grille) return;

  // Délégation d'événements sur la grille (plus efficace que N listeners)
  // On écoute les clics sur les boutons polaroïd
  grille.addEventListener('click', (evenement) => {
    const boutonPolaroid = evenement.target.closest('.polaroid__bouton');
    if (!boutonPolaroid) return;

    const item = boutonPolaroid.closest('.galerie__item');
    if (!item) return;

    // Trouver l'index de cet item dans les items visibles
    const index = etatGalerie.itemsVisibles.indexOf(item);
    if (index !== -1) {
      ouvrirLightbox(index);
    }
  });

  // Bouton de fermeture
  domLightbox.fermer?.addEventListener('click', fermerLightbox);

  // Navigation
  domLightbox.suivant?.addEventListener('click', photoSuivante);
  domLightbox.precedent?.addEventListener('click', photoPrecedente);

  // Fermeture au clic sur le fond
  domLightbox.fond?.addEventListener('click', fermerLightbox);

  // Clavier : Échap pour fermer, flèches pour naviguer
  document.addEventListener('keydown', (evenement) => {
    // On n'agit que si la lightbox est ouverte
    if (domLightbox.boite?.hasAttribute('hidden')) return;

    switch (evenement.key) {
      case 'Escape':
        fermerLightbox();
        break;
      case 'ArrowRight':
        photoSuivante();
        break;
      case 'ArrowLeft':
        photoPrecedente();
        break;
      default:
        break;
    }

    // Piège de focus
    piegerFocus(evenement);
  });
}


/* ─────────────────────────────────────────────────────────────────
   INITIALISATION
   ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initialiserFiltres();
  initialiserLightbox();
});
