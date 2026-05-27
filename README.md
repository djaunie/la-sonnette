# 🔔 La Sonnette — Comité des Fêtes
### Site web · Pôle Sup de la Salle · Rennes

> *"Parce que la récré ne s'arrête pas à 17h30."*

---

## 📋 Résumé

Site vitrine d'une seule page pour le Comité des Fêtes du Pôle Sup de la Salle.
Organisé par Jean & Sandrine, ce site rassemble les photos des événements, les bars testés et une boîte à idées pour les collègues.

**Stack technique : HTML5 + CSS3 + JavaScript vanilla. Aucune dépendance npm. Aucun build.**

---

## 🗂️ Structure du projet

```
la-sonnette/
├── index.html              ← Page principale (unique fichier HTML)
│
├── css/
│   ├── style.css           ← Styles globaux (variables, nav, hero, bars, formulaire, footer)
│   └── galerie.css         ← Styles spécifiques à la galerie et à la lightbox
│
├── js/
│   ├── main.js             ← Navigation, scroll, animations, compteurs animés
│   ├── galerie.js          ← Filtre par catégorie + lightbox
│   └── formulaire.js       ← Validation et envoi du formulaire
│
├── img/
│   ├── jean.png            ← Photo des organisateurs (Jean & Sandrine)
│   │
│   ├── events/             ← Photos des événements
│   │   ├── photobooth.png
│   │   ├── secret_santa_1.png
│   │   ├── secret_santa_2.png
│   │   ├── secret_santa_3.png
│   │   ├── grand_huit_afterwork.jpg
│   │   └── equinoxe_video.mp4
│   │
│   └── bars/               ← Photos des bars testés
│       ├── avec.png
│       ├── la_librairie.png
│       ├── la_librairie_2.png
│       ├── equinoxe.png
│       ├── equinoxe_2.png
│       ├── equinoxe_3.jpg
│       └── le_grand_huit.png
│
└── README.md               ← Ce fichier
```

---

## 🚀 Lancer le site en local

### Option 1 — Ouverture directe (la plus simple)
Double-cliquer sur `index.html` dans l'explorateur de fichiers.
Fonctionne pour consulter le site, mais certaines fonctionnalités (formulaire, fonts) peuvent être limitées sans serveur.

### Option 2 — Serveur local recommandé
Avec Python (installé par défaut sur macOS/Linux) :

```bash
cd la-sonnette
python3 -m http.server 8080
# Puis ouvrir : http://localhost:8080
```

Avec Node.js :

```bash
npx serve .
# Ou : npx http-server
```

Avec VS Code : installer l'extension **Live Server** et cliquer sur "Go Live".

---

## 📸 Ajouter ou remplacer des médias

### Photos d'événements
Placer les nouvelles photos dans `img/events/` au format `.jpg`, `.png` ou `.webp` (recommandé).

Ensuite, dans `index.html`, ajouter un bloc article dans `#grille-galerie` :

```html
<article class="galerie__item polaroid" data-categorie="afterwork" role="listitem">
  <button class="polaroid__bouton" aria-label="Agrandir : description de la photo">
    <img
      src="img/events/ma-photo.webp"
      alt="Description précise de la photo pour l'accessibilité"
      width="400"
      height="300"
      loading="lazy"
    />
  </button>
  <p class="polaroid__legende">Ma légende humoristique ici.</p>
</article>
```

**Catégories disponibles** (attribut `data-categorie`) :
- `afterwork`
- `secret-santa`
- `photobooth`

Pour ajouter une nouvelle catégorie, ajouter aussi un bouton dans `.galerie__filtres` :
```html
<button class="filtre" data-filtre="barbecue" aria-pressed="false">🔥 Barbecue</button>
```

### Photo manquante : Café Saint-Jacques
Le Café Saint-Jacques n'a pas de photo. Pour en ajouter une :
1. Placer la photo dans `img/bars/saint_jacques.png`
2. Dans `index.html`, remplacer la div `.carte-bar__image--placeholder` par :
```html
<div class="carte-bar__image">
  <img src="img/bars/saint_jacques.png" alt="Description du Café Saint-Jacques" width="400" height="250" loading="lazy" />
</div>
```

