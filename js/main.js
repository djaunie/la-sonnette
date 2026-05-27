/**
 * main.js — La Sonnette · Script principal
 * ═══════════════════════════════════════════════════════════════════
 *
 * Responsabilités :
 *  1. Navigation : burger menu mobile, ombre header au scroll
 *  2. Lien actif dans la nav selon la section visible
 *  3. Animations au scroll via IntersectionObserver
 *
 * SÉCURITÉ :
 *  - Aucun innerHTML avec données externes
 *  - Aucune évaluation de code (eval, Function)
 *  - Accès uniquement aux éléments du DOM attendus
 *
 * Compatibilité : navigateurs modernes (Chrome 80+, Firefox 75+, Safari 13+)
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   UTILITAIRE : Sélection d'éléments du DOM
   On centralise les sélections pour éviter les répétitions.
   ───────────────────────────────────────────────────────────────── */

/**
 * Sélectionne un seul élément du DOM.
 * @param {string} selecteur - Sélecteur CSS
 * @param {Element} [contexte=document] - Élément de contexte
 * @returns {Element|null}
 */
function selectionner(selecteur, contexte = document) {
  return contexte.querySelector(selecteur);
}

/**
 * Sélectionne tous les éléments correspondants.
 * @param {string} selecteur - Sélecteur CSS
 * @param {Element} [contexte=document]
 * @returns {NodeList}
 */
function selectionnerTous(selecteur, contexte = document) {
  return contexte.querySelectorAll(selecteur);
}


/* ─────────────────────────────────────────────────────────────────
   1. NAVIGATION MOBILE — Burger menu
   Le bouton burger affiche/cache le menu sur petits écrans.
   ───────────────────────────────────────────────────────────────── */

/**
 * Initialise le comportement du menu burger sur mobile.
 * Gère l'état ouvert/fermé et l'accessibilité (aria-expanded).
 */
function initialiserMenuBurger() {
  const boutonBurger = selectionner('.navigation__burger');
  const menuPrincipal = selectionner('#menu-principal');

  // Si les éléments n'existent pas (sécurité), on sort
  if (!boutonBurger || !menuPrincipal) return;

  boutonBurger.addEventListener('click', () => {
    const estOuvert = boutonBurger.getAttribute('aria-expanded') === 'true';

    // Bascule l'état
    boutonBurger.setAttribute('aria-expanded', String(!estOuvert));
    menuPrincipal.classList.toggle('ouvert');
  });

  // Fermer le menu quand on clique sur un lien (navigation vers ancre)
  const liensNav = selectionnerTous('.navigation__lien', menuPrincipal);
  liensNav.forEach(lien => {
    lien.addEventListener('click', () => {
      boutonBurger.setAttribute('aria-expanded', 'false');
      menuPrincipal.classList.remove('ouvert');
    });
  });

  // Fermer le menu si on clique en dehors
  document.addEventListener('click', (evenement) => {
    const clic = evenement.target;
    const dansBurger = boutonBurger.contains(clic);
    const dansMenu   = menuPrincipal.contains(clic);

    if (!dansBurger && !dansMenu) {
      boutonBurger.setAttribute('aria-expanded', 'false');
      menuPrincipal.classList.remove('ouvert');
    }
  });
}


/* ─────────────────────────────────────────────────────────────────
   2. NAVIGATION — Ombre au scroll + lien actif
   ───────────────────────────────────────────────────────────────── */

/**
 * Ajoute une ombre à l'entête quand l'utilisateur a scrollé.
 * Aussi : met en surbrillance le lien de nav correspondant
 * à la section visible.
 */
function initialiserComportementScroll() {
  const entete = selectionner('.entete');
  const liensNav = selectionnerTous('.navigation__lien');

  // Sections avec ancres (dans l'ordre d'apparition dans la page)
  const sections = selectionnerTous('section[id]');

  if (!entete) return;

  // Observer le scroll pour l'ombre de l'entête
  const observateurEntete = new IntersectionObserver(
    ([entree]) => {
      // Si le hero n'est plus visible, on ajoute l'ombre
      entete.classList.toggle('entete--avec-ombre', !entree.isIntersecting);
    },
    { threshold: 0.1 }
  );

  const hero = selectionner('#accueil');
  if (hero) observateurEntete.observe(hero);

  // Observer les sections pour mettre en évidence le lien nav actif
  const observateurSections = new IntersectionObserver(
    (entrees) => {
      entrees.forEach(entree => {
        if (entree.isIntersecting) {
          const idSection = entree.target.id;

          // Retirer la classe actif de tous les liens
          liensNav.forEach(lien => lien.classList.remove('actif'));

          // L'ajouter au lien correspondant à la section visible
          const lienActif = selectionner(
            `.navigation__lien[href="#${idSection}"]`
          );
          if (lienActif) lienActif.classList.add('actif');
        }
      });
    },
    {
      // La section est "active" quand elle occupe au moins 40% de la fenêtre
      threshold: 0.4,
    }
  );

  sections.forEach(section => observateurSections.observe(section));
}


/* ─────────────────────────────────────────────────────────────────
   3. ANIMATIONS AU SCROLL — IntersectionObserver
   Les éléments avec la classe .apparition s'animent
   quand ils entrent dans la fenêtre visible.
   ───────────────────────────────────────────────────────────────── */

/**
 * Observe tous les éléments .apparition et ajoute la classe .visible
 * quand ils deviennent visibles. L'animation CSS fait le reste.
 */
function initialiserAnimationsScroll() {
  // Vérifier si l'utilisateur préfère les animations réduites
  const prefereAnimationsReduites = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Si animations réduites, on rend tout visible immédiatement
  if (prefereAnimationsReduites) {
    selectionnerTous('.apparition').forEach(el => el.classList.add('visible'));
    return;
  }

  const observateur = new IntersectionObserver(
    (entrees) => {
      entrees.forEach(entree => {
        if (entree.isIntersecting) {
          entree.target.classList.add('visible');
          // On n'observe plus l'élément une fois animé (performance)
          observateur.unobserve(entree.target);
        }
      });
    },
    {
      // L'élément commence à s'animer quand 10% est visible
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px', // Déclenche un peu avant le bord bas
    }
  );

  selectionnerTous('.apparition').forEach(el => observateur.observe(el));
}


/* ─────────────────────────────────────────────────────────────────
   INITIALISATION GLOBALE
   On attend que le DOM soit chargé pour tout initialiser.
   ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initialiserMenuBurger();
  initialiserComportementScroll();
  initialiserAnimationsScroll();
});
