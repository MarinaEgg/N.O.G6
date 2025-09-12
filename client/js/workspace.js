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
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
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
        
        // Setup chat integration
        this.setupChatIntegration();
        
        console.log('WorkspaceManager initialized with chat integration');
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
                    <button class="card-action-btn chat-toggle-btn" title="Mode Chat" data-card-id="${cardData.id}">
                        <i class="fas fa-comments"></i>
                    </button>
                    <button class="card-action-btn pin-btn ${cardData.pinned ? 'pinned' : ''}" title="Épingler">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button class="card-action-btn clear-chat-btn" title="Vider le chat" data-card-id="${cardData.id}">
                        <i class="fas fa-broom"></i>
                    </button>
                    <button class="card-action-btn delete-btn" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <!-- Standard content area -->
            <div class="card-content" id="content-${cardData.id}">
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
            
            <!-- Chat area (hidden by default) -->
            <div class="card-chat-container" id="chat-${cardData.id}" style="display: none;">
                <div class="card-chat-messages" id="messages-${cardData.id}">
                    <!-- Chat messages will be injected here -->
                </div>
                <div class="card-chat-status" id="status-${cardData.id}">
                    <span class="chat-indicator">💬 Chat actif</span>
                </div>
            </div>
        `;

        this.canvas.appendChild(cardElement);
        this.setupCardEvents(cardElement, cardData);
        this.cards.push({ element: cardElement, data: cardData });
        
        // Load existing conversation for this card
        this.loadCardConversation(cardData.id);
    }

    setupCardEvents(cardElement, cardData) {
        // Click to select (not drag)
        cardElement.addEventListener('click', (e) => {
            if (!this.isDragging) {
                this.selectCard(cardElement);
            }
        });
        
        // Drag & Drop
        cardElement.addEventListener('mousedown', (e) => this.handleMouseDown(e, cardElement));
        
        // Action buttons
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
        
        // Chat toggle button
        chatToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleChatMode(cardElement, cardData.id);
        });
        
        // Clear chat button
        clearChatBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearCardChat(cardData.id);
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
