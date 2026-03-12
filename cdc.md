# Cahier des charges — Application web de calcul de temps de passage à partir d’un fichier GPX

## 1. Contexte du projet

Le projet consiste à développer une application web permettant à un utilisateur d’importer un fichier GPX représentant un parcours, puis de définir un temps total objectif pour réaliser ce parcours.

À partir de ce temps cible, l’application calcule automatiquement les temps de passage intermédiaires sur l’ensemble du tracé, afin d’aider l’utilisateur à préparer son effort, gérer son allure et anticiper ses points de passage.

L’application s’adresse à des sportifs ou pratiquants souhaitant planifier un parcours de manière simple et visuelle, notamment dans les domaines de la course à pied, du trail, de la randonnée ou du cyclisme.

---

## 2. Objectif du projet

L’objectif principal est de transformer un tracé GPX en un plan de passage temporel exploitable.

L’application doit permettre de :

- charger un fichier GPX
- analyser le parcours
- saisir un temps global objectif
- calculer les temps de passage intermédiaires
- afficher les résultats de manière claire sur carte et dans un tableau

---

## 3. Besoin utilisateur

L’utilisateur souhaite pouvoir :

- importer facilement un parcours GPX
- visualiser ce parcours sur une carte
- renseigner un temps cible total
- obtenir automatiquement les temps de passage estimés tout au long du parcours
- consulter ces résultats de façon simple, rapide et lisible

L’outil doit réduire au maximum la complexité technique et se concentrer sur un usage direct :

> j’importe un parcours, je saisis un objectif, j’obtiens mes temps de passage

---

## 4. Public cible

L’application s’adresse principalement aux profils suivants :

- coureurs sur route
- trailers
- randonneurs
- cyclistes
- accompagnateurs
- organisateurs
- sportifs préparant une épreuve avec barrières horaires

---

## 5. Objectifs fonctionnels

L’application devra permettre :

- l’import d’un fichier GPX
- la lecture et l’analyse du tracé
- l'affichage du profil du tracé
- l’affichage du parcours sur une carte interactive
- la saisie d’un temps objectif
- le calcul automatique des temps de passage
- l’affichage des résultats dans un tableau clair
- la mise à jour instantanée des résultats en cas de modification du temps cible

---

## 6. Périmètre fonctionnel

### 6.1 Fonction principale

La fonction principale de l’application est le calcul de temps de passage sur un parcours GPX à partir d’un temps total renseigné par l’utilisateur.

### 6.2 Résultat attendu

À partir d’un parcours et d’un temps cible, l’application doit fournir :

- la distance totale du parcours
- l’allure moyenne théorique
- les temps de passage intermédiaires
- le temps estimé à l’arrivée

---

## 7. Description détaillée des fonctionnalités

## 7.1 Import d’un fichier GPX

L’utilisateur doit pouvoir importer un fichier GPX depuis son appareil.

### Attendus

- bouton d’import de fichier
- support du glisser-déposer en option
- validation du format
- lecture du tracé principal
- gestion des erreurs en cas de fichier invalide, vide ou non lisible

### Résultat

Une fois le fichier importé, l’application charge le parcours et affiche ses premières informations.

---

## 7.2 Analyse du parcours

Après import, l’application doit analyser les données du fichier GPX.

### Données à extraire

- tracé principal
- liste des points GPS
- distance totale
- nombre de points
- altitude si disponible
- dénivelé positif et négatif si calculables
- waypoints éventuels si présents

### Résultat

L’application doit fournir une synthèse du parcours exploitable immédiatement.

---

## 7.3 Affichage du parcours sur une carte

Le tracé importé doit être affiché sur une carte interactive.

### Attendus

- affichage du parcours sous forme de ligne
- centrage automatique sur le tracé
- ajustement automatique du zoom
- navigation libre sur la carte
- bonne lisibilité du parcours

### Résultat

L’utilisateur peut visualiser clairement son itinéraire.

---

## 7.4 Saisie d’un temps objectif

L’utilisateur doit pouvoir renseigner un temps total cible correspondant à la durée visée pour effectuer le parcours.

### Attendus

- saisie en heures, minutes et secondes
- validation des valeurs
- gestion des formats simples
- recalcul automatique dès modification

### Résultat

