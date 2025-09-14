// ========== WORKSPACE MANAGER AVEC SYSTÈME MODULAIRE ==========

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
        
        // Système de cartes modulaire
        this.cardSystem = null;
        
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

        // Initialiser le système de cartes
        this.cardSystem = new CardSystem(this);
        
        this.setupEventListeners();
        this.loadDefaultCards();
        this.setupChatIntegration();
        this.initZoom();
        this.loadZoomLevel();
        this.updateCanvasBackground();
        
        console.log('WorkspaceManager initialized with modular card system');
    }

    setupEventListeners() {
        this.addCardBtn?.addEventListener('click', () => this.showCardTypeSelector());
        this.saveLayoutBtn?.addEventListener('click', () => this.saveLayout());
        
        // Canvas drag (panneau)
        this.canvas?.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        
        // Events globaux
        document.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        document.addEventListener('mouseup', () => this.handleGlobalMouseUp());
    }

    // ========== NOUVEAU : SÉLECTEUR DE TYPE DE CARTE ==========
    
    showCardTypeSelector() {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // Créer le sélecteur
        const selector = document.createElement('div');
        selector.className = 'card-type-selector';
        selector.innerHTML = `
            <button class="selector-cancel">
                <i class="fas fa-times"></i>
            </button>
            <h3 class="selector-title">Choisir le type de carte</h3>
            <div class="card-type-options">
                <div class="card-type-option" data-type="text">
                    <div class="card-type-icon">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div>
                        <h4 class="card-type-title">Carte Texte</h4>
                        <p class="card-type-desc">Collaboration IA et documents</p>
                    </div>
                </div>
                <div class="card-type-option" data-type="file">
                    <div class="card-type-icon">
                        <i class="fas fa-upload"></i>
                    </div>
                    <div>
                        <h4 class="card-type-title">Upload File</h4>
                        <p class="card-type-desc">PDF et images avec preview</p>
                    </div>
                </div>
            </div>
        `;
        
        // Events
        overlay.addEventListener('click', () => this.hideCardTypeSelector());
        selector.addEventListener('click', (e) => e.stopPropagation());
        
        selector.querySelector('.selector-cancel').addEventListener('click', () => {
            this.hideCardTypeSelector();
        });
        
        selector.querySelectorAll('.card-type-option').forEach(option => {
            option.addEventListener('click', () => {
                const cardType = option.getAttribute('data-type');
                this.createCardOfType(cardType);
                this.hideCardTypeSelector();
            });
        });
        
        // Ajouter au DOM
        document.body.appendChild(overlay);
        overlay.appendChild(selector);
        
        // Focus sur le sélecteur
        selector.focus();
    }

    hideCardTypeSelector() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    createCardOfType(type) {
        let cardData;
        const position = this.getNewCardPosition();
        
        if (type === 'text') {
            cardData = TextCard.createDefaultTextCard(position);
        } else if (type === 'file') {
            cardData = FileCard.createDefaultFileCard(position);
        } else {
            console.error('Type de carte inconnu:', type);
            return;
        }
        
        const card = this.cardSystem.createCard(cardData);
        if (card) {
            this.cards.push({ element: card.element, data: card.data, cardInstance: card });
        }
    }

    getNewCardPosition() {
        // Calculer une position libre pour la nouvelle carte
        const baseX = 200;
        const baseY = 200;
        const offset = this.cards.length * 30;
        
        return {
            x: baseX + offset,
            y: baseY + offset
        };
    }

    // ========== MÉTHODES DE DRAG ADAPTÉES AU SYSTÈME MODULAIRE ==========
    
    handleMouseDown(e, cardElement) {
        e.preventDefault();
        
        if (e.target.closest('.card-action-btn')) return;
        
        this.selectedCard = cardElement;
        this.isDragging = true;
        
        const rect = cardElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Compenser le zoom dans l'offset
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
        
        // Position compensée avec zoom et translation du canvas
        const newX = (e.clientX - canvasRect.left) / this.zoomLevel - this.canvasOffset.x / this.zoomLevel - this.dragOffset.x;
        const newY = (e.clientY - canvasRect.top) / this.zoomLevel - this.canvasOffset.y / this.zoomLevel - this.dragOffset.y;
        
        this.selectedCard.style.left = newX + 'px';
        this.selectedCard.style.top = newY + 'px';
        
        // Mettre à jour les données de la carte
        const cardId = this.selectedCard.getAttribute('data-card-id');
        const card = this.cardSystem.getCard(cardId);
        if (card) {
            card.updatePosition(newX, newY);
        }
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

    // ========== MÉTHODES CANVAS INCHANGÉES ==========
    
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
            this.updateCanvasBackground();
            
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

    updateCanvasBackground() {
        if (!this.canvas) return;
        
        const dotSize = 30 * this.zoomLevel;
        const bgX = (this.canvasOffset.x * this.zoomLevel) % dotSize;
        const bgY = (this.canvasOffset.y * this.zoomLevel) % dotSize;

        this.canvas.style.backgroundSize = `${dotSize}px ${dotSize}px`;
        this.canvas.style.backgroundPosition = `${bgX}px ${bgY}px`;
    }

    // ========== MÉTHODES ZOOM INCHANGÉES ==========
    
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
        this.updateCanvasBackground();
    }

    setZoom(zoomValue) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoomValue));
        this.applyCanvasTransform();
        this.updateCanvasBackground();
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

    // ========== CHARGEMENT DES CARTES PAR DÉFAUT ADAPTÉ ==========

    loadDefaultCards() {
        const defaultCards = [
            {
                id: 'card-1',
                type: 'text',
                title: 'Due Diligence',
                theme: 'Analyse Juridique',
                description: 'Documents et analyses pour les opérations de due diligence',
                position: { x: 50, y: 50 },
                stats: { documents: 24, lastUpdate: '2 heures' },
                pinned: false
            },
            {
                id: 'card-2', 
                type: 'text',
                title: 'Contrats Commerciaux',
                theme: 'Rédaction',
                description: 'Modèles et révisions de contrats commerciaux',
                position: { x: 350, y: 50 },
                stats: { documents: 18, lastUpdate: '1 jour' },
                pinned: true
            },
            {
                id: 'card-3',
                type: 'text',
                title: 'Compliance',
                theme: 'Conformité',
                description: 'Suivi réglementaire et conformité juridique',
                position: { x: 50, y: 300 },
                stats: { documents: 31, lastUpdate: '3 heures' },
                pinned: false
            },
            {
                id: 'card-4',
                type: 'file',
                title: 'Documents Administratifs',
                position: { x: 350, y: 300 },
                pinned: false
            }
        ];

        defaultCards.forEach(cardData => {
            const card = this.cardSystem.createCard(cardData);
            if (card) {
                this.cards.push({ element: card.element, data: card.data, cardInstance: card });
            }
        });
    }

    // ========== MÉTHODES UTILITAIRES ADAPTÉES ==========

    selectCard(cardElement) {
        this.cards.forEach(card => {
            if (card.element) {
                card.element.classList.remove('selected');
            }
        });
        
        cardElement.classList.add('selected');
        this.selectedCard = cardElement;
    }

    saveLayout() {
        const layout = this.cards.map(card => {
            if (!card.cardInstance) return null;
            
            return {
                id: card.cardInstance.data.id,
                type: card.cardInstance.data.type,
                position: {
                    x: parseInt(card.element.style.left) || 0,
                    y: parseInt(card.element.style.top) || 0
                },
                pinned: card.element.classList.contains('pinned')
            };
        }).filter(Boolean);
        
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

    // ========== INTÉGRATION CHAT ADAPTÉE ==========
    
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
        
        // Désactiver le bouton chat de l'ancienne carte
        const prevCard = this.cards.find(c => c.data && c.data.id === this.activeCardChat);
        if (prevCard && prevCard.element) {
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
    
    async handleCardChatMessage(message, cardId) {
        try {
            const card = this.cardSystem.getCard(cardId);
            if (!card || card.type !== 'text') {
                return window.original_ask_gpt(message);
            }

            // Utiliser les méthodes de la carte texte
            const sectionTitle = this.generateSectionTitle(message);
            const token = this.generateMessageId();
            
            card.addDocumentSection(sectionTitle, token);
            
            const documentPrompt = this.buildDocumentPrompt(message, cardId);
            await this.streamToDocument(documentPrompt, cardId, token, card);
            
        } catch (error) {
            console.error('Erreur génération document:', error);
            const card = this.cardSystem.getCard(cardId);
            if (card && card.type === 'text') {
                card.addDocumentSection('Erreur', 'error-' + Date.now());
            }
        }
    }

    async streamToDocument(prompt, cardId, token, cardInstance) {
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
                            cardInstance.finalizeDocumentSection(token, generatedContent);
                            return;
                        }
                        
                        try {
                            const dataObject = JSON.parse(eventData);
                            if (dataObject.response) {
                                generatedContent += dataObject.response;
                                cardInstance.updateDocumentSection(token, generatedContent);
                            }
                        } catch (e) {
                            console.error('Erreur parsing JSON:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur streaming document:', error);
            cardInstance.finalizeDocumentSection(token, 'Erreur de connexion.');
        }
    }

    buildDocumentPrompt(userMessage, cardId) {
        const card = this.cardSystem.getCard(cardId);
        const cardTitle = card ? card.data.title : 'Document';
        const existingContent = card ? card.getDocumentContent() : '';
        
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

    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ========== MÉTHODES DE COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME ==========

    addCard(cardData = null) {
        // Méthode de compatibilité - redirige vers le nouveau système
        if (cardData) {
            const card = this.cardSystem.createCard(cardData);
            if (card) {
                this.cards.push({ element: card.element, data: card.data, cardInstance: card });
                return card;
            }
        } else {
            // Si pas de données, afficher le sélecteur
            this.showCardTypeSelector();
        }
    }

    // ========== MÉTHODES POUR LA SAUVEGARDE/CHARGEMENT ==========

    loadLayout() {
        try {
            const saved = localStorage.getItem('workspace-layout');
            if (!saved) return;

            const layout = JSON.parse(saved);
            
            // Vider les cartes actuelles
            this.cards.forEach(card => {
                if (card.cardInstance) {
                    card.cardInstance.destroy();
                }
            });
            this.cards = [];

            // Recréer les cartes depuis la sauvegarde
            layout.forEach(savedCard => {
                const card = this.cardSystem.createCard(savedCard);
                if (card) {
                    this.cards.push({ 
                        element: card.element, 
                        data: card.data, 
                        cardInstance: card 
                    });
                }
            });

            console.log(`${layout.length} cartes rechargées depuis la sauvegarde`);
            
        } catch (error) {
            console.error('Erreur chargement layout:', error);
        }
    }

    exportWorkspace() {
        const workspace = {
            cards: this.cards.map(card => card.cardInstance ? card.cardInstance.data : null).filter(Boolean),
            canvasOffset: this.canvasOffset,
            zoomLevel: this.zoomLevel,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(workspace, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workspace-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importWorkspace(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workspace = JSON.parse(e.target.result);
                
                // Vider l'espace de travail actuel
                this.cards.forEach(card => {
                    if (card.cardInstance) {
                        card.cardInstance.destroy();
                    }
                });
                this.cards = [];

                // Importer les cartes
                workspace.cards.forEach(cardData => {
                    const card = this.cardSystem.createCard(cardData);
                    if (card) {
                        this.cards.push({ 
                            element: card.element, 
                            data: card.data, 
                            cardInstance: card 
                        });
                    }
                });

                // Restaurer la vue
                if (workspace.canvasOffset) {
                    this.canvasOffset = workspace.canvasOffset;
                }
                if (workspace.zoomLevel) {
                    this.setZoom(workspace.zoomLevel);
                }

                this.applyCanvasTransform();
                this.updateCanvasBackground();

                console.log('Workspace importé avec succès');
                
            } catch (error) {
                console.error('Erreur import workspace:', error);
                alert('Erreur lors de l\'importation du workspace');
            }
        };
        reader.readAsText(file);
    }

    // ========== MÉTHODES UTILITAIRES SUPPLÉMENTAIRES ==========

    clearWorkspace() {
        if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les cartes ?')) {
            return;
        }

        this.cards.forEach(card => {
            if (card.cardInstance) {
                card.cardInstance.destroy();
            }
        });
        
        this.cards = [];
        this.disconnectFromMainChat();
        
        // Nettoyer localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('workspace-card-') || key.startsWith('workspace-doc-') || key.startsWith('workspace-file-')) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('Workspace vidé');
    }

    getWorkspaceStats() {
        const textCards = this.cardSystem.getCardsByType('text');
        const fileCards = this.cardSystem.getCardsByType('file');
        const pinnedCards = this.cards.filter(card => 
            card.element && card.element.classList.contains('pinned')
        );

        return {
            totalCards: this.cards.length,
            textCards: textCards.length,
            fileCards: fileCards.length,
            pinnedCards: pinnedCards.length,
            activeChat: !!this.activeCardChat,
            zoomLevel: this.zoomLevel,
            canvasPosition: this.canvasOffset
        };
    }

    // ========== MÉTHODES D'AIDE AU DÉVELOPPEMENT ==========

    debugWorkspace() {
        console.group('🔍 Workspace Debug Info');
        console.log('Stats:', this.getWorkspaceStats());
        console.log('Cards système:', this.cardSystem.cards);
        console.log('Cards manager:', this.cards);
        console.log('Canvas state:', {
            offset: this.canvasOffset,
            zoom: this.zoomLevel,
            dragging: this.canvasIsDragging
        });
        console.log('Chat state:', {
            activeCard: this.activeCardChat,
            conversations: this.cardConversations
        });
        console.groupEnd();
    }

    // ========== EVENTS PERSONNALISÉS ==========

    dispatchWorkspaceEvent(eventName, detail = {}) {
        const event = new CustomEvent(`workspace:${eventName}`, {
            detail: { workspaceManager: this, ...detail }
        });
        document.dispatchEvent(event);
    }

    // Dispatcher les événements importants
    onCardAdded(card) {
        this.dispatchWorkspaceEvent('cardAdded', { card });
    }

    onCardDeleted(cardId) {
        this.dispatchWorkspaceEvent('cardDeleted', { cardId });
    }

    onChatConnected(cardId) {
        this.dispatchWorkspaceEvent('chatConnected', { cardId });
    }

    onChatDisconnected() {
        this.dispatchWorkspaceEvent('chatDisconnected');
    }
}

// ========== INITIALISATION GLOBALE ==========

// Initialiser le workspace
document.addEventListener('DOMContentLoaded', () => {
    window.workspaceManager = new WorkspaceManager();
    
    // Debug helper global
    window.debugWorkspace = () => window.workspaceManager.debugWorkspace();
    
    console.log('🚀 Workspace Manager with modular cards system initialized');
});

// Export pour utilisation en module si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkspaceManager;
}
