class WorkspaceManager {
    constructor() {
        this.cards = [];
        this.selectedCard = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Chat integration
        this.cardConversations = new Map(); // Map<cardId, conversation_data>
        this.activeCardChat = null; // Currently connected card for chat
        this.originalMessageBox = null; // Reference to original #messages
        
        this.canvas = null;
        this.addCardBtn = null;
        this.saveLayoutBtn = null;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupElements();
                this.initZoomControls(); // Initialiser les contrôles de zoom
            });
        } else {
            this.setupElements();
            this.initZoomControls(); // Initialiser les contrôles de zoom
        }
    }

    setupElements() {
        this.canvas = document.getElementById('workspaceCanvas');
        this.addCardBtn = document.getElementById('addCardBtn');
        this.saveLayoutBtn = document.getElementById('saveLayoutBtn');
        
        // Save reference to original message box
        this.originalMessageBox = document.getElementById('messages');

        if (!this.canvas) {
            console.warn('Workspace elements not found, retrying...');
            setTimeout(() => this.setupElements(), 100);
            return;
        }

        this.setupEventListeners();
        this.loadDefaultCards();
        
        this.loadDefaultCards();
        this.setupChatIntegration();
        this.loadZoomLevel(); // Charger le niveau de zoom sauvegardé
        
        console.log('WorkspaceManager initialized with chat integration and zoom controls');
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
            
            <!-- Vue document standard -->
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
            
            <!-- Vue document collaboratif -->
            <div class="card-document-view" id="document-${cardData.id}" style="display: none;">
                <div class="document-content" contenteditable="true" id="doc-content-${cardData.id}">
                    <h1 class="document-title">${cardData.title}</h1>
                    <div class="document-body" id="doc-body-${cardData.id}">
                        <!-- Le contenu GPT + manuel apparaîtra ici -->
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
        
        // Charger le contenu existant du document
        this.loadCardDocument(cardData.id);
    }

    setupCardEvents(cardElement, cardData) {
        // Click pour sélectionner (pas pour drag)
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
        const chatToggleBtn = cardElement.querySelector('.chat-toggle-btn');
        const clearChatBtn = cardElement.querySelector('.clear-chat-btn');
        
        pinBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePin(cardElement);
        });
        
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCard(cardElement);
        });
        
        // Bouton bascule mode document
        chatToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDocumentMode(cardElement, cardData.id);
        });
        
        // Bouton vider le contenu du document
        clearChatBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearDocumentContent(cardData.id);
            this.clearCardChat(cardData.id);
        });

        // Gestion de l'édition manuelle du document
        const docContent = cardElement.querySelector('.document-content');
        if (docContent) {
            // Sauvegarder automatiquement les modifications
            docContent.addEventListener('input', () => {
                this.saveDocumentContent(cardData.id);
            });
            
            // Gérer les raccourcis clavier
            docContent.addEventListener('keydown', (e) => {
                // Ctrl+B pour gras
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    document.execCommand('bold');
                }
                
                // Ctrl+I pour italique
                if (e.ctrlKey && e.key === 'i') {
                    e.preventDefault();
                    document.execCommand('italic');
                }
            });
        }
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
        
        // Pas de contraintes - placement libre
        const constrainedX = x;
        const constrainedY = y;
        
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
    
    // Chat Integration Methods
    setupChatIntegration() {
        if (window.location.pathname.includes('/workspace')) {
            this.interceptChatFunctions();
        }
    }
    
    interceptChatFunctions() {
        if (window.original_ask_gpt) return; // Already intercepted
        
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
    
    // Toggle chat mode for a card
    toggleChatMode(cardElement, cardId) {
        const chatContainer = cardElement.querySelector('.card-chat-container');
        const contentContainer = cardElement.querySelector('.card-content');
        const chatToggleBtn = cardElement.querySelector('.chat-toggle-btn');
        
        const isCurrentlyInChatMode = !chatContainer.style.display || chatContainer.style.display === 'none' ? false : true;
        
        if (isCurrentlyInChatMode) {
            // Disable chat mode
            chatContainer.style.display = 'none';
            contentContainer.style.display = 'block';
            cardElement.classList.remove('chat-mode');
            chatToggleBtn.classList.remove('active');
            
            // Disconnect from main chat if this card was active
            if (this.activeCardChat === cardId) {
                this.disconnectFromMainChat();
            }
        } else {
            // Enable chat mode
            chatContainer.style.display = 'block';
            contentContainer.style.display = 'none';
            cardElement.classList.add('chat-mode');
            chatToggleBtn.classList.add('active');
            
            // Connect to main chat
            this.connectToMainChat(cardId, cardElement);
        }
    }
    
    // Connect a card to the main chat system
    connectToMainChat(cardId, cardElement) {
        // Disconnect previous card if exists
        if (this.activeCardChat && this.activeCardChat !== cardId) {
            this.disconnectFromMainChat();
        }
        
        this.activeCardChat = cardId;
        this.selectedCard = cardElement;
        
        // Update textarea placeholder
        const textarea = document.getElementById('message-input');
        if (textarea) {
            const cardTitle = cardElement.querySelector('.card-title').textContent;
            textarea.placeholder = `Discuter avec "${cardTitle}"...`;
        }
        
        // Show connection indicator
        this.showChatIndicator(cardElement.querySelector('.card-title').textContent);
        
        // Load and display conversation history in the card
        this.displayCardConversation(cardId);
        
        console.log(`Card ${cardId} connected to main chat`);
    }
    
    // Disconnect from main chat
    disconnectFromMainChat() {
        if (!this.activeCardChat) return;
        
        // Reset placeholder
        const textarea = document.getElementById('message-input');
        if (textarea) {
            textarea.placeholder = 'Posez votre question à N.O.G';
        }
        
        // Remove indicator
        const indicator = document.querySelector('.chat-card-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Visually deactivate previous card
        const prevCard = this.cards.find(c => c.data.id === this.activeCardChat);
        if (prevCard) {
            const chatToggleBtn = prevCard.element.querySelector('.chat-toggle-btn');
            chatToggleBtn?.classList.remove('active');
        }
        
        this.activeCardChat = null;
        this.selectedCard = null;
        
        console.log('Disconnected from main chat');
    }
    
    // Show chat connection indicator
    showChatIndicator(cardTitle) {
        // Remove existing indicator if any
        const existingIndicator = document.querySelector('.chat-card-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'chat-card-indicator';
        indicator.innerHTML = `
            <i class="fas fa-link"></i>
            <span>Connecté à: ${cardTitle}</span>
            <button onclick="window.workspaceManager.disconnectFromMainChat()" title="Déconnecter">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add before chat bar
        const chatContainer = document.querySelector('.modern-chat-container');
        if (chatContainer) {
            chatContainer.parentNode.insertBefore(indicator, chatContainer);
        }
    }
    
    // Handle chat message for a card
    async handleCardChatMessage(message, cardId) {
        try {
            const cardElement = this.cards.find(c => c.data.id === cardId)?.element;
            if (!cardElement) return;
            
            // Clear input
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = '';
                // Reset textarea height
                if (window.modernChatBar) {
                    window.modernChatBar.resizeTextarea();
                }
            }
            
            // Generate unique token for this interaction
            const token = this.generateMessageId();
            
            // Add user message to card
            this.addMessageToCard(cardId, 'user', message, token);
            
            // Add assistant typing indicator
            this.addMessageToCard(cardId, 'assistant', '', token, true);
            
            // Save conversation
            this.saveCardMessage(cardId, 'user', message);
            
            // Call API
            await this.streamToCard(message, cardId, token);
            
        } catch (error) {
            console.error('Card chat error:', error);
            this.addMessageToCard(cardId, 'assistant', 'Error processing your message.', token);
        }
    }
    
    // Stream response to card
    async streamToCard(message, cardId, token) {
        const controller = new AbortController();
        
        try {
            const response = await fetch(`/backend-api/v2/conversation`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'content-type': 'application/json',
                    'accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    conversation_id: `workspace-card-${cardId}`,
                    action: '_ask',
                    model: 'Eggon-V1',
                    meta: {
                        id: token,
                        content: {
                            conversation: this.getCardConversationHistory(cardId),
                            content_type: 'text',
                            parts: [{ content: message, role: 'user' }],
                        },
                    },
                }),
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let assistantText = '';
            
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
                            // Finalize message
                            this.updateCardMessage(cardId, token, assistantText, false);
                            this.saveCardMessage(cardId, 'assistant', assistantText);
                            return;
                        }
                        
                        try {
                            const dataObject = JSON.parse(eventData);
                            if (dataObject.response) {
                                assistantText += dataObject.response;
                                // Update in real-time in the card
                                this.updateCardMessage(cardId, token, assistantText, true);
                            }
                        } catch (e) {
                            console.error('JSON parsing error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            this.updateCardMessage(cardId, token, 'Connection error.', false);
        }
    }
    
    // Add message to card
    addMessageToCard(cardId, role, content, token, isStreaming = false) {
        const messagesContainer = document.getElementById(`messages-${cardId}`);
        if (!messagesContainer) return;
        
        const messageClass = role === 'user' ? 'message-user' : 'message-assistant';
        const avatar = role === 'user' ? 
            '<div class="card-message-avatar user">👤</div>' : 
            '<div class="card-message-avatar assistant">🤖</div>';
        
        const messageHtml = `
            <div class="card-message ${messageClass}" id="msg-${token}">
                ${avatar}
                <div class="card-message-content" id="content-${token}">
                    ${this.formatCardMessage(content)}
                    ${isStreaming ? '<span class="streaming-cursor">▊</span>' : ''}
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Update card message (for streaming)
    updateCardMessage(cardId, token, content, isStreaming) {
        const contentElement = document.getElementById(`content-${token}`);
        if (!contentElement) return;
        
        const formattedContent = this.formatCardMessage(content);
        contentElement.innerHTML = formattedContent + (isStreaming ? '<span class="streaming-cursor">▊</span>' : '');
        
        // Auto-scroll
        const messagesContainer = document.getElementById(`messages-${cardId}`);
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Format message for display in card
    formatCardMessage(content) {
        if (!content) return '';
        // Use the same logic as the main chat
        if (window.marked) {
            return window.marked.parse(content);
        }
        return content.replace(/\n/g, '<br>');
    }
    
    // Save card message to conversation history
    saveCardMessage(cardId, role, content) {
        let conversation = this.cardConversations.get(cardId) || {
            id: cardId,
            title: this.getCardTitle(cardId),
            items: []
        };
        
        conversation.items.push({
            role: role,
            content: content,
            timestamp: Date.now()
        });
        
        this.cardConversations.set(cardId, conversation);
        
        // Save to localStorage
        localStorage.setItem(`workspace-card-${cardId}`, JSON.stringify(conversation));
    }
    
    // Load card conversation from storage
    loadCardConversation(cardId) {
        const saved = localStorage.getItem(`workspace-card-${cardId}`);
        if (saved) {
            try {
                const conversation = JSON.parse(saved);
                this.cardConversations.set(cardId, conversation);
            } catch (e) {
                console.error('Error loading card conversation:', e);
            }
        }
    }
    
    // Display conversation for a card
    displayCardConversation(cardId) {
        const conversation = this.cardConversations.get(cardId);
        const messagesContainer = document.getElementById(`messages-${cardId}`);
        
        if (!conversation || !messagesContainer) return;
        
        messagesContainer.innerHTML = ''; // Clear
        
        conversation.items.forEach((item, index) => {
            const token = `history-${cardId}-${index}`;
            this.addMessageToCard(cardId, item.role, item.content, token, false);
        });
    }
    
    // Clear chat for a card
    clearCardChat(cardId) {
        if (confirm('Clear all conversation history for this card?')) {
            this.cardConversations.delete(cardId);
            localStorage.removeItem(`workspace-card-${cardId}`);
            
            const messagesContainer = document.getElementById(`messages-${cardId}`);
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            
            console.log(`Chat cleared for card ${cardId}`);
        }
    }
    
    // Get conversation history for API
    getCardConversationHistory(cardId) {
        const conversation = this.cardConversations.get(cardId);
        return conversation ? conversation.items : [];
    }
    
    // Get card title by ID
    getCardTitle(cardId) {
        const card = this.cards.find(c => c.data.id === cardId);
        return card ? card.data.title : 'Unknown Card';
    }
    
    // Generate unique message ID
    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    // ========== MÉTHODES DE GESTION DES DOCUMENTS COLLABORATIFS ==========
    
    // Basculer entre la vue normale et le mode document collaboratif
    toggleDocumentMode(cardElement, cardId) {
        const documentView = cardElement.querySelector('.card-document-view');
        const contentView = cardElement.querySelector('.card-content-view');
        const toggleBtn = cardElement.querySelector('.chat-toggle-btn');
        
        const isCurrentlyInDocMode = documentView.style.display !== 'none';
        
        if (isCurrentlyInDocMode) {
            // Retour à la vue normale
            documentView.style.display = 'none';
            contentView.style.display = 'block';
            cardElement.classList.remove('document-mode');
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i>';
            toggleBtn.title = 'Mode Collaboration';
            
            // Déconnecter du chat principal
            if (this.activeCardChat === cardId) {
                this.disconnectFromMainChat();
            }
        } else {
            // Activer le mode document
            documentView.style.display = 'block';
            contentView.style.display = 'none';
            cardElement.classList.add('document-mode');
            toggleBtn.classList.add('active');
            toggleBtn.innerHTML = '<i class="fas fa-file-alt"></i>';
            toggleBtn.title = 'Retour vue normale';
            
            // Connecter au chat principal pour génération de contenu
            this.connectToMainChat(cardId, cardElement);
            
            // Focus sur le contenu éditable
            const docContent = cardElement.querySelector('.document-content');
            if (docContent) {
                docContent.focus();
            }
        }
    }
    
    // Connecter une carte au système de chat principal
    connectToMainChat(cardId, cardElement) {
        // Déconnecter la carte précédente si elle existe
        if (this.activeCardChat && this.activeCardChat !== cardId) {
            this.disconnectFromMainChat();
        }
        
        this.activeCardChat = cardId;
        this.selectedCard = cardElement;
        
        // Mettre à jour le placeholder du textarea
        const textarea = document.getElementById('message-input');
        if (textarea) {
            const cardTitle = cardElement.querySelector('.card-title').textContent;
            textarea.placeholder = `Discuter avec "${cardTitle}"...`;
        }
        
        // Afficher l'indicateur de connexion
        this.showChatIndicator(cardElement.querySelector('.card-title').textContent);
        
        // Charger et afficher l'historique de conversation dans la carte
        this.displayCardConversation(cardId);
        
        console.log(`Carte ${cardId} connectée au chat principal`);
    }
    
    // Déconnecter du chat principal
    disconnectFromMainChat() {
        if (!this.activeCardChat) return;
        
        // Remettre le placeholder par défaut
        const textarea = document.getElementById('message-input');
        if (textarea) {
            textarea.placeholder = 'Posez votre question à N.O.G';
        }
        
        // Supprimer l'indicateur
        const indicator = document.querySelector('.chat-card-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Désactiver visuellement la carte précédente
        const prevCard = this.cards.find(c => c.data.id === this.activeCardChat);
        if (prevCard) {
            const chatToggleBtn = prevCard.element.querySelector('.chat-toggle-btn');
            chatToggleBtn?.classList.remove('active');
        }
        
        this.activeCardChat = null;
        this.selectedCard = null;
        
        console.log('Déconnecté du chat principal');
    }
    
    // Afficher l'indicateur de connexion chat
    showChatIndicator(cardTitle) {
        // Supprimer l'indicateur existant s'il y en a un
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
            <button onclick="window.workspaceManager.disconnectFromMainChat()" title="Déconnecter">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Ajouter avant la barre de chat
        const chatContainer = document.querySelector('.modern-chat-container');
        if (chatContainer) {
            chatContainer.parentNode.insertBefore(indicator, chatContainer);
        }
    }
    
    // Gérer les messages de chat pour une carte
    async handleCardChatMessage(message, cardId) {
        try {
            const cardElement = this.cards.find(c => c.data.id === cardId)?.element;
            if (!cardElement) return;
            
            // Générer un token unique pour cette interaction
            const token = this.generateMessageId();
            
            // Ajouter le message utilisateur à la carte
            this.addMessageToCard(cardId, 'user', message, token);
            
            // Ajouter l'indicateur de frappe de l'assistant
            this.addMessageToCard(cardId, 'assistant', '', token, true);
            
            // Sauvegarder la conversation
            this.saveCardMessage(cardId, 'user', message);
            
            // Appeler l'API
            await this.streamToCard(message, cardId, token);
            
        } catch (error) {
            console.error('Erreur chat carte:', error);
            this.addMessageToCard(cardId, 'assistant', 'Erreur lors du traitement de votre message.', token);
        }
    }
    
    // Streamer la réponse vers la carte
    async streamToCard(message, cardId, token) {
        const controller = new AbortController();
        
        try {
            const response = await fetch(`/backend-api/v2/conversation`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'content-type': 'application/json',
                    'accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    conversation_id: window.conversation_id || `workspace-card-${cardId}`,
                    action: '_ask',
                    model: 'Eggon-V1',
                    meta: {
                        id: token,
                        content: {
                            conversation: this.getCardConversationHistory(cardId),
                            content_type: 'text',
                            parts: [{ content: message, role: 'user' }],
                        },
                    },
                }),
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let assistantText = '';
            
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
                            // Finaliser le message
                            this.updateCardMessage(cardId, token, assistantText, false);
                            this.saveCardMessage(cardId, 'assistant', assistantText);
                            return;
                        }
                        
                        try {
                            const dataObject = JSON.parse(eventData);
                            if (dataObject.response) {
                                assistantText += dataObject.response;
                                // Mettre à jour en temps réel dans la carte
                                this.updateCardMessage(cardId, token, assistantText, true);
                            }
                        } catch (e) {
                            console.error('Erreur parsing JSON:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur streaming:', error);
            this.updateCardMessage(cardId, token, 'Erreur de connexion.', false);
        }
    }
    
    // Ajouter un message à la carte
    addMessageToCard(cardId, role, content, token, isStreaming = false) {
        const messagesContainer = document.getElementById(`messages-${cardId}`);
        if (!messagesContainer) return;
        
        const messageClass = role === 'user' ? 'message-user' : 'message-assistant';
        const avatar = role === 'user' ? 
            '<div class="card-message-avatar user">👤</div>' : 
            '<div class="card-message-avatar assistant">🤖</div>';
        
        const messageHtml = `
            <div class="card-message ${messageClass}" id="msg-${token}">
                ${avatar}
                <div class="card-message-content" id="content-${token}">
                    ${this.formatCardMessage(content)}
                    ${isStreaming ? '<span class="streaming-cursor">▊</span>' : ''}
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Mettre à jour un message de carte (pour le streaming)
    updateCardMessage(cardId, token, content, isStreaming) {
        const contentElement = document.getElementById(`content-${token}`);
        if (!contentElement) return;
        
        const formattedContent = this.formatCardMessage(content);
        contentElement.innerHTML = formattedContent + (isStreaming ? '<span class="streaming-cursor">▊</span>' : '');
        
        // Auto-scroll
        const messagesContainer = document.getElementById(`messages-${cardId}`);
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Formater un message pour l'affichage dans la carte
    formatCardMessage(content) {
        if (!content) return '';
        // Utiliser la même logique que le chat principal
        if (window.marked) {
            return window.marked.parse(content);
        }
        return content.replace(/\n/g, '<br>');
    }
    
    // Sauvegarder un message de carte dans l'historique
    saveCardMessage(cardId, role, content) {
        let conversation = this.cardConversations.get(cardId) || {
            id: cardId,
            title: this.getCardTitle(cardId),
            items: []
        };
        
        conversation.items.push({
            role: role,
            content: content,
            timestamp: Date.now()
        });
        
        this.cardConversations.set(cardId, conversation);
        
        // Sauvegarder dans localStorage
        localStorage.setItem(`workspace-card-${cardId}`, JSON.stringify(conversation));
    }
    
    // Charger la conversation d'une carte depuis le stockage
    loadCardConversation(cardId) {
        const saved = localStorage.getItem(`workspace-card-${cardId}`);
        if (saved) {
            try {
                const conversation = JSON.parse(saved);
                this.cardConversations.set(cardId, conversation);
            } catch (e) {
                console.error('Erreur lors du chargement de la conversation de carte:', e);
            }
        }
    }
    
    // Afficher la conversation pour une carte
    displayCardConversation(cardId) {
        const conversation = this.cardConversations.get(cardId);
        const messagesContainer = document.getElementById(`messages-${cardId}`);
        
        if (!conversation || !messagesContainer) return;
        
        messagesContainer.innerHTML = ''; // Vider
        
        conversation.items.forEach((item, index) => {
            const token = `history-${cardId}-${index}`;
            this.addMessageToCard(cardId, item.role, item.content, token, false);
        });
    }
    
    // Vider le chat d'une carte
    clearCardChat(cardId) {
        if (confirm('Vider tout l\'historique de conversation pour cette carte ?')) {
            this.cardConversations.delete(cardId);
            localStorage.removeItem(`workspace-card-${cardId}`);
            
            const messagesContainer = document.getElementById(`messages-${cardId}`);
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            
            console.log(`Chat vidé pour la carte ${cardId}`);
        }
    }
    
    // Obtenir l'historique de conversation pour l'API
    getCardConversationHistory(cardId) {
        const conversation = this.cardConversations.get(cardId);
        return conversation ? conversation.items : [];
    }
    
    // Obtenir le titre d'une carte par ID
    getCardTitle(cardId) {
        const card = this.cards.find(c => c.data.id === cardId);
        return card ? card.data.title : 'Carte inconnue';
    }
    
    // ========== MÉTHODES DE GESTION DES DOCUMENTS ==========
    
    // Traiter les messages en mode document
    async handleDocumentMessage(message, cardId) {
        try {
            const cardElement = this.cards.find(c => c.data.id === cardId)?.element;
            if (!cardElement) return;
            
            // Transformer la question en titre de section
            const sectionTitle = this.generateSectionTitle(message);
            
            // Ajouter un indicateur de génération
            this.showDocumentGenerating(cardId, sectionTitle);
            
            // Appeler l'API avec un prompt spécialisé pour la génération de document
            const documentPrompt = this.buildDocumentPrompt(message, cardId);
            
            const token = this.generateMessageId();
            await this.streamToDocument(documentPrompt, cardId, sectionTitle, token);
            
        } catch (error) {
            console.error('Erreur génération document:', error);
            this.addToDocument(cardId, `<p class="error">Erreur lors de la génération du contenu.</p>`);
        }
    }

    // Construire un prompt spécialisé pour les documents
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

    // Transformer la question en titre de section
    generateSectionTitle(message) {
        // Simplifier la question en titre
        let title = message.trim();
        
        // Supprimer les mots interrogatifs courants
        title = title.replace(/^(qu'est-ce que|comment|pourquoi|quand|où|qui|quoi)\s*/i, '');
        title = title.replace(/\?$/, '');
        
        // Capitaliser la première lettre
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        // Limiter la longueur
        if (title.length > 60) {
            title = title.substring(0, 57) + '...';
        }
        
        return title || 'Nouvelle section';
    }

    // Afficher l'indicateur de génération
    showDocumentGenerating(cardId, sectionTitle) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return;
        
        // Supprimer le placeholder s'il existe
        const placeholder = docBody.querySelector('.document-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Ajouter l'indicateur de génération
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

    // Streamer vers le document
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
                            conversation: [], // Pas d'historique pour les documents
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
            
            // Supprimer l'indicateur de génération
            this.hideDocumentGenerating(cardId);
            
            // Créer la section avec le titre
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

    // Méthodes utilitaires pour la gestion du document
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
        
        // Formater le contenu avec Markdown
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent + '<span class="typing-cursor">▊</span>';
        
        // Auto-scroll fluide
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (docBody) {
            docBody.scrollTop = docBody.scrollHeight;
        }
        
        // Auto-resize de la carte si nécessaire
        const cardElement = this.cards.find(c => c.data.id === cardId)?.element;
        if (cardElement) {
            const contentHeight = docBody.scrollHeight;
            const maxHeight = window.innerHeight * 0.85;
            
            if (contentHeight > 300 && contentHeight < maxHeight) {
                cardElement.style.minHeight = Math.min(contentHeight + 100, maxHeight) + 'px';
            }
        }
    }

    finalizeDocumentSection(cardId, token, content) {
        const sectionContent = document.getElementById(`content-${token}`);
        if (!sectionContent) return;
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent;
        
        // Ajouter le redimensionnement automatique de la carte
        this.autoResizeDocumentCard(cardId);
    }
    
    // Auto-redimensionnement intelligent des cartes en mode document
    autoResizeDocumentCard(cardId) {
        const cardElement = this.cards.find(c => c.data.id === cardId)?.element;
        if (!cardElement || !cardElement.classList.contains('document-mode')) return;
        
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return;
        
        const contentHeight = docBody.scrollHeight;
        const viewportHeight = window.innerHeight;
        const maxHeight = viewportHeight * 0.85;
        const minHeight = 450;
        
        // Calculer la hauteur idéale
        let idealHeight = Math.max(minHeight, contentHeight + 120);
        idealHeight = Math.min(idealHeight, maxHeight);
        
        // Appliquer avec transition fluide
        cardElement.style.transition = 'min-height 0.3s ease';
        cardElement.style.minHeight = idealHeight + 'px';
        
        // Remettre la transition par défaut après l'animation
        setTimeout(() => {
            cardElement.style.transition = 'all 0.3s ease';
        }, 300);
    }

    formatDocumentContent(content) {
        if (!content) return '';
        
        // Utiliser marked pour le rendu markdown si disponible
        if (window.marked) {
            // Configurer marked pour un rendu plus propre
            const renderer = new window.marked.Renderer();
            
            // Personnaliser le rendu des titres
            renderer.heading = function(text, level) {
                const tag = `h${level}`;
                return `<${tag}>${text}</${tag}>\n`;
            };
            
            // Personnaliser le rendu des paragraphes
            renderer.paragraph = function(text) {
                return `<p>${text}</p>\n`;
            };
            
            return window.marked.parse(content, { renderer });
        }
        
        // Fallback simple mais amélioré
        return content
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^(?!<)/, '<p>')
            .replace(/(?<!>)$/, '</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6])/g, '$1')
            .replace(/<\/h[1-6]><\/p>/g, '<\/h$1>')
            .replace(/$/, '</p>');
    }

    // Sauvegarder le contenu du document
    saveDocumentContent(cardId) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return;
        
        const content = docBody.innerHTML;
        localStorage.setItem(`workspace-doc-${cardId}`, content);
    }

    // Charger le contenu du document
    loadCardDocument(cardId) {
        const content = localStorage.getItem(`workspace-doc-${cardId}`);
        if (content) {
            const docBody = document.getElementById(`doc-body-${cardId}`);
            if (docBody) {
                docBody.innerHTML = content;
            }
        }
    }

    // Obtenir le contenu actuel du document (pour le contexte)
    getDocumentContent(cardId) {
        const docBody = document.getElementById(`doc-body-${cardId}`);
        if (!docBody) return '';
        
        return docBody.textContent || docBody.innerText || '';
    }

    // Vider le contenu du document
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

    // Générer un ID de message unique
    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ========== SYSTÈME DE ZOOM WORKSPACE ==========

    initZoomControls() {
        this.zoomLevel = 1.0; // Niveau de zoom initial (100%)
        this.minZoom = 0.1;   // Zoom minimum (10%)
        this.maxZoom = 2.0;   // Zoom maximum (200%)
        this.zoomStep = 0.1;  // Pas d'incrémentation

        // Créer les contrôles de zoom
        this.createZoomControls();
        
        // Event listeners pour le zoom
        this.setupZoomEventListeners();
        
        console.log('Contrôles de zoom initialisés');
    }

    createZoomControls() {
        // Vérifier si les contrôles existent déjà
        if (document.getElementById('zoom-controls')) return;
        
        const zoomControls = document.createElement('div');
        zoomControls.id = 'zoom-controls';
        zoomControls.className = 'zoom-controls';
        
        zoomControls.innerHTML = `
            <button class="zoom-btn zoom-out" id="zoom-out" title="Zoom arrière (Ctrl + -)">
                <i class="fas fa-minus"></i>
            </button>
            
            <div class="zoom-slider-container">
                <input type="range" 
                       class="zoom-slider" 
                       id="zoom-slider" 
                       min="${this.minZoom * 100}" 
                       max="${this.maxZoom * 100}" 
                       value="100" 
                       step="${this.zoomStep * 100}"
                       title="Niveau de zoom">
            </div>
            
            <div class="zoom-percentage" id="zoom-percentage">100%</div>
            
            <button class="zoom-btn zoom-in" id="zoom-in" title="Zoom avant (Ctrl + +)">
                <i class="fas fa-plus"></i>
            </button>
            
            <button class="zoom-btn fit-screen" id="fit-screen" title="Ajuster à l'écran (Ctrl + F)">
                <i class="fas fa-expand-arrows-alt"></i>
            </button>
            
            <button class="zoom-reset" id="zoom-reset" title="Réinitialiser zoom (Ctrl + 0)">
                Reset
            </button>
        `;
        
        document.body.appendChild(zoomControls);
    }

    setupZoomEventListeners() {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomReset = document.getElementById('zoom-reset');
        const fitScreenBtn = document.getElementById('fit-screen');
        
        // Bouton zoom avant
        zoomInBtn?.addEventListener('click', () => {
            this.zoomIn();
        });
        
        // Bouton zoom arrière
        zoomOutBtn?.addEventListener('click', () => {
            this.zoomOut();
        });
        
        // Slider de zoom
        zoomSlider?.addEventListener('input', (e) => {
            const zoomValue = parseFloat(e.target.value) / 100;
            this.isDragging = false;
            this.setZoom(zoomValue);
        });
        
        // Double-clic pour zoomer sur une carte
        this.cards.forEach((card) => {
            card.element.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.focusOnCard(card.data.id, 1.5);
            });
        });
        
        // Bouton reset
        zoomReset?.addEventListener('click', () => {
            this.resetZoom();
        });
        
        // Bouton fit-to-screen
        fitScreenBtn?.addEventListener('click', () => {
            this.animateFitScreenButton();
            this.fitToScreen();
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '+':
                    case '=':
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        this.resetZoom();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.fitToScreen();
                        break;
                }
            }
        });

        // Ajouter les gestes tactiles
        this.setupTouchGestures();
        
        // Optimisation des performances
        let zoomTimeout;
        const originalSetZoom = this.setZoom.bind(this);
        
        this.setZoom = function(zoomValue) {
            // Activer l'optimisation
            this.optimizeZoomPerformance(true);
            
            // Appliquer le zoom
            originalSetZoom(zoomValue);
            
            // Désactiver l'optimisation après un délai
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(() => {
                this.optimizeZoomPerformance(false);
            }, 300);
        }.bind(this);
        
        // Zoom avec molette (Ctrl + molette)
        this.canvas?.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                
                const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
                const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
                this.setZoom(newZoom);
            }
        });
    }

    zoomIn() {
        const newZoom = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
        this.setZoom(newZoom);
    }

    zoomOut() {
        const newZoom = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
        this.setZoom(newZoom);
    }

    setZoom(zoomValue) {
        // Limiter la valeur dans les bornes
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoomValue));
        
        // Appliquer le zoom au canvas
        this.applyZoom();
        
        // Mettre à jour les contrôles
        this.updateZoomControls();
        
        // Sauvegarder le niveau de zoom
        localStorage.setItem('workspace-zoom-level', this.zoomLevel.toString());
    }

    applyZoom() {
        if (!this.canvas) return;
        
        // Ajouter classe temporaire pour animation fluide
        this.canvas.classList.add('zooming');
        
        // Appliquer la transformation
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        
        // Retirer la classe après l'animation
        setTimeout(() => {
            this.canvas.classList.remove('zooming');
        }, 100);
        
        // Ajuster les états des boutons
        const zoomControls = document.getElementById('zoom-controls');
        if (zoomControls) {
            if (this.zoomLevel !== 1.0) {
                zoomControls.classList.add('active');
            } else {
                zoomControls.classList.remove('active');
            }
        }
    }

    updateZoomControls() {
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomPercentage = document.getElementById('zoom-percentage');
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        
        if (zoomSlider) {
            zoomSlider.value = this.zoomLevel * 100;
        }
        
        if (zoomPercentage) {
            const percentage = Math.round(this.zoomLevel * 100);
            zoomPercentage.textContent = `${percentage}%`;
            
            // Animation de changement
            zoomPercentage.classList.add('changed');
            setTimeout(() => {
                zoomPercentage.classList.remove('changed');
            }, 300);
        }
        
        // États des boutons
        if (zoomInBtn) {
            zoomInBtn.disabled = this.zoomLevel >= this.maxZoom;
            zoomInBtn.style.opacity = this.zoomLevel >= this.maxZoom ? '0.5' : '1';
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.zoomLevel <= this.minZoom;
            zoomOutBtn.style.opacity = this.zoomLevel <= this.minZoom ? '0.5' : '1';
        }
    }

    resetZoom() {
        this.setZoom(1.0);
        
        // Animation de feedback
        const zoomControls = document.getElementById('zoom-controls');
        if (zoomControls) {
            zoomControls.style.transform = 'scale(1.05)';
            setTimeout(() => {
                zoomControls.style.transform = '';
            }, 150);
        }
    }

    loadZoomLevel() {
        const savedZoom = localStorage.getItem('workspace-zoom-level');
        if (savedZoom) {
            const zoomLevel = parseFloat(savedZoom);
            if (zoomLevel >= this.minZoom && zoomLevel <= this.maxZoom) {
                this.setZoom(zoomLevel);
            }
        }
    }

    // Obtenir le niveau de zoom actuel (utile pour d'autres composants)
    getCurrentZoom() {
        return this.zoomLevel;
    }

    // Centrer la vue sur une carte spécifique avec zoom
    focusOnCard(cardId, zoomLevel = 1.2) {
        const cardElement = this.cards.find(c => c.data.id === cardId)?.element;
        if (!cardElement || !this.canvas) return;
        
        // Calculer la position de la carte
        const cardRect = cardElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        
        // Définir le zoom
        this.setZoom(zoomLevel);
        
        // Centrer la carte (animation fluide)
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        
        const offsetX = viewportCenterX - cardCenterX;
        const offsetY = viewportCenterY - cardCenterY;
        
        // Appliquer le déplacement au canvas
        this.canvas.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        this.canvas.style.transform = `scale(${this.zoomLevel}) translate(${offsetX/this.zoomLevel}px, ${offsetY/this.zoomLevel}px)`;
        
        // Retirer la transition après l'animation
        setTimeout(() => {
            this.canvas.style.transition = '';
        }, 600);
    }

    // ========== FONCTIONNALITÉS AVANCÉES DU ZOOM ==========

    // Zoom fit-to-screen (ajuster pour voir toutes les cartes)
    // Animer le bouton fit-screen
    animateFitScreenButton() {
        const fitBtn = document.getElementById('fit-screen');
        if (fitBtn) {
            fitBtn.classList.add('active');
            setTimeout(() => {
                fitBtn.classList.remove('active');
            }, 600);
        }
    }

    fitToScreen() {
        if (!this.canvas || this.cards.length === 0) return;
        
        // Animation du bouton
        this.animateFitScreenButton();
        
        // Calculer les bounds de toutes les cartes
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.cards.forEach(card => {
            const rect = card.element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            
            const x = rect.left - canvasRect.left;
            const y = rect.top - canvasRect.top;
            const width = rect.width;
            const height = rect.height;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
        });
        
        // Calculer le zoom nécessaire avec padding
        const padding = 50;
        const viewportWidth = this.canvas.offsetWidth;
        const viewportHeight = this.canvas.offsetHeight;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;
        
        const scaleX = viewportWidth / contentWidth;
        const scaleY = viewportHeight / contentHeight;
        const optimalZoom = Math.min(scaleX, scaleY, this.maxZoom);
        
        this.setZoom(Math.max(optimalZoom, this.minZoom));
        
        // Centrer le contenu
        this.centerContent();
        
        // Log pour le débogage
        console.log('Fit to screen applied - Zoom:', Math.round(optimalZoom * 100) + '%');
    }

    // Centrer le contenu dans la vue
    centerContent() {
        if (!this.canvas || this.cards.length === 0) return;
        
        // Animation fluide vers le centre
        this.canvas.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        this.canvas.style.transformOrigin = 'center center';
        
        setTimeout(() => {
            this.canvas.style.transition = '';
        }, 500);
    }

    // Zoom sur une zone spécifique
    zoomToArea(x, y, width, height, padding = 50) {
        if (!this.canvas) return;
        
        const viewportWidth = this.canvas.offsetWidth;
        const viewportHeight = this.canvas.offsetHeight;
        
        const scaleX = viewportWidth / (width + padding * 2);
        const scaleY = viewportHeight / (height + padding * 2);
        const optimalZoom = Math.min(scaleX, scaleY, this.maxZoom);
        
        this.setZoom(Math.max(optimalZoom, this.minZoom));
        
        // Calculer le déplacement pour centrer la zone
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;
        
        const offsetX = (viewportCenterX - centerX) / this.zoomLevel;
        const offsetY = (viewportCenterY - centerY) / this.zoomLevel;
        
        this.canvas.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        this.canvas.style.transform = `scale(${this.zoomLevel}) translate(${offsetX}px, ${offsetY}px)`;
        
        setTimeout(() => {
            this.canvas.style.transition = '';
        }, 600);
    }

    // Gestion des gestes tactiles pour mobile
    setupTouchGestures() {
        if (!this.canvas) return;
        
        let initialDistance = 0;
        let initialZoom = 1;
        let isZooming = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                isZooming = true;
                
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                initialDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                initialZoom = this.zoomLevel;
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && isZooming) {
                e.preventDefault();
                
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const currentDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                const scale = currentDistance / initialDistance;
                const newZoom = initialZoom * scale;
                
                this.setZoom(newZoom);
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                isZooming = false;
            }
        });
    }

    // Optimisation des performances pendant le zoom
    optimizeZoomPerformance(enable = true) {
        this.cards.forEach(card => {
            if (enable) {
                // Réduire la qualité pendant le zoom pour de meilleures performances
                card.element.style.willChange = 'transform';
                card.element.style.backfaceVisibility = 'hidden';
                card.element.style.perspective = '1000px';
            } else {
                // Restaurer la qualité normale
                card.element.style.willChange = 'auto';
                card.element.style.backfaceVisibility = 'visible';
                card.element.style.perspective = 'none';
            }
        });
    }
}

// Initialiser le workspace
document.addEventListener('DOMContentLoaded', () => {
    window.workspaceManager = new WorkspaceManager();
});
