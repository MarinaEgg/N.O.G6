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

// === SYSTÈME DE RECHERCHE AMÉLIORÉ POUR LES AGENTS ===

// 1. Fonction de normalisation du texte
function normalizeText(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .normalize('NFD') // Décompose les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
        .replace(/[^\w\s]/g, ' ') // Remplace la ponctuation par des espaces
        .replace(/\s+/g, ' ') // Normalise les espaces multiples
        .trim();
}

// 2. Index de recherche avec mots-clés et synonymes
const searchIndex = {
    contractAnalysis: {
        keywords: ['contrat', 'juridique', 'risque', 'analyse', 'clause', 'accord', 'fusion', 'acquisition'],
        synonymes: ['legal', 'droit', 'transaction', 'due diligence']
    },
    caseLawResearch: {
        keywords: ['precedent', 'jurisprudence', 'recherche', 'strategie', 'avocat', 'loi'],
        synonymes: ['case law', 'legal research', 'tribunal', 'cour']
    },
    meetingPrep: {
        keywords: ['reunion', 'meeting', 'note', 'tache', 'organisation', 'decision'],
        synonymes: ['rdv', 'rencontre', 'briefing', 'debriefing', 'cr', 'compte rendu']
    },
    wikiBuilder: {
        keywords: ['wiki', 'connaissance', 'documentation', 'interne', 'knowledge'],
        synonymes: ['base de donnees', 'kb', 'doc', 'savoir']
    },
    auditTrail: {
        keywords: ['ia', 'instruction', 'prompt', 'amelioration', 'optimisation'],
        synonymes: ['ai', 'llm', 'chatbot', 'bot']
    },
    supplierCompliance: {
        keywords: ['conformite', 'politique', 'compliance', 'obligation', 'reglementation'],
        synonymes: ['audit', 'controle', 'verification']
    },
    quotationAgent: {
        keywords: ['devis', 'quotation', 'vente', 'tarif', 'prix', 'commercial'],
        synonymes: ['quote', 'estimation', 'facturation', 'b2b']
    },
    clientOnboarding: {
        keywords: ['veille', 'concurrence', 'concurrent', 'marche', 'intelligence'],
        synonymes: ['benchmark', 'analyse marche', 'competitive intelligence']
    },
    techIntelligence: {
        keywords: ['veille', 'technologie', 'tech', 'innovation', 'rd', 'recherche'],
        synonymes: ['r&d', 'innovation', 'startup', 'digital']
    },
    rfpDrafting: {
        keywords: ['depense', 'juridique', 'facture', 'suisse', 'finance', 'budget'],
        synonymes: ['billing', 'comptabilite', 'ocg', 'controle']
    },
    esgCompliance: {
        keywords: ['reporting', 'financier', 'performance', 'tableau', 'bord', 'bi'],
        synonymes: ['dashboard', 'kpi', 'power bi', 'tableau']
    },
    dataPrivacyAudit: {
        keywords: ['fiscal', 'fiscalite', 'taxe', 'impot', 'conformite'],
        synonymes: ['tax', 'taxation', 'optimisation fiscale']
    }
};

// 3. Fonction de calcul de score de pertinence
function calculateRelevanceScore(agentId, searchTerms, agentData) {
    let score = 0;
    const index = searchIndex[agentId] || { keywords: [], synonymes: [] };
    
    // Récupérer le contenu de l'agent
    const content = [
        agentData.title,
        agentData.context,
        agentData.body
    ].join(' ');
    
    const normalizedContent = normalizeText(content);
    const allKeywords = [...index.keywords, ...index.synonymes];
    
    searchTerms.forEach(term => {
        const normalizedTerm = normalizeText(term);
        
        // Score pour correspondance exacte dans le titre (poids fort)
        if (normalizeText(agentData.title).includes(normalizedTerm)) {
            score += 10;
        }
        
        // Score pour correspondance dans le contexte (poids moyen)
        if (normalizeText(agentData.context).includes(normalizedTerm)) {
            score += 5;
        }
        
        // Score pour correspondance dans la description (poids faible)
        if (normalizeText(agentData.body).includes(normalizedTerm)) {
            score += 2;
        }
        
        // Score pour mots-clés indexés (poids fort)
        allKeywords.forEach(keyword => {
            if (normalizeText(keyword).includes(normalizedTerm) || 
                normalizedTerm.includes(normalizeText(keyword))) {
                score += 8;
            }
        });
        
        // Score pour correspondance floue (Levenshtein simplifié)
        allKeywords.forEach(keyword => {
            if (fuzzyMatch(normalizedTerm, normalizeText(keyword))) {
                score += 3;
            }
        });
    });
    
    return score;
}

