# N.O.G - Nested Orchestration & Governance
## Interface de Chatbot Juridique Avancée

N.O.G est une interface de chatbot juridique sophistiquée conçue pour orchestrer et gouverner les interactions entre différents agents spécialisés, avec une capacité native de connexion à des systèmes tiers tels qu'iManage.

## 🏗️ Architecture

### Vue d'ensemble
L'application suit une architecture moderne avec séparation claire entre le frontend et le backend, optimisée pour les environnements juridiques professionnels.

```
legal-chatbot-interface/
├── api/                          # Backend Flask (Vercel Functions)
│   └── index.py                  # Point d'entrée principal
├── client/                       # Frontend (Vanilla JS/HTML/CSS)
│   ├── css/                      # Styles et thèmes
│   │   ├── style.css            # Styles principaux
│   │   ├── glass-buttons.css    # Effets glassmorphism
│   │   ├── onboarding.css       # Styles page agents
│   │   └── workspace.css        # Styles espace de travail
│   ├── html/                     # Templates HTML
│   │   ├── index.html           # Interface chat principale
│   │   ├── onboarding.html      # Page de sélection d'agents
│   │   ├── workspace.html       # Espace de travail collaboratif
│   │   └── links.html           # Page de liens/ressources
│   ├── js/                       # Scripts JavaScript
│   │   ├── chat.js              # Logique principale du chat
│   │   ├── modern-chat-bar.js   # Barre de chat moderne
│   │   ├── onboarding.js        # Gestion des agents IA
│   │   ├── workspace.js         # Espace de travail
│   │   └── chat-input-manager.js # Gestion responsive des inputs
│   └── img/                      # Assets et images
├── server/                       # Backend Flask (développement local)
│   ├── app.py                   # Configuration Flask
│   ├── backend.py               # API backend
│   └── website.py               # Routes web
├── config.json                   # Configuration serveur
├── requirements.txt              # Dépendances Python
├── vercel.json                  # Configuration Vercel
└── run.py                       # Script de lancement local
```

### Frontend Architecture

#### 1. Interface Utilisateur Moderne
- **Design System** : Interface glassmorphism avec effets de flou et transparence
- **Responsive Design** : Adaptation automatique mobile/desktop avec breakpoints optimisés
- **Sidebar Dynamique** : Navigation contextuelle avec états persistants
- **Chat Interface** : Barre de chat moderne avec auto-resize et raccourcis clavier

#### 2. Gestion des Agents IA
- **Système d'Agents** : 12+ agents spécialisés (juridique, finance, conformité, etc.)
- **Recherche Avancée** : Moteur de recherche avec suggestions intelligentes et correspondance floue
- **États Persistants** : Sauvegarde des préférences agents dans localStorage
- **Interface Onboarding** : Page dédiée à la découverte et configuration des agents

#### 3. Espace de Travail Collaboratif
- **Canvas Libre** : Positionnement libre des cartes de travail avec zoom/pan
- **Mode Document** : Édition collaborative de documents avec génération IA
- **Chat Intégré** : Communication contextuelle par carte de travail
- **Contrôles Avancés** : Zoom, fit-to-screen, sauvegarde d'état

#### 4. Fonctionnalités Avancées
- **Drag & Drop** : Support des fichiers PDF, Word, Excel, PowerPoint
- **Connecteurs** : Intégration prévue avec iManage, Jina.ai, etc.
- **Streaming** : Réponses en temps réel avec curseur de frappe
- **Markdown** : Rendu complet avec coloration syntaxique

### Backend Architecture

#### 1. API Flask
- **Point d'entrée unique** : `api/index.py` pour Vercel Functions
- **Streaming SSE** : Server-Sent Events pour les réponses en temps réel
- **Proxy sécurisé** : Relais vers l'API juridique externe
- **Gestion d'erreurs** : Handling robuste avec fallbacks

#### 2. Routes et Endpoints
```python
# Routes principales
/                           # Redirection vers /chat
/chat/                      # Interface chat principale
/chat/<conversation_id>     # Chat avec ID spécifique
/onboarding/               # Page de sélection d'agents
/workspace/                # Espace de travail collaboratif
/assets/<folder>/<file>    # Assets statiques

# API Backend
/backend-api/v2/conversation  # Endpoint principal chat (POST)
```

#### 3. Intégration Externe
- **API Juridique** : Connexion à `legal-chatbot.eastus.cloudapp.azure.com`
- **Streaming Response** : Traitement des réponses en flux continu
- **Métadonnées** : Gestion des liens, langue, et contexte juridique

### Technologies Utilisées

#### Frontend
- **Vanilla JavaScript** : Pas de framework, performance optimale
- **CSS3 Avancé** : Glassmorphism, animations, responsive design
- **HTML5** : Sémantique moderne avec accessibilité
- **LocalStorage** : Persistance des conversations et préférences
- **Fetch API** : Communication asynchrone avec le backend

