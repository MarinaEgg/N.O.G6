// ========== CORRECTIONS WORKSPACE : ZOOM + PANNEAU ==========

class WorkspaceManager {
    constructor() {
        this.cards = [];
        this.selectedCard = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Chat integration
        this.cardConversations = new Map();
        this.activeCardChat = null;
        this.originalMessageBox = null;
        
        this.canvas = null;
        this.addCardBtn = null;
        this.saveLayoutBtn = null;
        
        // Canvas pan/drag
        this.canvasIsDragging = false;
        this.canvasStartPos = { x: 0, y: 0 };
        this.canvasOffset = { x: 0, y: 0 };
        
        // Zoom avec compensation
        this.zoomLevel = 1.0;
        this.minZoom = 0.3;
        this.maxZoom = 3.0;
        this.zoomStep = 0.1;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupElements();
            });
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        this.canvas = document.getElementById('workspaceCanvas');
        this.addCardBtn = document.getElementById('addCardBtn');
        this.saveLayoutBtn = document.getElementById('saveLayoutBtn');
        this.originalMessageBox = document.getElementById('messages');

        if (!this.canvas) {
            console.warn('Workspace elements not found, retrying...');
            setTimeout(() => this.setupElements(), 100);
            return;
        }

        this.setupEventListeners();
        this.loadDefaultCards();
        this.setupChatIntegration();
        this.initZoom();
        this.loadZoomLevel();
        this.updateCanvasBackground(); // NOUVEAU : Initialiser le fond
        
        console.log('WorkspaceManager initialized');
    }

    setupEventListeners() {
        this.addCardBtn?.addEventListener('click', () => this.showAddCardDialog());
        this.saveLayoutBtn?.addEventListener('click', () => this.saveLayout());
        
        // Canvas drag (panneau)
        this.canvas?.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        
        // Events globaux
        document.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        document.addEventListener('mouseup', () => this.handleGlobalMouseUp());
    }

    // ========== DRAG CARDS - VERSION COMPENSÉE ZOOM ==========
    
    handleMouseDown(e, cardElement) {
        e.preventDefault();
        
        if (e.target.closest('.card-action-btn')) return;
        
        this.selectedCard = cardElement;
        this.isDragging = true;
        
        const rect = cardElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // CORRECTION : Compenser le zoom dans l'offset
        this.dragOffset = {
            x: (e.clientX - rect.left) / this.zoomLevel,
            y: (e.clientY - rect.top) / this.zoomLevel
        };
        
        cardElement.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedCard) return;
        
        e.preventDefault();
        
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // CORRECTION : Position compensée avec zoom et translation du canvas
        const newX = (e.clientX - canvasRect.left) / this.zoomLevel - this.canvasOffset.x / this.zoomLevel - this.dragOffset.x;
        const newY = (e.clientY - canvasRect.top) / this.zoomLevel - this.canvasOffset.y / this.zoomLevel - this.dragOffset.y;
        
        this.selectedCard.style.left = newX + 'px';
        this.selectedCard.style.top = newY + 'px';
    }

    handleMouseUp() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        document.body.style.cursor = 'default';
        
        if (this.selectedCard) {
            this.selectedCard.classList.remove('dragging');
            this.selectedCard = null;
        }
        
        this.dragOffset = { x: 0, y: 0 };
    }

    // ========== CANVAS DRAG-TO-PAN - AMÉLIORÉ ==========
    
    handleCanvasMouseDown(e) {
        if (e.target.closest('.workspace-card')) {
            return;
        }
        
        this.canvasIsDragging = true;
        this.canvasStartPos = { x: e.clientX, y: e.clientY };
        
        this.canvas.style.cursor = 'grabbing';
        document.body.style.cursor = 'grab';
        
        e.preventDefault();
    }

    handleGlobalMouseMove(e) {
        if (this.isDragging && this.selectedCard) {
            this.handleMouseMove(e);
            return;
        }
        
        if (this.canvasIsDragging) {
            const deltaX = e.clientX - this.canvasStartPos.x;
            const deltaY = e.clientY - this.canvasStartPos.y;
            
            this.canvasOffset.x += deltaX;
            this.canvasOffset.y += deltaY;
            
            this.applyCanvasTransform();
            this.updateCanvasBackground(); // NOUVEAU : Mettre à jour le fond
            
            this.canvasStartPos = { x: e.clientX, y: e.clientY };
            
            e.preventDefault();
        }
    }

    handleGlobalMouseUp() {
        if (this.isDragging) {
            this.handleMouseUp();
        }
        
        if (this.canvasIsDragging) {
            this.canvasIsDragging = false;
            this.canvas.style.cursor = 'grab';
            document.body.style.cursor = 'default';
        }
    }

    applyCanvasTransform() {
        if (!this.canvas) return;
        
        const scale = this.zoomLevel;
        this.canvas.style.transform = `scale(${scale}) translate(${this.canvasOffset.x / scale}px, ${this.canvasOffset.y / scale}px)`;
    }

    // ========== NOUVEAU : GESTION FOND À POIS RÉACTIF ==========
    
    updateCanvasBackground() {
        if (!this.canvas) return;
        
        const container = this.canvas.closest('.workspace-container');
        if (!container) return;
        
        // Taille des pois proportionnelle au zoom
        const dotSize = 30 * this.zoomLevel;
        
        // Position des pois qui suit le déplacement du canvas
        const bgX = (this.canvasOffset.x * this.zoomLevel) % dotSize;
        const bgY = (this.canvasOffset.y * this.zoomLevel) % dotSize;
        
        container.style.backgroundSize = `${dotSize}px ${dotSize}px`;
        container.style.backgroundPosition = `${bgX}px ${bgY}px`;
    }

    // ========== ZOOM AMÉLIORÉ ==========
    
    initZoom() {
        this.createZoomControls();
        this.setupZoomEvents();
    }

    createZoomControls() {
        if (document.getElementById('zoom-controls')) return;
        
        const zoomControls = document.createElement('div');
        zoomControls.id = 'zoom-controls';
        zoomControls.className = 'zoom-controls';
        
        zoomControls.innerHTML = `
            <button id="zoom-out" title="Zoom arrière">−</button>
            <span id="zoom-percentage">100%</span>
            <button id="zoom-in" title="Zoom avant">+</button>
            <button id="zoom-reset" title="Reset zoom">⌂</button>
        `;
        
        document.body.appendChild(zoomControls);
    }

    setupZoomEvents() {
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-reset')?.addEventListener('click', () => this.resetZoom());
        
        // Zoom avec molette (Ctrl+molette)
        this.canvas?.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
                this.setZoom(this.zoomLevel + delta);
            }
        });
    }

    zoomIn() {
        this.setZoom(Math.min(this.maxZoom, this.zoomLevel + this.zoomStep));
    }

    zoomOut() {
        this.setZoom(Math.max(this.minZoom, this.zoomLevel - this.zoomStep));
    }

    resetZoom() {
        this.setZoom(1.0);
        this.canvasOffset = { x: 0, y: 0 };
        this.applyCanvasTransform();
        this.updateCanvasBackground(); // NOUVEAU : Reset du fond
    }

    setZoom(zoomValue) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoomValue));
        this.applyCanvasTransform();
        this.updateCanvasBackground(); // NOUVEAU : Mettre à jour le fond
        this.updateZoomDisplay();
        localStorage.setItem('workspace-zoom-level', this.zoomLevel.toString());
    }

    updateZoomDisplay() {
        const percentage = document.getElementById('zoom-percentage');
        if (percentage) {
            percentage.textContent = Math.round(this.zoomLevel * 100) + '%';
        }
    }

    loadZoomLevel() {
        const saved = localStorage.getItem('workspace-zoom-level');
        if (saved) {
            const zoomLevel = parseFloat(saved);
            if (zoomLevel >= this.minZoom && zoomLevel <= this.maxZoom) {
                this.setZoom(zoomLevel);
            }
        }
    }

    // ========== GESTION DES CARTES (IDENTIQUE) ==========

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
        cardElement.setAttribute('data-card-id', cardData.id);
        cardElement.style.left = cardData.position.x + 'px';
        cardElement.style.top = cardData.position.y + 'px';
        
        if (cardData.pinned) {
            cardElement.classList.add('pinned');
        }

        cardElement.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${cardData.title}</h3>
                <div class="card-actions">
                    <button class="card-action-btn chat-toggle-btn" title="Mode Collaboration" data-card-id="${cardData.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action-btn pin-btn ${cardData.pinned ? 'pinned' : ''}" title="Épingler">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button class="card-action-btn clear-content-btn" title="Vider le contenu" data-card-id="${cardData.id}">
                        <i class="fas fa-eraser"></i>
                    </button>
                    <button class="card-action-btn delete-btn" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="card-content-view" id="content-${cardData.id}">
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
            
            <div class="card-document-view" id="document-${cardData.id}" style="display: none;">
                <div class="document-content" contenteditable="true" id="doc-content-${cardData.id}">
                    <h1 class="document-title">${cardData.title}</h1>
                    <div class="document-body" id="doc-body-${cardData.id}">
                        <p class="document-placeholder">Commencez à taper ou utilisez l'IA pour générer du contenu...</p>
                    </div>
                </div>
                <div class="document-status">
                    <span class="collab-indicator">✍️ Mode collaboration - Tapez ou utilisez la barre de chat</span>
                </div>
            </div>
        `;

        this.canvas.appendChild(cardElement);
        this.setupCardEvents(cardElement, cardData);
        this.cards.push({ element: cardElement, data: cardData });
        this.loadCardDocument(cardData.id);
    }

    setupCardEvents(cardElement, cardData) {
        cardElement.addEventListener('click', (e) => {
            if (!this.isDragging) {
                this.selectCard(cardElement);
            }
        });
        
        // CORRECTION : Events de drag avec compensation zoom
        cardElement.addEventListener('mousedown', (e) => this.handleMouseDown(e, cardElement));
        
        const pinBtn = cardElement.querySelector('.pin-btn');
        const deleteBtn = cardElement.querySelector('.delete-btn');
        const chatToggleBtn = cardElement.querySelector('.chat-toggle-btn');
        const clearContentBtn = cardElement.querySelector('.clear-content-btn');
        
        pinBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePin(cardElement);
        });
        
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCard(cardElement);
        });
        
        chatToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDocumentMode(cardElement, cardData.id);
        });
        
        clearContentBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearDocumentContent(cardData.id);
        });

        const docContent = cardElement.querySelector('.document-content');
        if (docContent) {
            docContent.addEventListener('input', () => {
                this.saveDocumentContent(cardData.id);
            });
        }
    }

    // ========== UTILITAIRES (IDENTIQUES) ==========

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

    selectCard(cardElement) {
        this.cards.forEach(card => {
            card.element.classList.remove('selected');
        });
        
        cardElement.classList.add('selected');
        this.selectedCard = cardElement;
    }

    showAddCardDialog() {
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

    // ========== INTÉGRATION CHAT (CONSERVÉ INTÉGRALEMENT) ==========
    
    setupChatIntegration() {
        if (window.location.pathname.includes('/workspace')) {
            this.interceptChatFunctions();
        }
    }
    
    interceptChatFunctions() {
        if (window.original_ask_gpt) return;
        
        window.original_ask_gpt = window.ask_gpt;
        
        window.ask_gpt = async (message) => {
            if (this.activeCardChat) {
                return this.handleCardChatMessage(message, this.activeCardChat);
            } else {
                return window.original_ask_gpt(message);
            }
        };
        
        console.log('Chat functions intercepted for workspace');
    }

    toggleDocumentMode(cardElement, cardId) {
        const documentView = cardElement.querySelector('.card-document-view');
        const contentView = cardElement.querySelector('.card-content-view');
        const toggleBtn = cardElement.querySelector('.chat-toggle-btn');
        
        const isCurrentlyInDocMode = documentView.style.display !== 'none';
        
        if (isCurrentlyInDocMode) {
            documentView.style.display = 'none';
            contentView.style.display = 'block';
            cardElement.classList.remove('document-mode');
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i>';
            toggleBtn.title = 'Mode Collaboration';
            
            if (this.activeCardChat === cardId) {
                this.disconnectFromMainChat();
            }
        } else {
            documentView.style.display = 'block';
            contentView.style.display = 'none';
            cardElement.classList.add('document-mode');
            toggleBtn.classList.add('active');
            toggleBtn.innerHTML = '<i class="fas fa-file-alt"></i>';
            toggleBtn.title = 'Retour vue normale';
            
            this.connectToMainChat(cardId, cardElement);
            
            const docContent = cardElement.querySelector('.document-content');
            if (docContent) {
                docContent.focus();
            }
        }
    }
    
    connectToMainChat(cardId, cardElement) {
        if (this.activeCardChat && this.activeCardChat !== cardId) {
            this.disconnectFromMainChat();
        }
        
        this.activeCardChat = cardId;
        this.selectedCard = cardElement;
        
        const textarea = document.getElementById('message-input');
        if (textarea) {
            const cardTitle = cardElement.querySelector('.card-title').textContent;
            textarea.placeholder = `Discuter avec "${cardTitle}"...`;
        }
        
        this.showChatIndicator(cardElement.querySelector('.card-title').textContent);
        this.displayCardConversation(cardId);
        
        console.log(`Carte ${cardId} connectée au chat principal`);
    }
    
    disconnectFromMainChat() {
        if (!this.activeCardChat) return;
        
        const textarea = document.getElementById('message-input');
        if (textarea) {
            textarea.placeholder = 'Posez votre question à N.O.G';
        }
        
        const indicator = document.querySelector('.chat-card-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        const prevCard = this.cards.find(c => c.data.id === this.activeCardChat);
        if (prevCard) {
            const chatToggleBtn = prevCard.element.querySelector('.chat-toggle-btn');
            chatToggleBtn?.classList.remove('active');
        }
        
        this.activeCardChat = null;
        this.selectedCard = null;
        
        console.log('Déconnecté du chat principal');
    }
    
    showChatIndicator(cardTitle) {
        const existingIndicator = document.querySelector('.chat-card-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'chat-card-indicator';
        indicator.innerHTML = `
            <i class="fas fa-link"></i>
            <span>Connecté à: ${cardTitle}</span>
            <button onclick="window.workspaceManager.disconnectFromMainChat()" title="Déconnecter">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const chatContainer = document.querySelector('.modern-chat-container');
        if (chatContainer) {
            chatContainer.parentNode.insertBefore(indicator, chatContainer);
        }
    }
    
    async handleDocumentMessage(message, cardId) {
        try {
            const cardElement = this.cards.find(c => c.data.id === cardId)?.element;
            if (!cardElement) return;
            
            const sectionTitle = this.generateSectionTitle(message);
            this.showDocumentGenerating(cardId, sectionTitle);
            
            const documentPrompt = this.buildDocumentPrompt(message, cardId);
            const token = this.generateMessageId();
            await this.streamToDocument(documentPrompt, cardId, sectionTitle, token);
            
        } catch (error) {
            console.error('Erreur génération document:', error);
            this.addToDocument(cardId, `<p class="error">Erreur lors de la génération du contenu.</p>`);
        }
    }

    buildDocumentPrompt(userMessage, cardId) {
        const cardTitle = this.getCardTitle(cardId);
        const existingContent = this.getDocumentContent(cardId);
        
        return `Tu es un assistant spécialisé dans la rédaction de documents professionnels.
    
Contexte : Document "${cardTitle}"
Contenu existant : ${existingContent}

Instruction : ${userMessage}

Génère du contenu de document professionnel avec :
- Des titres et sous-titres appropriés (utilise ##, ###)
- Du texte structuré et professionnel
- Des listes à puces si pertinent
- Un style document de travail, pas de chat

Réponds UNIQUEMENT avec le contenu du document, sans introduction ni conclusion de chatbot.`;
    }

    generateSectionTitle(message) {
        let title = message.trim();
        title = title.replace(/^(qu'est-ce que|comment|pourquoi|quand|où|qui|quoi)\s*/i, '');
        title = title.replace(/\?$/, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        if (title.length > 60) {
            title = title.substring(0, 57) + '...';
        }
        
        return title || 'Nouvelle section';
    }

    showDocumentGenerating(cardId, sectionTitle) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (docBody) {
            docBody.scrollTop = docBody.scrollHeight;
        }
    }

    finalizeDocumentSection(cardId, token, content) {
        const sectionContent = document.getElementById(`content-${token}`);
        if (!sectionContent) return;
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent;
    }

    formatDocumentContent(content) {
        if (!content) return '';
        
        if (window.marked) {
            return window.marked.parse(content);
        }
        
        return content
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    saveDocumentContent(cardId) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return;
        
        const content = docBody.innerHTML;
        localStorage.setItem(`workspace-doc-${cardId}`, content);
    }

    loadCardDocument(cardId) {
        const content = localStorage.getItem(`workspace-doc-${cardId}`);
        if (content) {
            const docBody = document.getElementById(`doc-body-${cardId}`);
            if (docBody) {
                docBody.innerHTML = content;
            }
        }
    }

    getDocumentContent(cardId) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return '';
        
        return docBody.textContent || docBody.innerText || '';
    }

    clearDocumentContent(cardId) {
        if (confirm('Vider tout le contenu de ce document ?')) {
            const docBody = document.getElementById(`doc-body-${cardId}`);
            if (docBody) {
                docBody.innerHTML = '<p class="document-placeholder">Commencez à taper ou utilisez l\'IA pour générer du contenu...</p>';
            }
            localStorage.removeItem(`workspace-doc-${cardId}`);
            console.log(`Document vidé pour la carte ${cardId}`);
        }
    }

    getCardTitle(cardId) {
        const card = this.cards.find(c => c.data.id === cardId);
        return card ? card.data.title : 'Carte inconnue';
    }

    displayCardConversation(cardId) {
        console.log(`Affichage conversation pour carte ${cardId}`);
    }

    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialiser le workspace
document.addEventListener('DOMContentLoaded', () => {
    window.workspaceManager = new WorkspaceManager();
});

// ========== AMÉLIORATIONS CSS COMPLÉMENTAIRES ==========
/*
Ajouter ces styles CSS pour le scroll vertical naturel :

.workspace-container {
    height: 100vh;
    overflow: auto; // Permettre le scroll
}

.workspace-canvas {
    min-height: 200vh; // Canvas plus haut pour scroll vertical
    min-width: 200vw;
}
*/!docBody) return;
        
        const placeholder = docBody.querySelector('.document-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        const generatingHTML = `
            <div class="generating-section" id="generating-${cardId}">
                <h2 class="section-title">${sectionTitle}</h2>
                <p class="generating-text">
                    <i class="fas fa-spinner fa-spin"></i> 
                    Génération en cours...
                </p>
            </div>
        `;
        
        docBody.insertAdjacentHTML('beforeend', generatingHTML);
        docBody.scrollTop = docBody.scrollHeight;
    }

    async streamToDocument(prompt, cardId, sectionTitle, token) {
        try {
            const response = await fetch(`/backend-api/v2/conversation`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    conversation_id: window.conversation_id || `workspace-doc-${cardId}`,
                    action: '_ask',
                    model: 'Eggon-V1',
                    meta: {
                        id: token,
                        content: {
                            conversation: [],
                            content_type: 'text',
                            parts: [{ content: prompt, role: 'user' }],
                        },
                    },
                }),
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let generatedContent = '';
            
            this.hideDocumentGenerating(cardId);
            this.startDocumentSection(cardId, sectionTitle, token);
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const eventData = line.slice(6).trim();
                        if (eventData === '[DONE]') {
                            this.finalizeDocumentSection(cardId, token, generatedContent);
                            this.saveDocumentContent(cardId);
                            return;
                        }
                        
                        try {
                            const dataObject = JSON.parse(eventData);
                            if (dataObject.response) {
                                generatedContent += dataObject.response;
                                this.updateDocumentSection(cardId, token, generatedContent);
                            }
                        } catch (e) {
                            console.error('Erreur parsing JSON:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur streaming document:', error);
            this.hideDocumentGenerating(cardId);
            this.addToDocument(cardId, `<p class="error">Erreur de connexion.</p>`);
        }
    }

    hideDocumentGenerating(cardId) {
        const indicator = document.getElementById(`generating-${cardId}`);
        if (indicator) {
            indicator.remove();
        }
    }

    startDocumentSection(cardId, sectionTitle, token) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return;
        
        const sectionHTML = `
            <div class="document-section" id="section-${token}">
                <h2 class="section-title">${sectionTitle}</h2>
                <div class="section-content" id="content-${token}">
                    <span class="typing-cursor">▊</span>
                </div>
            </div>
        `;
        
        docBody.insertAdjacentHTML('beforeend', sectionHTML);
        docBody.scrollTop = docBody.scrollHeight;
    }

    updateDocumentSection(cardId, token, content) {
        const sectionContent = document.getElementById(`content-${token}`);
        if (!sectionContent) return;
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent + '<span class="typing-cursor">▊</span>';
        
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (docBody) {
            docBody.scrollTop = docBody.scrollHeight;
        }
    }

    finalizeDocumentSection(cardId, token, content) {
        const sectionContent = document.getElementById(`content-${token}`);
        if (!sectionContent) return;
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent;
    }

    formatDocumentContent(content) {
        if (!content) return '';
        
        if (window.marked) {
            return window.marked.parse(content);
        }
        
        return content
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    saveDocumentContent(cardId) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return;
        
        const content = docBody.innerHTML;
        localStorage.setItem(`workspace-doc-${cardId}`, content);
    }

    loadCardDocument(cardId) {
        const content = localStorage.getItem(`workspace-doc-${cardId}`);
        if (content) {
            const docBody = document.getElementById(`doc-body-${cardId}`);
            if (docBody) {
                docBody.innerHTML = content;
            }
        }
    }

    getDocumentContent(cardId) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return '';
        
        return docBody.textContent || docBody.innerText || '';
    }

    clearDocumentContent(cardId) {
        if (confirm('Vider tout le contenu de ce document ?')) {
            const docBody = document.getElementById(`doc-body-${cardId}`);
            if (docBody) {
                docBody.innerHTML = '<p class="document-placeholder">Commencez à taper ou utilisez l\'IA pour générer du contenu...</p>';
            }
            localStorage.removeItem(`workspace-doc-${cardId}`);
            console.log(`Document vidé pour la carte ${cardId}`);
        }
    }

    getCardTitle(cardId) {
        const card = this.cards.find(c => c.data.id === cardId);
        return card ? card.data.title : 'Carte inconnue';
    }

    displayCardConversation(cardId) {
        // Implementation conservée pour la compatibilité
        console.log(`Affichage conversation pour carte ${cardId}`);
    }

    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialiser le workspace
document.addEventListener('DOMContentLoaded', () => {
    window.workspaceManager = new WorkspaceManager();
});