// 4. Fonction de correspondance floue simple
function fuzzyMatch(term, keyword, threshold = 0.7) {
    if (term === keyword) return true;
    if (term.length < 3 || keyword.length < 3) return false;
    
    // Vérifier les sous-chaînes communes
    const minLength = Math.min(term.length, keyword.length);
    let matches = 0;
    
    for (let i = 0; i < minLength; i++) {
        if (term[i] === keyword[i]) matches++;
    }
    
    return (matches / Math.max(term.length, keyword.length)) >= threshold;
}

// 5. Fonction de recherche avancée avec suggestions
function advancedSearch(query) {
    if (!query || query.trim().length < 2) {
        return {
            results: Object.keys(agentsData),
            suggestions: [],
            hasResults: true
        };
    }
    
    const searchTerms = normalizeText(query).split(' ').filter(term => term.length > 1);
    const results = [];
    
    // Calculer les scores pour chaque agent
    Object.entries(agentsData).forEach(([agentId, agentData]) => {
        const score = calculateRelevanceScore(agentId, searchTerms, agentData);
        if (score > 0) {
            results.push({ agentId, score });
        }
    });
    
    // Trier par score décroissant
    results.sort((a, b) => b.score - a.score);
    
    const agentIds = results.map(r => r.agentId);
    
    // Générer des suggestions si peu de résultats
    let suggestions = [];
    if (results.length < 3) {
        suggestions = generateSearchSuggestions(query, searchTerms);
    }
    
    return {
        results: agentIds,
        suggestions,
        hasResults: agentIds.length > 0,
        scores: results
    };
}

// 6. Génération de suggestions intelligentes
function generateSearchSuggestions(originalQuery, searchTerms) {
    const suggestions = new Set();
    
    // Suggestions basées sur les mots-clés populaires
    const popularKeywords = [
        'reunion', 'contrat', 'juridique', 'veille', 'finance', 
        'conformite', 'devis', 'analyse', 'ia', 'reporting'
    ];
    
    searchTerms.forEach(term => {
        popularKeywords.forEach(keyword => {
            if (keyword.includes(term) || term.includes(keyword)) {
                suggestions.add(keyword);
            }
            
            // Suggestions phonétiquement similaires
            if (fuzzyMatch(term, keyword, 0.6)) {
                suggestions.add(keyword);
            }
        });
    });
    
    // Limiter à 5 suggestions maximum
    return Array.from(suggestions).slice(0, 5);
}

// 7. Interface utilisateur avec suggestions
function createSearchSuggestions(suggestions, searchInput) {
    // Supprimer les anciennes suggestions
    const existingSuggestions = document.querySelector('.search-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    if (suggestions.length === 0) return;
    
    // Créer le conteneur de suggestions
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.innerHTML = `
        <div class="suggestions-header">Essayez ces termes :</div>
        ${suggestions.map(suggestion => 
            `<button class="suggestion-item" data-suggestion="${suggestion}">
                ${suggestion}
            </button>`
        ).join('')}
    `;
    
    // Positionner sous l'input de recherche
    searchInput.parentElement.appendChild(suggestionsContainer);
    
    // Gérer les clics sur les suggestions
    suggestionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-item')) {
            const suggestion = e.target.dataset.suggestion;
            searchInput.value = suggestion;
            filterAgentsAdvanced(suggestion);
            suggestionsContainer.remove();
            searchInput.focus();
        }
    });
}

