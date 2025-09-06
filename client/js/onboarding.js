// Données des agents IA
const agentsData = {
    contractAnalysis: {
        title: "Agent d'Analyse de Risques Contractuels",
        context: "Juridique / Révision des Risques",
        body: "Analyse les contrats et accords juridiques pour identifier les clauses clés, les risques potentiels et les incohérences dans plusieurs documents, dans le cadre de fusions, d'acquisitions et d'autres transactions. Fournit un résultat d'analyse clair avec des explications et des recommandations exploitables."
    },
    caseLawResearch: {
        title: "Agent de Stratégie Basé sur les Précédents",
        context: "Juridique / Recherche",
        body: "Améliore la recherche juridique en identifiant et récupérant dynamiquement des précédents pertinents, des textes de loi, etc, pour apporter aux avocats des recommandations stratégiques fondées sur l'analyse jurisprudentielle et le contexte juridictionnel."
    },
    meetingPrep: {
        title: "Agent de Réunion",
        context: "Entreprise / Organisationnel",
        body: "Analyse les notes de réunion, identifie les points clés et transforme automatiquement décisions et discussions en tâches actionnables, avec attribution des responsables et définition des échéances."
    },
    wikiBuilder: {
        title: "Agent de Gestion des Connaissances Internes",
        context: "Entreprise / Gestion des Connaissances",
        body: "Crée et met à jour un type de wikipedia interne privé en analysant les documents internes et les échanges autorisés, tout en attribuant automatiquement des étiquettes et des catégories aux contenus web internes."
    },
    auditTrail: {
        title: "Agent d'Amélioration de Conception d'instructions IA",
        context: "IA / Amélioration Continue",
        body: "Analyse les intructions d'IA utilisées, identifie les points faibles et génére des versions optimisées pour améliorer la précision, la clarté et la cohérence des réponses des modèles IA."
    },
    supplierCompliance: {
        title: "Agent de Conformité et politiques",
        context: "Juridique / Recherche",
        body: "Consulte les documents internes et externes pour garantir le respect des obligations et réduire le temps des équipes dédié aux relectures manuelles."
    },
    quotationAgent: {
        title: "Agent de Génération de Devis",
        context: "Ventes / Devis B2B",
        body: "Génère et envoie des devis professionnels prêts à être transmis aux clients, en se basant sur les règles tarifaires définies et les informations clients."
    },
    clientOnboarding: {
        title: "Agent de Veille Concurrentielle",
        context: "Stratégie / Intelligence Marché",
        body: "Surveille vos concurrents, analyse leurs stratégies et offres, et identifie les opportunités de marché pour générer un rapport clair et exploitable."
    },
    techIntelligence: {
        title: "Agent de Veille Technologique",
        context: "R&D / Stratégie",
        body: "Fournit chaque semaine un résumé des actualités et tendances clés dans le secteur technologique choisi, incluant les sources principales, points saillants et mises à jour réglementaires."
    },
    rfpDrafting: {
        title: "Agent de Gestion des Dépenses Juridiques",
        context: "Direction Juridique Suisse / Finance",
        body: "Analyse et contrôle des factures : vérification de la conformité avec l'Ordonnance suisse sur la comptabilité et la présentation des comptes (OCG), contrôle des taux horaires, détection d'anomalies, suivi budgétaire et prévision des charges. Production de recommandations et de rapports de conformité."
    },
    esgCompliance: {
        title: "Agent de Reporting Financier Interactif",
        context: "Finance / Pilotage de Performance",
        body: "Fournit un tableau de bord dynamique permettant d'évaluer la rentabilité par dossier, avocat ou client. Offre une interface conversationnelle en langage naturel (LLM) pour formuler des requêtes directes sur les données (ex. \"Montre-moi la marge sur nos dossiers de contentieux depuis janvier\"). L'agent s'intègre avec Power BI ou Tableau et s'inscrit dans un dispositif de pilotage de la performance financière et ESG."
    },
    dataPrivacyAudit: {
        title: "Agent de Conformité Fiscale",
        context: "Conformité / Fiscalité",
        body: "Aide les professionnels de la fiscalité à naviguer dans des réglementations fiscales complexes et évolutives à travers plusieurs juridictions, en assurant la conformité tout en identifiant des opportunités d'optimisation."
    }
};

// État de l'application
let isInitialized = false;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de la page agents...');
    
    initializeAgentsPage();
    hideMainPageElements();
    
    // Vérifications de compatibilité
    if (!checkBrowserCompatibility()) {
        console.error('Navigateur non compatible');
        return;
    }
    
    isInitialized = true;
    console.log('Page agents initialisée avec succès');
});

