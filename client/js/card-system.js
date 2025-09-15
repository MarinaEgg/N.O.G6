// ========== SYSTÈME DE CARTES MODULAIRE ==========

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

    createCard(cardData) {
        const CardClass = this.cardTypes.get(cardData.type);
        if (!CardClass) {
            console.error(`Type de carte inconnu: ${cardData.type}`);
            return null;
        }

        const card = new CardClass(cardData, this.workspaceManager);
        this.cards.set(cardData.id, card);
        
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

// ========== CLASSE DE BASE POUR LES CARTES ==========

class BaseCard {
    constructor(cardData, workspaceManager) {
        this.data = cardData;
        this.workspaceManager = workspaceManager;
        this.element = null;
        this.type = cardData.type;
        
        this.createElement();
        this.render();        // D'ABORD le HTML
        this.setupEvents();   // ENSUITE les événements
    }

    createElement() {
        this.element = CardSystem.createBaseCardElement(this.data);
        this.workspaceManager.canvas.appendChild(this.element);
    }

    setupEvents() {
        CardSystem.setupCommonCardEvents(this.element, this);
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
        localStorage.setItem(`workspace-card-${this.data.id}`, JSON.stringify(this.data));
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
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardSystem, BaseCard };
} else {
    window.CardSystem = CardSystem;
    window.BaseCard = BaseCard;
}