// 8. Fonction principale de filtrage amélioré
function filterAgentsAdvanced(searchTerm) {
    const agentCards = document.querySelectorAll('.agent-card');
    const noResultsMessage = document.querySelector('.no-results-message');
    const searchInput = document.getElementById('agent-search');
    
    // Effectuer la recherche avancée
    const searchResult = advancedSearch(searchTerm);
    
    // Afficher/masquer les cartes selon les résultats
    agentCards.forEach(card => {
        const agentId = card.dataset.agentId;
        const shouldShow = searchResult.results.includes(agentId);
        
        if (shouldShow) {
            card.classList.add('is-visible');
            // Ajouter un indicateur de score pour le debug (optionnel)
            const scoreInfo = searchResult.scores.find(s => s.agentId === agentId);
            if (scoreInfo && window.DEBUG_SEARCH) {
                card.dataset.searchScore = scoreInfo.score;
            }
        } else {
            card.classList.remove('is-visible');
        }
    });
    
    // Gérer le message "Aucun résultat" et les suggestions
    if (noResultsMessage) {
        if (searchResult.hasResults) {
            noResultsMessage.style.display = 'none';
        } else {
            noResultsMessage.style.display = 'block';
            noResultsMessage.innerHTML = `
                <h3>Aucun agent trouvé pour "${searchTerm}"</h3>
                <p>Vérifiez l'orthographe ou essayez des termes plus généraux.</p>
            `;
        }
    }
    
    // Afficher les suggestions si nécessaire
    if (searchTerm && searchResult.suggestions.length > 0 && !searchResult.hasResults) {
        createSearchSuggestions(searchResult.suggestions, searchInput);
    }
    
    // Log pour le debug
    console.log(`Recherche "${searchTerm}":`, {
        results: searchResult.results.length,
        suggestions: searchResult.suggestions,
        scores: searchResult.scores
    });
}

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

// Fonction d'initialisation principale - ORDRE CORRIGÉ
function initializeAgentsPage() {
    try {
        // 1. D'abord charger les états des agents
        loadAgentStates();
        
        // 2. Générer les cartes d'agents
        generateAgentCards();
        
        // 3. Puis initialiser la recherche avancée
        initAdvancedSearch();
        
        // 4. Enfin gérer les événements globaux
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
    // CORRECTION - Chercher le conteneur dans la nouvelle structure
    let container = document.querySelector('.onboarding-container .agents-grid-container');
    
    if (!container) {
        // Créer la structure si elle n'existe pas
        const onboardingContainer = document.querySelector('.onboarding-container');
        if (onboardingContainer) {
            const mainElement = document.createElement('main');
            mainElement.className = 'agents-grid-container';
            mainElement.innerHTML = `
                <div class="agents-grid" id="agents-grid">
                    <!-- Les cartes seront générées ici -->
                </div>
                <div class="no-results-message" id="no-results" style="display: none;">
                    Aucun agent ne correspond à votre recherche.
                </div>
            `;
            onboardingContainer.appendChild(mainElement);
        }
    }
}

// Créer une carte d'agent - VERSION CORRIGÉE
function createAgentCard(key, agent, index) {
    const card = document.createElement('div');
    card.className = 'agent-card is-visible';
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
                <div class="status-checkbox ${isActive ? 'checked' : ''}" data-agent-id="${key}" tabindex="0" role="checkbox" aria-checked="${isActive}"></div>
                <span class="status-label ${isActive ? 'active' : 'inactive'}">${isActive ? 'Actif' : 'Inactif'}</span>
            </div>
        </div>
    `;
    
    // Ajouter les événements - VERSION AMÉLIORÉE
    addCardEventListeners(card, key, agent);
    
    return card;
}

// CORRECTION - Ajouter les événements aux cartes - VERSION AMÉLIORÉE
function addCardEventListeners(card, key, agent) {
    // Récupérer les éléments de contrôle d'état
    const checkbox = card.querySelector('.status-checkbox');
    const statusLabel = card.querySelector('.status-label');
    
    // CORRECTION - Événement spécifique pour la checkbox avec propagation stoppée
    if (checkbox && statusLabel) {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Checkbox clicked for:', key); // Debug
            toggleAgentStatus(key, checkbox, statusLabel);
        });
        
        // AJOUT - Événement pour le label aussi
        statusLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Status label clicked for:', key); // Debug
            toggleAgentStatus(key, checkbox, statusLabel);
        });
    }
    
    // Événement de clic sur la carte (sauf sur les contrôles)
    card.addEventListener('click', (e) => {
        // AMÉLIORATION - Vérifier plus précisément les zones de contrôle
        if (!e.target.closest('.agent-controls')) {
            e.preventDefault();
            handleAgentSelection(key, agent, card);
        }
    });
    
    // Événements clavier pour l'accessibilité
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (e.target.classList.contains('status-checkbox') || e.target.classList.contains('status-label')) {
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
    
    // AJOUT - Rendre la checkbox focusable aussi
    if (checkbox) {
        checkbox.setAttribute('tabindex', '0');
        checkbox.setAttribute('role', 'checkbox');
        checkbox.setAttribute('aria-label', `Activer/désactiver l'agent ${agent.title}`);
    }
    
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
        // AJOUT - Masquer immédiatement tous les éléments de blur en arrière-plan
        const gradientElements = document.querySelectorAll('.gradient');
        gradientElements.forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.style.opacity = '0';
            }
        });
        
        // Démarrer l'animation de sortie
        container.classList.add('exiting');
        container.classList.remove('visible');
        
        // MODIFICATION - Réduire le délai pour éviter le flicker
        setTimeout(() => {
            // Restaurer le overflow du body
            document.body.style.overflow = '';
            window.location.href = '/';
        }, 150); // Réduit de 200ms à 150ms
    } else {
        window.location.href = '/';
    }
}