// Fonction d'initialisation principale
function initializeAgentsPage() {
    try {
        // Générer les cartes d'agents
        generateAgentCards();
        
        // Gérer les événements globaux
        setupGlobalEventListeners();
        
        // Animation d'entrée
        animatePageEntry();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showErrorMessage('Erreur lors du chargement des agents');
    }
}

// Génération des cartes d'agents
function generateAgentCards() {
    console.log('Génération des cartes d\'agents...');
    
    // Trouver le conteneur
    let agentsGrid = document.querySelector('.agents-grid');
    
    // Si pas trouvé, le créer
    if (!agentsGrid) {
        console.log('Création du conteneur de grille...');
        createAgentsGridContainer();
        agentsGrid = document.querySelector('.agents-grid');
    }
    
    if (!agentsGrid) {
        console.error('Impossible de créer le conteneur de grille');
        return;
    }
    
    // Vider le conteneur
    agentsGrid.innerHTML = '';
    
    // Générer les cartes
    Object.entries(agentsData).forEach(([key, agent], index) => {
        const card = createAgentCard(key, agent, index);
        agentsGrid.appendChild(card);
    });
    
    console.log(`${Object.keys(agentsData).length} cartes d'agents générées`);
}

// Créer le conteneur de grille s'il n'existe pas
function createAgentsGridContainer() {
    const onboardingContent = document.querySelector('.onboarding-content');
    
    if (onboardingContent) {
        onboardingContent.innerHTML = `
            <main class="agents-grid-container">
                <div class="agents-grid">
                    <!-- Les cartes seront générées ici -->
                </div>
            </main>
        `;
    }
}

// Créer une carte d'agent
function createAgentCard(key, agent, index) {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.dataset.agentId = key;
    card.dataset.index = index;
    
    // Définir le délai d'animation
    card.style.animationDelay = `${0.1 * (index + 1)}s`;
    
    card.innerHTML = `
        <div class="agent-header">
            <h3 class="agent-title">${agent.title}</h3>
            <span class="agent-context">${agent.context}</span>
        </div>
        <p class="agent-description">${agent.body}</p>
    `;
    
    // Ajouter les événements
    addCardEventListeners(card, key, agent);
    
    return card;
}

// Ajouter les événements aux cartes
function addCardEventListeners(card, key, agent) {
    // Événement de clic
    card.addEventListener('click', (e) => {
        e.preventDefault();
        handleAgentSelection(key, agent, card);
    });
    
    // Événements clavier pour l'accessibilité
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAgentSelection(key, agent, card);
        }
    });
    
    // Rendre focusable pour l'accessibilité
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Sélectionner l'agent ${agent.title}`);
    
    // Événements de survol pour améliorer l'UX
    card.addEventListener('mouseenter', () => {
        card.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.zIndex = '1';
    });
}

// Gérer la sélection d'un agent
function handleAgentSelection(key, agent, cardElement) {
    console.log('Agent sélectionné:', key, agent.title);
    
    // Ajouter un effet visuel de sélection
    cardElement.style.transform = 'translateY(-6px) scale(1.02)';
    cardElement.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.2)';
    
    // Réinitialiser après un délai
    setTimeout(() => {
        cardElement.style.transform = '';
        cardElement.style.boxShadow = '';
    }, 200);
    
    // TODO: Ici on ajoutera l'action spécifique plus tard
    // Pour l'instant, juste un feedback console
    
    // Analytics optionnel
    trackAgentSelection(key, agent.title);
}

// Configuration des événements globaux
function setupGlobalEventListeners() {
    // Événement pour le bouton retour
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
        backBtn.addEventListener('click', closeOnboarding);
    }
    
    // Événement pour le bouton de fermeture
    const closeBtn = document.querySelector('.close-onboarding');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOnboarding);
    }
    
    // Événements clavier globaux
    document.addEventListener('keydown', handleGlobalKeyPress);
    
    // Gestion de la taille de fenêtre
    window.addEventListener('resize', debounce(handleWindowResize, 300));
}

// Gestion des touches clavier globales
function handleGlobalKeyPress(event) {
    switch (event.key) {
        case 'Escape':
            event.preventDefault();
            closeOnboarding();
            break;
        case 'F5':
            // Permettre le rechargement normal
            break;
        default:
            // Ne pas intercepter les autres touches
            break;
    }
}

// Gestion du redimensionnement de fenêtre
function handleWindowResize() {
    // Optionnel: recalculer les animations ou layouts si nécessaire
    console.log('Fenêtre redimensionnée');
}