#### Backend
- **Flask 3.0.2** : Framework web Python léger
- **Requests** : Client HTTP pour API externe
- **Vercel Functions** : Déploiement serverless
- **Server-Sent Events** : Streaming temps réel

#### Outils et Services
- **Vercel** : Hébergement et déploiement
- **Azure** : API juridique externe
- **Font Awesome** : Iconographie
- **Highlight.js** : Coloration syntaxique
- **Marked.js** : Rendu Markdown

## 🚀 Installation et Déploiement

### Développement Local

1. **Cloner le repository**
```bash
git clone <repository-url>
cd legal-chatbot-interface
```

2. **Installer les dépendances Python**
```bash
pip install -r requirements.txt
```

3. **Configurer l'environnement**
```bash
# Copier et modifier config.json si nécessaire
cp config.json.example config.json
```

4. **Lancer le serveur de développement**
```bash
python run.py
```

L'application sera accessible sur `http://localhost:1338`

### Déploiement Vercel

1. **Configuration automatique**
```bash
vercel --prod
```

2. **Variables d'environnement**
Aucune variable d'environnement requise pour le déploiement de base.

## 🎯 Fonctionnalités Principales

### 1. Chat Intelligent
- Conversations persistantes avec historique
- Streaming des réponses en temps réel
- Support Markdown avec coloration syntaxique
- Intégration de ressources vidéo YouTube

### 2. Agents Spécialisés
- **Analyse Contractuelle** : Identification des risques et clauses clés
- **Recherche Jurisprudentielle** : Stratégies basées sur les précédents
- **Conformité** : Vérification des obligations réglementaires
- **Reporting Financier** : Tableaux de bord interactifs
- **Et 8+ autres agents spécialisés**

### 3. Espace de Travail
- Canvas infini avec positionnement libre
- Mode document collaboratif
- Chat contextuel par carte
- Sauvegarde automatique des layouts

### 4. Interface Moderne
- Design glassmorphism premium
- Animations fluides et micro-interactions
- Responsive design mobile-first
- Accessibilité WCAG compliant

## 🔧 Configuration

### Personnalisation des Agents
Les agents peuvent être configurés dans `client/js/onboarding.js` :

```javascript
const agentsData = {
    customAgent: {
        title: "Mon Agent Personnalisé",
        context: "Domaine / Spécialité",
        body: "Description détaillée de l'agent..."
    }
};
```

### Styles et Thèmes
Les thèmes peuvent être modifiés dans `client/css/style.css` avec les variables CSS :

```css
:root {
    --colour-1: #ffffff;
    --colour-2: #f8f9fa;
    --colour-3: #2f2f2e;
    /* ... autres variables */
}
```

## 📱 Responsive Design

L'interface s'adapte automatiquement aux différentes tailles d'écran :

- **Desktop** (>990px) : Interface complète avec sidebar
- **Tablet** (768px-990px) : Sidebar collapsible
- **Mobile** (<768px) : Interface optimisée tactile

## 🔒 Sécurité

- Communication HTTPS obligatoire
- Validation côté serveur des requêtes
- Pas de stockage de données sensibles côté client
- Proxy sécurisé pour les API externes

## 🧪 Tests et Debugging

### Mode Debug
Activer le mode debug dans la console :
```javascript
window.DEBUG_SEARCH = true; // Pour la recherche d'agents
window.debugAgents; // Outils de debug des agents
```

### Logs
Les logs sont disponibles dans la console du navigateur et les logs Vercel pour le backend.

## 📚 Documentation API

### Endpoint Principal
```
POST /backend-api/v2/conversation
Content-Type: application/json

{
    "conversation_id": "uuid",
    "action": "_ask",
    "model": "Eggon-V1",
    "meta": {
        "id": "message_id",
        "content": {
            "conversation": [...],
            "content_type": "text",
            "parts": [
                {
                    "content": "Question utilisateur",
                    "role": "user"
                }
            ]
        }
    }
}
```