Le temps saisi devient la base de tous les calculs de passage.

---

## 7.5 Calcul de l’allure moyenne

À partir de la distance totale et du temps objectif, l’application doit calculer une allure moyenne théorique.

### Résultat attendu

- allure moyenne au kilomètre
- éventuellement vitesse moyenne selon le sport ou les préférences d’affichage

---

## 7.6 Calcul des temps de passage

L’application doit répartir le temps total objectif sur le parcours afin d’estimer les temps intermédiaires.

### Logique de calcul attendue pour la première version

La répartition du temps se fait de manière proportionnelle à la distance cumulée.

### Exemple

Si l’utilisateur définit un temps total pour un parcours de 10 km, l’application doit être capable d’indiquer :

- le temps au km 1
- le temps au km 2
- le temps au km 3
- etc.

### Résultat attendu

L’utilisateur obtient une estimation claire de ses passages intermédiaires.

---

## 7.7 Tableau récapitulatif des temps de passage

Les temps de passage doivent être affichés dans un tableau lisible.

### Colonnes minimales recommandées

- repère
- distance cumulée
- temps estimé
- allure moyenne théorique

### Exemples de repères possibles

- km 1
- km 2
- km 3
- waypoint
- arrivée

---

## 7.8 Mise à jour instantanée

Toute modification du temps objectif doit déclencher un recalcul immédiat des résultats.

### Résultat attendu

- mise à jour du tableau
- mise à jour des éventuels marqueurs
- cohérence immédiate des données affichées

---

## 8. Fonctionnalités attendues pour le MVP

Le MVP doit contenir uniquement les fonctions indispensables à l’usage principal.

### Fonctionnalités MVP

- import d’un fichier GPX
- lecture du tracé
- calcul de la distance totale
- affichage du parcours sur une carte
- saisie d’un temps objectif
- calcul de l’allure moyenne
- calcul des temps de passage tous les kilomètres
- affichage des résultats dans un tableau

Ce périmètre est suffisant pour une première version utile et exploitable.

---

## 9. Fonctionnalités complémentaires envisagées

Ces fonctionnalités ne sont pas obligatoires dans le MVP mais peuvent faire partie d’une version ultérieure.

### 9.1 Prise en compte du dénivelé

L’application pourra ajuster les temps de passage selon la pente du parcours :

- montées plus lentes
- descentes plus rapides
- plat neutre

### 9.2 Découpage personnalisé

Permettre à l’utilisateur de choisir le mode de découpage :

- tous les 1 km
- tous les 500 m
- tous les 5 km
- selon les waypoints
- selon des points personnalisés

### 9.3 Profil altimétrique

Afficher un graphique altitude / distance.

### 9.4 Heure de départ

Permettre à l’utilisateur de renseigner une heure de départ afin d’obtenir des heures réelles de passage.

Exemple :

- départ à 08:00
- passage estimé au km 10 à 08:52

### 9.5 Export des résultats

Possibilité d’exporter les résultats sous différents formats :

- CSV
- PDF
- impression
- roadbook synthétique

### 9.6 Points de contrôle personnalisés

Permettre à l’utilisateur de créer manuellement des checkpoints sur la carte.

### 9.7 Comparaison de scénarios

Comparer plusieurs temps objectifs :

- scénario prudent
- scénario réaliste
- scénario ambitieux

---

## 10. Règles métier

### Règle 1

Le temps total saisi par l’utilisateur constitue la référence principale de calcul.

### Règle 2

Dans la première version, le temps est réparti proportionnellement à la distance parcourue.

### Règle 3

Les temps de passage sont calculés à partir de la distance cumulée sur le tracé.

### Règle 4

Si les données d’altitude sont absentes, l’application reste pleinement fonctionnelle avec un calcul basé uniquement sur la distance.

### Règle 5

Tout fichier GPX invalide ou non exploitable doit générer un message d’erreur clair.

### Règle 6

Le recalcul doit être automatique à chaque modification du temps cible.

---

## 11. Contraintes fonctionnelles

L’application devra respecter les contraintes suivantes :

- interface simple et intuitive
- chargement rapide
- compréhension immédiate des résultats
- compatibilité desktop et mobile
- support des fichiers GPX standards
- affichage clair même pour un utilisateur non technique

---