// Fonction modifiée pour masquer les éléments de la page principale
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
        '.gradient' // DÉJÀ PRÉSENT - BIEN
    ];
    
    elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.style.opacity = '0'; // AJOUT
                element.style.zIndex = '-1'; // AJOUT pour forcer en arrière-plan
            }
        });
    });
    
    // AJOUT - Forcer le masquage du body overflow pendant l'onboarding
    document.body.style.overflow = 'hidden';
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
    console.log('Toggling agent status for:', agentId); // Debug
    
    // Basculer l'état
    agentStates[agentId] = !agentStates[agentId];
    const isActive = agentStates[agentId];
    
    console.log('New state:', isActive); // Debug
    
    // Mettre à jour l'interface
    if (checkbox) {
        if (isActive) {
            checkbox.classList.add('checked');
            checkbox.setAttribute('aria-checked', 'true');
        } else {
            checkbox.classList.remove('checked');
            checkbox.setAttribute('aria-checked', 'false');
        }
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
    
    // Focus sur la checkbox pour l'accessibilité
    if (checkbox) {
        checkbox.focus();
    }
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

// Configurer la fonctionnalité de recherche avancée
function setupAdvancedSearchFunctionality() {
    const searchInput = document.getElementById('agent-search');
    if (!searchInput) return;
    
    // Nouveau event listener avec debounce pour les performances
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();
        
        // Recherche en temps réel avec un petit délai
        searchTimeout = setTimeout(() => {
            filterAgentsAdvanced(searchTerm);
        }, 200);
        
        // Masquer les suggestions quand on tape
        const suggestions = document.querySelector('.search-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    });
    
    // Gérer la touche Entrée pour une recherche immédiate
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            filterAgentsAdvanced(e.target.value.trim());
        }
    });
    
    // Ajouter un bouton pour effacer la recherche
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-search';
    clearButton.innerHTML = '&times;';
    clearButton.setAttribute('aria-label', 'Effacer la recherche');
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        // Déclencher l'événement input pour mettre à jour la recherche
        searchInput.dispatchEvent(new Event('input'));
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

// Initialisation du nouveau système de recherche
function initAdvancedSearch() {
    // Ajouter les styles CSS pour les suggestions
    if (!document.getElementById('search-suggestions-styles')) {
        const style = document.createElement('style');
        style.id = 'search-suggestions-styles';
        style.textContent = `
            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                margin-top: 4px;
                overflow: hidden;
            }
            
            .suggestions-header {
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 600;
                color: #666;
                background: #f8f9fa;
                border-bottom: 1px solid #eee;
            }
            
            .suggestion-item {
                display: block;
                width: 100%;
                padding: 10px 12px;
                border: none;
                background: none;
                text-align: left;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }
            
            .suggestion-item:hover {
                background-color: #f0f8ff;
            }
            
            .clear-search {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                font-size: 18px;
                color: #999;
                cursor: pointer;
                width: 24px;
                height: 24px;
                display: none;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                z-index: 10;
            }
            
            .clear-search:hover {
                background-color: rgba(0,0,0,0.1);
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Activer la recherche avancée
    setupAdvancedSearchFunctionality();
    
    console.log('Système de recherche avancé initialisé');
}

// AJOUT - Fonction d'initialisation immédiate au chargement
(function immediateInit() {
    // Masquer immédiatement les éléments problématiques avant le DOMContentLoaded
    const style = document.createElement('style');
    style.textContent = `
        .gradient { 
            display: none !important; 
            opacity: 0 !important; 
            visibility: hidden !important;
            backdrop-filter: none !important;
        }
        body { overflow: hidden !important; }
    `;
    document.head.appendChild(style);
})();

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
    isInitialized: () => isInitialized,
    searchDebug: {
        advancedSearch,
        normalizeText,
        calculateRelevanceScore,
        searchIndex
    }
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
