// État des agents (actif/inactif)
let agentStates = {};

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
let isTransitioning = false;

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
    
    // Déclencher l'animation d'entrée après un court délai
    setTimeout(() => {
        showOnboardingPage();
    }, 100);
    
    isInitialized = true;
    console.log('Page agents initialisée avec succès');
});

// Fonction pour afficher la page avec transition
function showOnboardingPage() {
    const container = document.querySelector('.onboarding-container');
    if (container) {
        container.classList.add('visible');
        
        // Animer les cartes après que le container soit visible
        setTimeout(() => {
            animateCardsEntrance();
        }, 200);
    }
}

// Fonction d'initialisation principale
function initializeAgentsPage() {
    try {
        // Générer les cartes d'agents
        generateAgentCards();
        // Ajouter la fonctionnalité de recherche
        setupSearchFunctionality();
        // Charger les états des agents
        loadAgentStates();
        // Gérer les événements globaux
        setupGlobalEventListeners();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showErrorMessage('Erreur lors du chargement des agents');
    }
}

// Animation d'entrée des cartes
function animateCardsEntrance() {
    const cards = document.querySelectorAll('.agent-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${0.1 * (index + 1)}s`;
        card.classList.add('animate-in');
    });
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
    card.className = 'agent-card is-visible'; // Ajout de is-visible pour la recherche
    card.dataset.agentId = key;
    card.dataset.index = index;
    
    // Vérifier l'état actif/inactif de l'agent
    const isActive = agentStates[key] || false;
    
    card.innerHTML = `
        <div class="agent-header">
            <h3 class="agent-title">${agent.title}</h3>
            <span class="agent-context">${agent.context}</span>
        </div>
        <p class="agent-description">${agent.body}</p>
        <div class="agent-controls">
            <div class="agent-status">
                <div class="status-checkbox ${isActive ? 'checked' : ''}" data-agent-id="${key}"></div>
                <span class="status-label ${isActive ? 'active' : 'inactive'}">${isActive ? 'Actif' : 'Inactif'}</span>
            </div>
        </div>
    `;
    
    // Ajouter les événements
    addCardEventListeners(card, key, agent);
    
    return card;
}

// Ajouter les événements aux cartes
function addCardEventListeners(card, key, agent) {
    // Événement de clic sur la carte (sauf sur la checkbox)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.status-checkbox')) {
            e.preventDefault();
            handleAgentSelection(key, agent, card);
        }
    });
    
    // Récupérer les éléments de contrôle d'état
    const checkbox = card.querySelector('.status-checkbox');
    const statusLabel = card.querySelector('.status-label');
    
    // Événement pour la checkbox
    if (checkbox && statusLabel) {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAgentStatus(key, checkbox, statusLabel);
        });
    }
    
    // Événements clavier pour l'accessibilité
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (e.target.classList.contains('status-checkbox')) {
                toggleAgentStatus(key, checkbox, statusLabel);
            } else {
                handleAgentSelection(key, agent, card);
            }
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
    
    // Analytics optionnel
    trackAgentSelection(key, agent.title);
}

// Configuration des événements globaux
function setupGlobalEventListeners() {
    // Événement pour le bouton retour
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeOnboarding();
        });
    }
    
    // Événement pour le bouton de fermeture
    const closeBtn = document.querySelector('.close-onboarding');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeOnboarding();
        });
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
    console.log('Fenêtre redimensionnée');
}
function closeOnboarding() {
    if (isTransitioning) return;
    
    console.log('Fermeture fluide de la page agents');
    isTransitioning = true;
    
    const container = document.querySelector('.onboarding-container');
    if (container) {
        // Démarrer l'animation de sortie
        container.classList.add('exiting');
        container.classList.remove('visible');
        
        // Redirection à mi-parcours de l'animation pour éviter l'interruption
        setTimeout(() => {
            window.location.href = '/';
        }, 200); // 200ms = moitié de l'animation de 400ms
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

// Restaurer les éléments de la page principale
function showMainPageElements() {
    const elementsToShow = [
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
    
    elementsToShow.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) {
                element.style.display = '';
                element.style.visibility = '';
                element.classList.remove('hidden');
            }
        });
    });
    
    // Supprimer le mode onboarding
    document.body.classList.remove('onboarding-active');
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
}

// Fonction utilitaire pour obtenir les statistiques des agents
function getAgentSelectionStats() {
    const stats = {
        total: Object.keys(agentsData).length,
        selected: 0,
        unselected: 0,
        active: Object.values(agentStates).filter(state => state).length,
        inactive: Object.values(agentStates).filter(state => !state).length
    };
    
    // Compter les agents sélectionnés
    Object.values(agentsData).forEach(agent => {
        if (agent.isSelected) {
            stats.selected++;
        } else {
            stats.unselected++;
        }
    });
    
    return stats;
}