## 12. Contraintes techniques

Les choix techniques sont laissés au développeur, mais l’application devra idéalement permettre :

- une lecture fiable de fichiers GPX
- un affichage cartographique fluide
- des calculs de distance précis
- une architecture maintenable
- une évolutivité vers des fonctionnalités avancées

---

## 13. Expérience utilisateur attendue

L’expérience utilisateur doit être centrée sur la simplicité.

Le parcours utilisateur cible est le suivant :

1. l’utilisateur importe un fichier GPX  
2. il visualise immédiatement le tracé  
3. il saisit son temps objectif  
4. il obtient instantanément ses temps de passage

L’utilisateur ne doit pas avoir à comprendre la structure interne du fichier GPX ni la logique géographique de calcul.

---

## 14. Interface attendue

L’interface peut s’organiser autour de quatre blocs principaux :

### Bloc 1 — Import

- zone d’import du fichier GPX
- message d’état du chargement
- message d’erreur si nécessaire

### Bloc 2 — Informations parcours

- distance totale
- dénivelé positif
- dénivelé négatif
- nombre de points
- informations générales

### Bloc 3 — Paramètres utilisateur

- champ de saisie du temps objectif
- éventuellement heure de départ
- options de découpage

### Bloc 4 — Résultats

- carte avec tracé
- tableau des temps de passage
- indicateurs globaux
- export éventuel

---

## 15. Critères de réussite

Le projet sera considéré comme conforme si :

- un fichier GPX peut être importé correctement
- le parcours est affiché sur une carte
- la distance totale est calculée correctement
- l’utilisateur peut saisir un temps objectif
- les temps de passage sont calculés automatiquement
- les résultats sont lisibles et cohérents
- l’interface est simple à utiliser

---

## 16. Cas d’usage principal

### Cas d’usage nominal

1. un utilisateur importe un parcours GPX  
2. l’application lit le tracé  
3. l’application calcule la distance totale  
4. l’utilisateur saisit un temps cible  
5. l’application calcule les temps de passage  
6. l’utilisateur consulte ses repères intermédiaires

### Résultat

L’utilisateur dispose d’un plan de passage exploitable pour son effort.

---

## 17. Gestion des erreurs et cas particuliers

L’application doit gérer au minimum les cas suivants :

- fichier non fourni
- fichier invalide
- fichier vide
- tracé absent
- altitude absente
- temps cible non renseigné
- temps cible invalide
- GPX comportant plusieurs segments
- points dupliqués ou bruit GPS

Les messages d’erreur doivent être explicites et compréhensibles.

---

## 18. Priorisation des fonctionnalités

## Priorité 1 — Indispensable

- import GPX
- lecture du tracé
- calcul distance totale
- saisie temps cible
- calcul temps de passage
- affichage carte
- tableau de résultats

## Priorité 2 — Importante

- dénivelé
- waypoints
- heure de départ
- découpage personnalisé

## Priorité 3 — Évolutions

- profil altimétrique
- export PDF / CSV
- checkpoints manuels
- comparaison de scénarios
- pondération selon pente

---

## 19. Résumé du MVP

### Nom du produit

Calculateur de temps de passage GPX

### Promesse utilisateur

Importer un parcours GPX, saisir un temps objectif, obtenir immédiatement les temps de passage estimés.

### Contenu du MVP

- import GPX
- affichage du tracé
- distance totale
- saisie du temps cible
- allure moyenne
- temps de passage par kilomètre
- tableau récapitulatif

---

## 20. Évolutions possibles à moyen terme

À moyen terme, le projet pourra évoluer vers une application plus avancée intégrant :

- prise en compte du dénivelé
- calcul intelligent par type de terrain
- stratégie de course
- export roadbook
- vue mobile optimisée
- partage de parcours et de scénarios

---

# Synthèse finale

Ce projet consiste à créer une application web simple et utile permettant de transformer un fichier GPX en plan de passage temporel.

L’utilisateur doit pouvoir :

- charger un parcours
- définir un objectif de temps
- obtenir ses temps de passage automatiquement

Le MVP doit se concentrer sur une logique simple, fiable et immédiate, avec une répartition du temps basée sur la distance cumulée. Les fonctionnalités avancées pourront être ajoutées dans un second temps.

---