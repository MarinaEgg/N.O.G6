// ========== WORKSPACE MANAGER AVEC SYSTÈME MODULAIRE - VERSION FIXÉE ==========

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

        // 🔧 FIX : Initialiser le système de cartes AVANT les event listeners
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
        // 🔧 FIX : Appeler la bonne méthode avec debug
        this.addCardBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Bouton ajouter carte cliqué - addCardBtn trouvé:', !!this.addCardBtn);
            this.showCardTypeSelector();
        });
        
        this.saveLayoutBtn?.addEventListener('click', () => this.saveLayout());
        
        // Canvas drag (panneau)
        this.canvas?.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        
        // Events globaux
        document.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        document.addEventListener('mouseup', () => this.handleGlobalMouseUp());
        
        // 🔧 FIX : Escape pour fermer les modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideCardTypeSelector();
            }
        });
    }

    // ========== FIX : SÉLECTEUR DE TYPE DE CARTE - VERSION CORRIGÉE ==========
    
    showCardTypeSelector() {
        console.log('🎯 showCardTypeSelector appelée');
        
        // Supprimer l'ancien overlay s'il existe
        const existingOverlay = document.querySelector('.modal-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
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
        overlay.addEventListener('click', () => {
            console.log('🎯 Overlay cliqué - fermeture');
            this.hideCardTypeSelector();
        });
        
        selector.addEventListener('click', (e) => e.stopPropagation());
        
        // Bouton fermer
        const cancelBtn = selector.querySelector('.selector-cancel');
        cancelBtn.addEventListener('click', () => {
            console.log('🎯 Bouton cancel cliqué');
            this.hideCardTypeSelector();
        });
        
        // Options de type
        selector.querySelectorAll('.card-type-option').forEach(option => {
            option.addEventListener('click', () => {
                const cardType = option.getAttribute('data-type');
                console.log('🎯 Type sélectionné:', cardType);
                this.createCardOfType(cardType);
                this.hideCardTypeSelector();
            });
        });
        
        // Ajouter au DOM
        document.body.appendChild(overlay);
        overlay.appendChild(selector);
        
        console.log('🎯 Modal ajoutée au DOM');
    }

    hideCardTypeSelector() {
        console.log('🎯 hideCardTypeSelector appelée');
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.remove();
            console.log('🎯 Modal supprimée');
        }
    }

    createCardOfType(type) {
        console.log('🎯 Création carte type:', type);
        
        // 🔧 FIX : Vérifier que le système de cartes est initialisé
        if (!this.cardSystem) {
            console.error('❌ Card system not initialized');
            return;
        }
        
        let cardData;
        const position = this.getNewCardPosition();
        
        // 🔧 FIX : Vérifier que les classes existent
        if (type === 'text') {
            if (typeof TextCard === 'undefined') {
                console.error('❌ TextCard class not found - script pas chargé');
                alert('Erreur: TextCard non trouvée. Vérifiez que text-card.js est chargé.');
                return;
            }
            cardData = TextCard.createDefaultTextCard(position);
        } else if (type === 'file') {
            if (typeof FileCard === 'undefined') {
                console.error('❌ FileCard class not found - script pas chargé');
                alert('Erreur: FileCard non trouvée. Vérifiez que file-card.js est chargé.');
                return;
            }
            cardData = FileCard.createDefaultFileCard(position);
        } else {
            console.error('❌ Type de carte inconnu:', type);
            return;
        }
        
        console.log('🎯 Données carte:', cardData);
        
        const card = this.cardSystem.createCard(cardData);
        if (card) {
            this.cards.push({ element: card.element, data: card.data, cardInstance: card });
            console.log('✅ Carte créée avec succès:', type);
        } else {
            console.error('❌ Échec création carte');
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
        console.log('🎯 Workspace vierge - prêt pour création manuelle');
        
        if (!this.cardSystem) {
            console.error('❌ Card system not ready');
            return;
        }
        
        // TODO: Future intégration iManage
        // Structure attendue :
        // - Custom1 = Client level
        // - Custom2 = Workspace/Dossier level  
        // - Folders = Répertoires (tags sur cartes)
        // - Documents = Cartes individuelles
        // this.loadFromiManageWorkspace(workspaceId);
        
        console.log('✅ Workspace prêt - 0 cartes chargées');
    }

    // ========== IMANAGE INTEGRATION ==========

    /**
     * Loads documents from iManage workspace and creates corresponding cards
     * @param {string} workspaceId - ID of the iManage workspace
     * @param {string} customerId - ID of the customer in iManage
     * @param {string} libraryId - ID of the library in iManage
     * @returns {Promise<void>}
     */
    async loadFromiManageWorkspace(workspaceId, customerId, libraryId) {
        try {
            console.log(`🔄 Loading documents from iManage workspace ${workspaceId}...`);
            
            // Show loading state
            this.showLoadingState(true);
            
            // Call iManage API to get workspace documents
            const response = await fetch(`/api/v2/customers/${customerId}/libraries/${libraryId}/workspaces/${workspaceId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load workspace: ${response.statusText}`);
            }
            
            const workspaceData = await response.json();
            
            // Clear existing cards if needed
            // this.clearWorkspace();
            
            // Create cards for each document
            const createCardPromises = workspaceData.documents.map(async (doc) => {
                const cardData = {
                    id: `imanage-${doc.id}`,
                    type: this.mapDocumentTypeToCardType(doc.type),
                    title: doc.name || 'Sans titre',
                    iManageId: doc.id,
                    iManageVersion: doc.version,
                    clientLevel: doc.custom1, // Custom1 = Client level
                    workspaceLevel: doc.custom2, // Custom2 = Workspace level
                    documentType: doc.type,
                    author: doc.author,
                    lastModified: doc.modifiedDate,
                    size: doc.size,
                    classification: doc.classification || 'Internal',
                    syncStatus: 'synced',
                    lastSync: new Date().toISOString(),
                    metadata: {
                        documentNumber: doc.documentNumber,
                        description: doc.description
                    },
                    // Map iManage folders to our folders/tags
                    folders: doc.folders || []
                };
                
                return this.cardSystem.createCard(cardData);
            });
            
            await Promise.all(createCardPromises);
            console.log(`✅ Successfully loaded ${workspaceData.documents.length} documents from iManage`);
            
        } catch (error) {
            console.error('❌ Error loading from iManage:', error);
            this.showError(`Erreur lors du chargement depuis iManage: ${error.message}`);
            throw error;
        } finally {
            this.showLoadingState(false);
        }
    }
    
    /**
     * Maps iManage document types to our card types
     * @private
     * @param {string} imanageType - iManage document type
     * @returns {string} Our card type
     */
    mapDocumentTypeToCardType(imanageType) {
        const typeMap = {
            'word': 'text',
            'excel': 'file',
            'pdf': 'file',
            'email': 'email',
            'powerpoint': 'file'
        };
        
        return typeMap[imanageType?.toLowerCase()] || 'file';
    }
    
    /**
     * Synchronizes local changes with iManage
     * @returns {Promise<void>}
     */
    async syncWithiManage() {
        try {
            console.log('🔄 Syncing with iManage...');
            this.showLoadingState(true, 'Synchronisation avec iManage en cours...');
            
            // Get all modified or conflicted cards
            const cardsToSync = Array.from(this.cardSystem.cards.values())
                .filter(card => 
                    card.data.syncStatus === 'modified' || 
                    card.data.syncStatus === 'conflict'
                );
            
            if (cardsToSync.length === 0) {
                console.log('✅ No changes to sync with iManage');
                return;
            }
            
            // Process each modified/conflicted card
            for (const card of cardsToSync) {
                try {
                    // Update sync status to pending
                    card.updateSyncStatus('pending');
                    
                    // Prepare document data for iManage
                    const documentData = {
                        id: card.data.iManageId,
                        name: card.data.title,
                        content: card.getContentForSync(), // Card class should implement this
                        metadata: {
                            ...card.data.metadata,
                            custom1: card.data.clientLevel,
                            custom2: card.data.workspaceLevel,
                            folders: card.data.folders
                        }
                    };
                    
                    // Call iManage API to update document
                    const response = await fetch(`/api/v2/documents/${card.data.iManageId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(documentData)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Failed to sync document ${card.data.id}: ${response.statusText}`);
                    }
                    
                    // Update sync status and timestamp
                    card.updateSyncStatus('synced');
                    card.data.lastSync = new Date().toISOString();
                    
                } catch (error) {
                    console.error(`❌ Error syncing card ${card.data.id}:`, error);
                    card.updateSyncStatus('conflict');
                    throw error;
                }
            }
            
            console.log(`✅ Successfully synced ${cardsToSync.length} documents with iManage`);
            
        } catch (error) {
            console.error('❌ Error during iManage sync:', error);
            this.showError(`Erreur lors de la synchronisation avec iManage: ${error.message}`);
            throw error;
        } finally {
            this.showLoadingState(false);
        }
    }
    
    /**
     * Resolves version conflicts between local and iManage versions
     * @param {string} cardId - ID of the card with conflicts
     * @param {'local'|'remote'|'merge'} resolution - Resolution strategy
     * @returns {Promise<void>}
     */
    async resolveConflicts(cardId, resolution) {
        const card = this.cardSystem.getCard(cardId);
        if (!card) {
            throw new Error(`Card not found: ${cardId}`);
        }
        
        try {
            card.updateSyncStatus('pending');
            
            switch (resolution) {
                case 'local':
                    // Keep local version and force push to iManage
                    await this.syncWithiManage();
                    break;
                    
                case 'remote':
                    // Discard local changes and reload from iManage
                    await this.loadFromiManageWorkspace(
                        card.data.workspaceId,
                        card.data.customerId,
                        card.data.libraryId
                    );
                    break;
                    
                case 'merge':
                    // Advanced merge logic would go here
                    // This is a placeholder for actual merge implementation
                    console.log('Merge resolution not yet implemented');
                    break;
                    
                default:
                    throw new Error(`Invalid resolution strategy: ${resolution}`);
            }
            
            card.updateSyncStatus('synced');
            
        } catch (error) {
            console.error(`❌ Error resolving conflicts for card ${cardId}:`, error);
            card.updateSyncStatus('conflict');
            throw error;
        }
    }
    
    /**
     * Shows a loading state in the UI
     * @private
     * @param {boolean} isLoading - Whether to show or hide loading state
     * @param {string} [message] - Optional loading message
     */
    showLoadingState(isLoading, message = '') {
        // Implement loading state UI updates here
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'flex' : 'none';
            if (message) {
                const messageElement = loadingElement.querySelector('.loading-message');
                if (messageElement) {
                    messageElement.textContent = message;
                }
            }
        }
    }
    
    /**
     * Shows an error message in the UI
     * @private
     * @param {string} message - Error message to display
     */
    showError(message) {
        // Implement error display logic here
        console.error('Error:', message);
        // Example: Show a toast notification
        if (window.showToast) {
            window.showToast(message, 'error');
        }
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

            const token = this.generateMessageId();
            card.addDocumentSection("", token);
            
            // ⚡ VERSION SIMPLIFIÉE - pas d'enrichissement
            const documentPrompt = this.buildDocumentPrompt(message, cardId);
            await this.streamToDocument(documentPrompt, cardId, token, card);
            
        } catch (error) {
            console.error('Erreur génération document:', error);
            const card = this.cardSystem.getCard(cardId);
            if (card) {
                card.addDocumentSection('Erreur', 'error-' + Date.now());
                card.finalizeDocumentSection('error-' + Date.now(), 'Erreur de connexion au service IA.');
            }
        }
    }

    async streamToDocument(prompt, cardId, token, card) {
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
                            card.finalizeDocumentSection(token, generatedContent);
                            return;
                        }
                        
                        try {
                            const dataObject = JSON.parse(eventData);
                            if (dataObject.response) {
                                generatedContent += dataObject.response;
                                card.updateDocumentSection(token, generatedContent);
                            }
                        } catch (e) {
                            console.error('Erreur parsing JSON:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur streaming document:', error);
            card.finalizeDocumentSection(token, 'Erreur de connexion.');
        }
    }

    buildDocumentPrompt(userMessage, cardId) {
        const card = this.cardSystem.getCard(cardId);
        const cardTitle = card ? (card.data.mainTitle || 'Document') : 'Document';
        const existingContent = card ? card.getDocumentContent() : '';
        
        const prompt = "Tu es un assistant spécialisé dans la rédaction de documents professionnels.\n\n" +
            "Contexte : Document \"" + cardTitle + "\"\n" +
            "Contenu existant : " + existingContent + "\n\n" +
            "Instruction : " + userMessage + "\n\n" +
            "⚡ IMPORTANTE - COMMANDES JAVASCRIPT :\n" +
            "- Pour changer le titre du document, utilise EXACTEMENT ce format :\n" +
            "```javascript\n" +
            "card.setTitle(\"Nouveau Titre\");\n" +
            "```\n\n" +
            "- Le code JavaScript sera automatiquement exécuté\n" +
            "- Exemple complet :\n" +
            "```javascript\n" +
            "card.setTitle(\"Contrat de Vente\");\n" +
            "```\n\n" +
            "Pour le contenu du document :\n" +
            "- Génère du contenu professionnel structuré\n" +
            "- Utilise des titres avec ## et ###\n" +
            "- Du texte bien formaté\n" +
            "- Style document de travail\n\n" +
            "Si tu veux changer le titre, mets le code JavaScript AU DÉBUT de ta réponse.";
            
        return prompt;
    }

    generateSectionTitle(message) {
        return "Contenu généré"; // Titre générique car plus affiché
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

    // ========== MÉTHODES DEBUG ==========

}

// ========== INITIALISATION GLOBALE ==========

// Initialiser le workspace
document.addEventListener('DOMContentLoaded', () => {
    window.workspaceManager = new WorkspaceManager();
    
    // Initialize workspace
    setTimeout(() => {
        // Initialization code here
    }, 1000);
});

// Export pour utilisation en module si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkspaceManager;
}