// Basculer l'état actif/inactif d'un agent
function toggleAgentStatus(agentId, checkbox, statusLabel) {
    // Basculer l'état
    agentStates[agentId] = !agentStates[agentId];
    const isActive = agentStates[agentId];
    
    // Mettre à jour l'interface
    if (checkbox) {
        checkbox.classList.toggle('checked', isActive);
    }
    
    if (statusLabel) {
        statusLabel.textContent = isActive ? 'Actif' : 'Inactif';
        statusLabel.classList.toggle('active', isActive);
        statusLabel.classList.toggle('inactive', !isActive);
    }
    
    // Sauvegarder l'état
    saveAgentStates();
    
    // Mettre à jour le compteur d'agents actifs
    updateActiveAgentsCount();
}

// Sauvegarder les états des agents dans le localStorage
function saveAgentStates() {
    try {
        localStorage.setItem('agentStates', JSON.stringify(agentStates));
    } catch (e) {
        console.error('Erreur lors de la sauvegarde des états des agents:', e);
    }
}

// Charger les états des agents depuis le localStorage
function loadAgentStates() {
    try {
        const savedStates = localStorage.getItem('agentStates');
        if (savedStates) {
            agentStates = JSON.parse(savedStates);
            // S'assurer que tous les agents ont un état défini
            Object.keys(agentsData).forEach(key => {
                if (agentStates[key] === undefined) {
                    agentStates[key] = false; // Valeur par défaut
                }
            });
        } else {
            // Initialiser tous les agents comme inactifs par défaut
            Object.keys(agentsData).forEach(key => {
                agentStates[key] = false;
            });
        }
    } catch (e) {
        console.error('Erreur lors du chargement des états des agents:', e);
        // Initialiser avec des valeurs par défaut en cas d'erreur
        Object.keys(agentsData).forEach(key => {
            agentStates[key] = false;
        });
    }
}

// Mettre à jour le compteur d'agents actifs
function updateActiveAgentsCount() {
    const count = Object.values(agentStates).filter(state => state).length;
    const counter = document.querySelector('.active-agents-count');
    if (counter) {
        counter.textContent = `${count} ${count === 1 ? 'agent actif' : 'agents actifs'}`;
    }
}

// Configurer la fonctionnalité de recherche
function setupSearchFunctionality() {
    const searchInput = document.getElementById('agent-search');
    const noResultsMessage = document.querySelector('.no-results-message');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        filterAgents(searchTerm);
    });
    
    // Ajouter un bouton pour effacer la recherche
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-search';
    clearButton.innerHTML = '&times;';
    clearButton.setAttribute('aria-label', 'Effacer la recherche');
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        showAllAgents();
        searchInput.focus();
    });
    
    const searchContainer = searchInput.parentElement;
    searchContainer.appendChild(clearButton);
    
    // Gérer la visibilité du bouton d'effacement
    searchInput.addEventListener('input', () => {
        clearButton.style.display = searchInput.value ? 'block' : 'none';
    });
    
    // Initialiser l'état du bouton d'effacement
    clearButton.style.display = 'none';
}

// Filtrer les agents en fonction du terme de recherche
function filterAgents(searchTerm) {
    const agentCards = document.querySelectorAll('.agent-card');
    const noResultsMessage = document.querySelector('.no-results-message');
    let visibleCount = 0;
    
    if (!searchTerm) {
        showAllAgents();
        return;
    }
    
    agentCards.forEach(card => {
        const title = card.querySelector('.agent-title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.agent-description')?.textContent.toLowerCase() || '';
        const context = card.querySelector('.agent-context')?.textContent.toLowerCase() || '';
        
        const isMatch = title.includes(searchTerm) || 
                        description.includes(searchTerm) || 
                        context.includes(searchTerm);
        
        if (isMatch) {
            card.classList.add('is-visible');
            visibleCount++;
        } else {
            card.classList.remove('is-visible');
        }
    });
    
    // Afficher/masquer le message "Aucun résultat"
    if (noResultsMessage) {
        noResultsMessage.style.display = visibleCount > 0 ? 'none' : 'block';
    }
}

// Afficher tous les agents
function showAllAgents() {
    const agentCards = document.querySelectorAll('.agent-card');
    const noResultsMessage = document.querySelector('.no-results-message');
    
    agentCards.forEach(card => {
        card.classList.add('is-visible');
    });
    
    if (noResultsMessage) {
        noResultsMessage.style.display = 'none';
    }
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