### Format recommandé pour les performances
- **WebP** (meilleur rapport qualité/poids) ou JPEG pour les photos
- Redimensionner à 800px max de large avant d'importer
- Outils : [Squoosh](https://squoosh.app) (en ligne, gratuit)

---

## ✏️ Modifier les textes

Tous les textes sont dans `index.html`. Les sections sont clairement délimitées par des commentaires :

```html
<!-- SECTION 1 — HERO -->
<!-- SECTION 2 — ESPRIT DU COMITÉ -->
<!-- SECTION 3 — GALERIE -->
<!-- SECTION 4 — BARS TESTÉS -->
<!-- SECTION 5 — BOÎTE À IDÉES -->
```

**Textes fréquemment à mettre à jour :**
- Sous-titre du hero (Jean & Sandrine depuis…)
- Compteurs (12 events, 5 bars, etc.) → modifier `data-cible` sur les éléments `.compteur__chiffre`
- Légendes des photos → balises `<p class="polaroid__legende">`
- Descriptions et adresses des bars → dans chaque `.carte-bar__contenu`

---

## ⚙️ Configurer le formulaire Formspree

1. Créer un compte sur [formspree.io](https://formspree.io) (plan gratuit = 50 envois/mois)
2. Créer un nouveau formulaire et copier l'ID (format `xxxxxxxxxxxx`)
3. Dans `index.html`, remplacer `VOTRE_ID_FORMSPREE` :
```html
<form action="https://formspree.io/f/VOTRE_ID_FORMSPREE" ...>
```
4. Configurer l'email de réception dans le tableau de bord Formspree

**Alternatif sans compte** : remplacer l'action par un `mailto:` basique (pas d'envoi asynchrone mais fonctionne) :
```html
<form action="mailto:comite-fetes@polesup-delasalle.fr" method="POST" enctype="text/plain">
```

---

## 🔧 Maintenance et évolution

### Ajouter un bar
Dans la section `#bars`, copier-coller une `.carte-bar` existante et modifier :
- Le nom du bar (`.carte-bar__nom`)
- La description (`.carte-bar__description`)
- L'adresse (`.carte-bar__adresse`)
- L'URL Google Maps (`href` du `.bouton--carte`)
- L'emoji d'ambiance (`.carte-bar__emoji`)
- La photo (`src` de l'`img`)

### Modifier la palette de couleurs
Tout est dans les variables CSS au début de `css/style.css` :
```css
:root {
  --couleur-fond:          #FDF6EC;
  --couleur-accent-jaune:  #F5C842;
  --couleur-accent-brique: #D95F3B;
  /* etc. */
}
```

### Changer les polices
Dans `index.html`, modifier le `<link>` Google Fonts et dans `css/style.css` :
```css
--police-titre: 'Playfair Display', Georgia, serif;
--police-corps:  'Nunito', 'Segoe UI', sans-serif;
```

---

## 🛡️ Sécurité — Points de vigilance

### Ce qui est déjà appliqué
- **Content Security Policy** (CSP) dans le `<meta>` du HTML : limite les ressources externes autorisées
- **rel="noopener noreferrer"** sur tous les liens externes (protège contre le reverse tabnapping)
- **Validation stricte** des entrées utilisateur (longueur + regex) avant envoi
- **Honeypot anti-spam** : champ caché dans le formulaire pour piéger les bots
- **textContent** utilisé partout (jamais `innerHTML` avec des données utilisateur)
- **createElement** pour les injections DOM dans la lightbox
- Aucun token ou secret dans le code JS

### Ce qu'il faudra surveiller en V2
- Si un CMS ou une API est ajoutée, revoir la CSP
- Si des commentaires utilisateurs sont affichés, prévoir un assainissement côté serveur (jamais côté client seulement)
- La validation JS est une aide UX, pas une sécurité suffisante — Formspree gère la validation serveur

### Hébergement recommandé
**GitHub Pages** : gratuit, déploiement automatique via `git push`.
1. Créer un dépôt `la-sonnette` sur GitHub
2. Pousser le projet : `git push origin main`
3. Dans Settings > Pages, choisir `main branch` comme source
4. Le site sera disponible à `https://[username].github.io/la-sonnette`

---

## 🗓️ Roadmap V2 (suggestions)

| Fonctionnalité | Effort estimé | Valeur |
|---|---|---|
| Filtre galerie animé (transition douce) | 1h | ⭐⭐ |
| Compteur d'événements en temps réel | 2h | ⭐⭐⭐ |
| Page "Prochain événement" avec compte à rebours | 3h | ⭐⭐⭐ |
| Séparation "proposer un lieu" / "proposer une idée" en 2 onglets | 2h | ⭐⭐ |
| Mode sombre | 4h | ⭐ |
| Optimisation WebP automatique (script bash) | 1h | ⭐⭐⭐ |
| Intégration vidéos dans la lightbox | 2h | ⭐⭐⭐ |

---

## 👥 Crédits

Conçu par **Jean de Saint Angel** pour le Comité des Fêtes du Pôle Sup de la Salle, Rennes.  
Version MVP — Mai 2026.

🎓 fait par des profs · ❤️ pour des profs · ☕ avec beaucoup de café