// Animation d'entrée de la page
function animatePageEntry() {
    const container = document.querySelector('.onboarding-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        
        // Forcer le reflow
        container.offsetHeight;
        
        // Animer l'entrée
        container.style.transition = 'all 0.6s ease-out';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }
}

// Fermer la page onboarding/agents
function closeOnboarding() {
    console.log('Fermeture de la page agents');
    
    // Animation de sortie
    const container = document.querySelector('.onboarding-container');
    if (container) {
        container.style.transition = 'all 0.4s ease-in';
        container.style.opacity = '0';
        container.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            window.location.href = '/';
        }, 400);
    } else {
        window.location.href = '/';
    }
}

// Masquer les éléments de la page principale
function hideMainPageElements() {
    const elementsToHide = [
        '.conversations',
        '#conversations',
        '.sidebar-toggle',
        '.user-input-container',
        '.sidenav',
        '#librarySideNav',
        '#LinksSideNav',
        '.chat-main-container',
        '.gradient'
    ];
    
    elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
            }
        });
    });
}

// Afficher un message d'erreur
function showErrorMessage(message) {
    const agentsGrid = document.querySelector('.agents-grid');
    if (agentsGrid) {
        agentsGrid.innerHTML = `
            <div class="error-message">
                <h3>Erreur</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; border: none; background: #e74c3c; color: white; border-radius: 4px; cursor: pointer;">
                    Recharger la page
                </button>
            </div>
        `;
    }
}

// Vérification de compatibilité du navigateur
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'localStorage' in window,
        'addEventListener' in document,
        'querySelector' in document,
        'fetch' in window,
        'Promise' in window
    ];
    
    const isCompatible = requiredFeatures.every(feature => feature);
    
    if (!isCompatible) {
        console.warn('Navigateur non compatible détecté');
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; font-family: sans-serif; background: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <h2 style="color: #e74c3c; margin-bottom: 1rem;">Navigateur non supporté</h2>
                <p style="color: #666; margin-bottom: 2rem; max-width: 500px;">
                    Veuillez utiliser un navigateur plus récent (Chrome 60+, Firefox 55+, Safari 12+) pour accéder à nOg.
                </p>
                <a href="/" style="color: #667eea; text-decoration: none; padding: 0.8rem 2rem; border: 2px solid #667eea; border-radius: 4px; transition: all 0.3s;">
                    Continuer vers l'application
                </a>
            </div>
        `;
        return false;
    }
    
    return true;
}

// Utilitaire de debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Analytics/tracking
function trackAgentSelection(agentKey, agentTitle) {
    console.log(`Tracking: Agent sélectionné - ${agentKey}: ${agentTitle}`);
    
    // Sauvegarder dans localStorage pour l'instant
    const selections = JSON.parse(localStorage.getItem('agentSelections') || '[]');
    selections.push({
        agentKey,
        agentTitle,
        timestamp: new Date().toISOString()
    });
    
    // Garder seulement les 50 dernières sélections
    if (selections.length > 50) {
        selections.splice(0, selections.length - 50);
    }
    
    localStorage.setItem('agentSelections', JSON.stringify(selections));
    
    // TODO: Intégrer avec un vrai système d'analytics
    // Par exemple: gtag('event', 'agent_selection', { agent_key: agentKey });
}

// Fonction utilitaire pour obtenir les statistiques des agents
function getAgentSelectionStats() {
    const selections = JSON.parse(localStorage.getItem('agentSelections') || '[]');
    const stats = {};
    
    selections.forEach(selection => {
        stats[selection.agentKey] = (stats[selection.agentKey] || 0) + 1;
    });
    
    return stats;
}

// Nettoyage lors de la fermeture de la page
window.addEventListener('beforeunload', function() {
    // Nettoyer les événements si nécessaire
    document.removeEventListener('keydown', handleGlobalKeyPress);
    
    // Sauvegarder l'état si nécessaire
    const currentState = {
        lastVisit: new Date().toISOString(),
        agentsLoaded: Object.keys(agentsData).length
    };
    
    localStorage.setItem('agentsPageState', JSON.stringify(currentState));
});

// Fonction d'export pour le debugging
window.debugAgents = {
    agentsData,
    getSelectionStats: getAgentSelectionStats,
    regenerateCards: generateAgentCards,
    isInitialized: () => isInitialized
};

// Fonctions compatibilité pour l'ancien système (si appelées depuis d'autres fichiers)
function startChat() {
    console.log('Redirection vers le chat principal');
    closeOnboarding();
}

function skipOnboarding() {
    console.log('Fermeture de la page agents');
    closeOnboarding();
}

// Export des fonctions principales pour usage externe si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        agentsData,
        generateAgentCards,
        closeOnboarding,
        handleAgentSelection
    };
}
