// FONCTION UTILITAIRE INTÉGRÉE

/**
 * Creates a new card data object with default values
 * @param {Object} overrides - Values to override defaults
 * @returns {Object} Complete card data object
 */
function createCardData(overrides = {}) {
    const defaults = {
        id: CardSystem.generateCardId(),
        type: 'text',
        title: 'TITRE',                    
        position: { x: 100, y: 100 },
        pinned: false,
        folders: [],
        documentType: 'other',
        classification: 'Internal',
        syncStatus: 'synced',
        lastModified: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        metadata: {}
    };

    return { ...defaults, ...overrides };
}

// SYSTÈME DE CARTES PRINCIPAL

class CardSystem {
    constructor(workspaceManager) {
        this.workspaceManager = workspaceManager;
        this.cardTypes = new Map();
        this.cards = new Map();
        
        this.registerCardTypes();
    }

    registerCardTypes() {
        // Enregistrer les types de cartes
        this.cardTypes.set('text', TextCard);
        this.cardTypes.set('file', FileCard);
    }

    /**
     * Creates a new card with the given data
     * @param {Object} cardData - Card data
     * @returns {BaseCard|null} The created card instance or null if failed
     */
    createCard(cardData) {
        // Merge with default values
        const fullCardData = createCardData(cardData);
        
        const CardClass = this.cardTypes.get(fullCardData.type);
        if (!CardClass) {
            console.error(`Type de carte inconnu: ${fullCardData.type}`);
            return null;
        }

        const card = new CardClass(fullCardData, this.workspaceManager);
        this.cards.set(fullCardData.id, card);
        
        return card;
    }

    getCard(cardId) {
        return this.cards.get(cardId);
    }

    deleteCard(cardId) {
        const card = this.cards.get(cardId);
        if (card) {
            card.destroy();
            this.cards.delete(cardId);
        }
    }

    getCardsByType(type) {
        return Array.from(this.cards.values()).filter(card => card.type === type);
    }

    // Méthodes utilitaires communes
    static generateCardId(type = 'card') {
        return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    static createBaseCardElement(cardData) {
        const cardElement = document.createElement('div');
        cardElement.className = `workspace-card card-${cardData.type}`;
        cardElement.id = cardData.id;
        cardElement.setAttribute('data-card-id', cardData.id);
        cardElement.setAttribute('data-card-type', cardData.type);
        cardElement.style.left = cardData.position.x + 'px';
        cardElement.style.top = cardData.position.y + 'px';
        
        if (cardData.pinned) {
            cardElement.classList.add('pinned');
        }

        return cardElement;
    }

    static createCardHeader(cardData, actions = []) {
        const defaultActions = [
            { 
                class: 'pin-btn', 
                icon: 'fas fa-thumbtack', 
                title: 'Épingler',
                pinned: cardData.pinned 
            },
            { 
                class: 'delete-btn', 
                icon: 'fas fa-trash', 
                title: 'Supprimer' 
            }
        ];

        const allActions = [...actions, ...defaultActions];

        return `
            <div class="card-header">
                <h3 class="card-title" contenteditable="true" id="main-title-${cardData.id}">${cardData.mainTitle || cardData.title || 'TITRE'}</h3>
                <div class="card-actions">
                    ${allActions.map(action => `
                        <button class="card-action-btn ${action.class} ${action.pinned ? 'pinned' : ''}" 
                                title="${action.title}" 
                                data-card-id="${cardData.id}">
                            <i class="${action.icon}"></i>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    static setupCommonCardEvents(cardElement, card) {
        // Events de drag
        cardElement.addEventListener('mousedown', (e) => {
            card.workspaceManager.handleMouseDown(e, cardElement);
        });

        // Click pour sélection
        cardElement.addEventListener('click', (e) => {
            if (!card.workspaceManager.isDragging) {
                card.workspaceManager.selectCard(cardElement);
            }
        });

        // Actions communes
        const pinBtn = cardElement.querySelector('.pin-btn');
        const deleteBtn = cardElement.querySelector('.delete-btn');
        
        pinBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            card.togglePin();
        });
        
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            card.delete();
        });

        // Empêcher le drag sur le titre contenteditable
        const cardTitle = cardElement.querySelector('.card-title');
        if (cardTitle) {
            cardTitle.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Empêche le drag
            });
            
            cardTitle.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche la sélection de carte
            });
        }
    }
}

// CLASSE DE BASE POUR LES CARTES