### Réponse Streaming
```
data: {"response": "Partie de la réponse", "metadata": {...}}
data: {"response": "Suite...", "metadata": {...}}
data: [DONE]
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📋 TODO

### Fonctionnalités à Implémenter

#### 🔐 Authentification Sécurisée (Priorité Haute)

**Project Specification: Secure Authentication for Chatbot Interface (Vanilla Front + Express Backend)**

**Objectif :**
Implémenter un système d'authentification sécurisé pour l'interface de chatbot, suivant les standards iManage. Les utilisateurs s'authentifient via Azure AD / Entra ID avec MFA, et tous les secrets/clés sont gérés via Azure Key Vault. Aucun accès admin direct ; tous les accès sont pilotés par API (Zero Trust).

**1. Frontend (Vanilla JavaScript SPA)**

*Requirements :*
- Utiliser MSAL.js v2 pour l'authentification Azure AD
- Implémenter Authorization Code Flow avec PKCE
- Gérer login, logout, et acquisition de tokens
- Renouvellement silencieux des tokens pour les sessions longues
- Stocker les claims utilisateur minimaux localement (sub, email, oid) pour le contexte de session
- Les URI de redirection doivent correspondre à la configuration Azure App Registration

*Notes d'implémentation :*
- Utiliser les tutoriels officiels MSAL.js vanilla comme référence
- Ne pas stocker de secrets dans le frontend
- Assurer que toute communication soit en TLS 1.2+

*Livrables :*
- Module login.js / auth.js gérant les flux d'authentification
- Interface SPA pour login/logout avec acquisition de tokens
- Documentation pour la configuration des URI de redirection et scopes

**2. Backend (Express.js API)**

*Requirements :*
- Valider les tokens d'accès JWT du frontend en utilisant passport-azure-ad BearerStrategy ou express-jwt + jwks-rsa
- Peupler req.user avec les claims Azure
- Implémenter un middleware pour protéger les routes API (/api/*)
- Synchroniser les claims utilisateur vers la DB locale au premier login (uid, email, tenant, roles)
- Aucun stockage de secrets dans le code ; secrets/clés gérés via Azure Key Vault
- Optionnel : utiliser CMEK / HSM pour les clés gérées par le client si requis

*Notes d'implémentation :*
- Assurer Zero Trust : aucun accès direct DB ou système en dehors de l'API
- Logging centralisé pour les événements de sécurité
- TLS 1.2+ imposé pour tous les endpoints backend

*Livrables :*
- authMiddleware.js pour la validation JWT
- Exemple d'endpoints API protégés (/api/chatbot)
- Exemple d'intégration avec Key Vault pour les secrets côté serveur

**3. Sécurité & Gestion des Clés**
- Tous les secrets (client secrets, certificats, clés) stockés dans Azure Key Vault
- 2FA / MFA délégué à Azure AD ; éviter l'implémentation de MFA personnalisé
- Politiques d'accès conditionnel appliquées via Azure AD
- Logs centralisés pour l'auditabilité
- Suivre les principes Zero Trust (moindre privilège, accès API uniquement)

**4. Flux Utilisateur**
1. L'utilisateur ouvre la SPA et clique sur login → MSAL initie Authorization Code Flow avec PKCE
2. Azure AD authentifie l'utilisateur avec MFA
3. La SPA reçoit le token d'accès (JWT) → utilise le token pour les appels API
4. Le backend valide le token → peuple req.user → accède aux ressources ou synchronise les claims utilisateur
5. Toute opération sensible utilise des clés éphémères récupérées depuis Key Vault

**5. Références / Ressources**
- [MSAL.js Tutorial (Vanilla SPA)](https://learn.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-javascript-spa)
- [Express + passport-azure-ad sample](https://github.com/AzureAD/passport-azure-ad)
- [Azure Key Vault + CMEK](https://learn.microsoft.com/en-us/azure/key-vault/)
- [JWT Validation with JWKS](https://github.com/auth0/node-jwks-rsa)

#### 🔌 Intégrations Avancées
- [ ] **Connecteur iManage** : Intégration complète avec l'API iManage
- [ ] **Jina.ai Integration** : Recherche approfondie avec IA
- [ ] **Power BI Connector** : Tableaux de bord intégrés
- [ ] **Azure Cognitive Services** : Analyse de documents avancée

#### 🎨 Améliorations UI/UX
- [ ] **Mode Sombre** : Thème sombre complet
- [ ] **Personnalisation** : Thèmes personnalisables par utilisateur
- [ ] **Raccourcis Clavier** : Shortcuts avancés pour power users
- [ ] **Notifications** : Système de notifications push

#### 📊 Analytics et Monitoring
- [ ] **Métriques d'Usage** : Tracking des interactions utilisateur
- [ ] **Performance Monitoring** : Surveillance des performances
- [ ] **Error Tracking** : Système de remontée d'erreurs
- [ ] **A/B Testing** : Framework de tests A/B

#### 🌐 Internationalisation
- [ ] **Multi-langue** : Support français/anglais complet
- [ ] **Localisation** : Adaptation aux différentes juridictions
- [ ] **RTL Support** : Support des langues droite-à-gauche

#### 🔧 Outils de Développement
- [ ] **Tests Automatisés** : Suite de tests E2E avec Playwright
- [ ] **CI/CD Pipeline** : Pipeline de déploiement automatisé
- [ ] **Documentation API** : Documentation interactive avec Swagger
- [ ] **Storybook** : Catalogue de composants UI

## 📄 Licence

Ce projet est sous licence propriétaire. Tous droits réservés.

## 📞 Support

Pour toute question ou support technique, contactez l'équipe de développement.

---

**N.O.G** - Nested Orchestration & Governance  
*Interface de Chatbot Juridique Professionnelle*