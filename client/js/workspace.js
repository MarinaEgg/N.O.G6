class WorkspaceManager {
    constructor() {
        this.cards = [];
        this.selectedCard = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.canvas = null;
        this.addCardBtn = null;
        this.saveLayoutBtn = null;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        this.canvas = document.getElementById('workspaceCanvas');
        this.addCardBtn = document.getElementById('addCardBtn');
        this.saveLayoutBtn = document.getElementById('saveLayoutBtn');

        if (!this.canvas) {
            console.warn('Workspace elements not found, retrying...');
            setTimeout(() => this.setupElements(), 100);
            return;
        }

        this.setupEventListeners();
        this.loadDefaultCards();
        console.log('WorkspaceManager initialized');
    }

    setupEventListeners() {
        this.addCardBtn?.addEventListener('click', () => this.showAddCardDialog());
        this.saveLayoutBtn?.addEventListener('click', () => this.saveLayout());
        
        // Events globaux pour le drag & drop
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
    }

    loadDefaultCards() {
        const defaultCards = [
            {
                id: 'card-1',
                title: 'Due Diligence',
                theme: 'Analyse Juridique',
                description: 'Documents et analyses pour les opérations de due diligence',
                position: { x: 50, y: 50 },
                stats: { documents: 24, lastUpdate: '2 heures' },
                pinned: false
            },
            {
                id: 'card-2', 
                title: 'Contrats Commerciaux',
                theme: 'Rédaction',
                description: 'Modèles et révisions de contrats commerciaux',
                position: { x: 350, y: 50 },
                stats: { documents: 18, lastUpdate: '1 jour' },
                pinned: true
            },
            {
                id: 'card-3',
                title: 'Compliance',
                theme: 'Conformité',
                description: 'Suivi réglementaire et conformité juridique',
                position: { x: 50, y: 300 },
                stats: { documents: 31, lastUpdate: '3 heures' },
                pinned: false
            }
        ];

        defaultCards.forEach(cardData => this.createCard(cardData));
    }

    createCard(cardData) {
        const cardElement = document.createElement('div');
        cardElement.className = 'workspace-card';
        cardElement.id = cardData.id;
        cardElement.style.left = cardData.position.x + 'px';
        cardElement.style.top = cardData.position.y + 'px';
        
        if (cardData.pinned) {
            cardElement.classList.add('pinned');
        }

        cardElement.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${cardData.title}</h3>
                <div class="card-actions">
                    <button class="card-action-btn pin-btn ${cardData.pinned ? 'pinned' : ''}" title="Épingler">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button class="card-action-btn" title="Paramètres">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="card-action-btn delete-btn" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <div class="card-theme">${cardData.theme}</div>
                <p class="card-description">${cardData.description}</p>
                <div class="card-stats">
                    <div class="card-stat">
                        <i class="fas fa-file"></i>
                        <span>${cardData.stats.documents} docs</span>
                    </div>
                    <div class="card-stat">
                        <i class="fas fa-clock"></i>
                        <span>Mis à jour il y a ${cardData.stats.lastUpdate}</span>
                    </div>
                </div>
            </div>
        `;

        this.canvas.appendChild(cardElement);
        this.setupCardEvents(cardElement, cardData);
        this.cards.push({ element: cardElement, data: cardData });
    }

    setupCardEvents(cardElement, cardData) {
        // Click pour sélectionner (pas drag)
        cardElement.addEventListener('click', (e) => {
            if (!this.isDragging) {
                this.selectCard(cardElement);
            }
        });
        
        // Drag & Drop
        cardElement.addEventListener('mousedown', (e) => this.handleMouseDown(e, cardElement));
        
        // Boutons d'action
        const pinBtn = cardElement.querySelector('.pin-btn');
        const deleteBtn = cardElement.querySelector('.delete-btn');
        
        pinBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePin(cardElement);
        });
        
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCard(cardElement);
        });
    }

    handleMouseDown(e, cardElement) {
        e.preventDefault();
        this.selectedCard = cardElement;
        this.isDragging = true;
        
        const rect = cardElement.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        cardElement.classList.add('dragging');
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedCard) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - this.dragOffset.x;
        const y = e.clientY - canvasRect.top - this.dragOffset.y;
        
        // Contraintes pour garder la carte dans le canvas
        const maxX = this.canvas.offsetWidth - this.selectedCard.offsetWidth;
        const maxY = this.canvas.offsetHeight - this.selectedCard.offsetHeight;
        
        const constrainedX = Math.max(0, Math.min(x, maxX));
        const constrainedY = Math.max(0, Math.min(y, maxY));
        
        this.selectedCard.style.left = constrainedX + 'px';
        this.selectedCard.style.top = constrainedY + 'px';
    }

    handleMouseUp() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        if (this.selectedCard) {
            this.selectedCard.classList.remove('dragging');
            this.selectedCard = null;
        }
    }

    togglePin(cardElement) {
        const isPinned = cardElement.classList.toggle('pinned');
        const pinBtn = cardElement.querySelector('.pin-btn');
        
        if (isPinned) {
            pinBtn.classList.add('pinned');
            pinBtn.title = 'Désépingler';
        } else {
            pinBtn.classList.remove('pinned');
            pinBtn.title = 'Épingler';
        }
    }

    deleteCard(cardElement) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
            cardElement.remove();
            this.cards = this.cards.filter(card => card.element !== cardElement);
        }
    }

    showAddCardDialog() {
        // Temporaire : créer une nouvelle carte par défaut
        const newCardData = {
            id: 'card-' + Date.now(),
            title: 'Nouvelle carte',
            theme: 'Personnalisé',
            description: 'Description de la nouvelle carte',
            position: { x: 200, y: 200 },
            stats: { documents: 0, lastUpdate: 'maintenant' },
            pinned: false
        };
        
        this.createCard(newCardData);
    }

    saveLayout() {
        const layout = this.cards.map(card => ({
            id: card.data.id,
            position: {
                x: parseInt(card.element.style.left),
                y: parseInt(card.element.style.top)
            },
            pinned: card.element.classList.contains('pinned')
        }));
        
        localStorage.setItem('workspace-layout', JSON.stringify(layout));
        
        // Notification temporaire
        const notification = document.createElement('div');
        notification.textContent = 'Layout sauvegardé !';
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: rgba(34, 197, 94, 0.9); color: white;
            padding: 12px 20px; border-radius: 8px;
            font-family: Inter, sans-serif; font-size: 14px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    selectCard(cardElement) {
        // Désélectionner toutes les cartes
        this.cards.forEach(card => {
            card.element.classList.remove('selected');
        });
        
        // Sélectionner la carte cliquée
        cardElement.classList.add('selected');
        this.selectedCard = cardElement;
        
        // Mettre à jour le contexte du chat
        this.updateChatContext(cardElement);
    }

    updateChatContext(cardElement) {
        const cardData = this.cards.find(c => c.element === cardElement)?.data;
        if (!cardData) return;
        
        // Mettre à jour le placeholder du chat
        const textarea = document.getElementById('message-input');
        if (textarea) {
            textarea.placeholder = `Discuter avec la carte "${cardData.title}"...`;
        }
        
        // Ajouter un indicateur visuel
        this.showChatIndicator(cardData.title);
    }

    showChatIndicator(cardTitle) {
        // Supprimer l'ancien indicateur s'il existe
        const existingIndicator = document.querySelector('.chat-card-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Créer le nouvel indicateur
        const indicator = document.createElement('div');
        indicator.className = 'chat-card-indicator';
        indicator.innerHTML = `
            <i class="fas fa-link"></i>
            <span>Connecté à: ${cardTitle}</span>
            <button onclick="this.parentElement.remove()" title="Déconnecter">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Ajouter avant la barre de chat
        const chatContainer = document.querySelector('.modern-chat-container');
        if (chatContainer) {
            chatContainer.parentNode.insertBefore(indicator, chatContainer);
        }
    }
}

// Initialiser le workspace
document.addEventListener('DOMContentLoaded', () => {
    window.workspaceManager = new WorkspaceManager();
});