/**
 * Base class for all card types
 */
class BaseCard {
    /**
     * @param {Object} cardData 
     * @param {WorkspaceManager} workspaceManager 
     */
    constructor(cardData, workspaceManager) {
        // Merge with default values to ensure all properties are present
        this.data = createCardData(cardData);
        this.workspaceManager = workspaceManager;
        this.element = null;
        this.type = this.data.type;
        
        // Initialize sync status if not provided
        if (!this.data.syncStatus) {
            this.data.syncStatus = 'synced';
        }
        
        this.createElement();
        this.render();        // D'ABORD le HTML
        this.setupEvents();   // ENSUITE les événements
    }

    createElement() {
        this.element = CardSystem.createBaseCardElement(this.data);
        
        // Add sync status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `sync-status ${this.data.syncStatus}`;
        statusIndicator.title = this.getSyncStatusText();
        this.element.appendChild(statusIndicator);
        
        this.workspaceManager.canvas.appendChild(this.element);
    }

    getSyncStatusText() {
        const statusTexts = {
            'synced': 'Synchronisé',
            'modified': 'Modifié localement',
            'conflict': 'Conflit de version',
            'pending': 'Synchronisation en cours...'
        };
        return statusTexts[this.data.syncStatus] || 'Statut inconnu';
    }

    updateSyncStatus(status) {
        this.data.syncStatus = status;
        const indicator = this.element.querySelector('.sync-status');
        if (indicator) {
            indicator.className = `sync-status ${status}`;
            indicator.title = this.getSyncStatusText();
        }
    }

    setupEvents() {
        if (!this.element) return;
        
        // Gestion du drag
        this.element.addEventListener('mousedown', (e) => {
            if (e.target.closest('.card-action-btn')) return;
            this.workspaceManager.handleMouseDown(e, this.element);
        });
        
        // Gestion du clic pour sélection
        this.element.addEventListener('click', (e) => {
            if (e.target.closest('.card-action-btn')) return;
            this.workspaceManager.selectCard(this.element);
        });
        
        // Update sync status on title edit
        const titleElement = this.element.querySelector('.card-title');
        if (titleElement) {
            titleElement.addEventListener('input', () => {
                if (this.data.syncStatus === 'synced') {
                    this.updateSyncStatus('modified');
                }
            });
        }
        
        this.setupSpecificEvents();
    }

    setupSpecificEvents() {
        // À implémenter dans les classes filles
    }

    render() {
        this.element.innerHTML = this.getHTML();
        this.afterRender();
    }

    getHTML() {
        // À implémenter dans les classes filles
        return '';
    }

    afterRender() {
        // Hook pour les actions post-render
    }

    togglePin() {
        const isPinned = this.element.classList.toggle('pinned');
        this.data.pinned = isPinned;
        
        const pinBtn = this.element.querySelector('.pin-btn');
        
        if (isPinned) {
            pinBtn.classList.add('pinned');
            pinBtn.title = 'Désépingler';
        } else {
            pinBtn.classList.remove('pinned');
            pinBtn.title = 'Épingler';
        }
        
        this.saveData();
    }

    delete() {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
            this.destroy();
            this.workspaceManager.cardSystem.deleteCard(this.data.id);
            
            // Supprimer de la liste workspace
            this.workspaceManager.cards = this.workspaceManager.cards.filter(
                card => card.data && card.data.id !== this.data.id
            );
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
        }
        this.cleanup();
    }

    cleanup() {
        // Hook pour le nettoyage spécifique
    }

    saveData() {
        // Sauvegarder les données de la carte
        try {
            localStorage.setItem(`workspace-card-${this.data.id}`, JSON.stringify(this.data));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, saving in memory only');
                // Les données restent en mémoire dans this.data
            } else {
                console.error('Error saving card data:', error);
            }
        }
    }

    updatePosition(x, y) {
        this.data.position.x = x;
        this.data.position.y = y;
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        this.saveData();
    }

    select() {
        this.workspaceManager.selectCard(this.element);
    }

    // Méthode pour récupérer le contenu pour sync (à implémenter dans les classes filles)
    getContentForSync() {
        return this.data.title || '';
    }
}

// EXPORT GLOBAL

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardSystem, BaseCard, createCardData };
} else {
    // Variables globales pour utilisation dans le browser
    window.CardSystem = CardSystem;
    window.BaseCard = BaseCard;
    window.createCardData = createCardData;
}
