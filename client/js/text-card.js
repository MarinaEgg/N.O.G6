// ========== CARTE TEXTE COLLABORATIVE ==========

class TextCard extends BaseCard {
    constructor(cardData, workspaceManager) {
        // Données par défaut pour les cartes texte
        const textDefaults = {
            type: 'text',
            mainTitle: cardData.mainTitle || cardData.title || 'TITRE',
            client: cardData.client || 'Client',
            dossier: cardData.dossier || 'Nouveau dossier',
            departement: cardData.departement || 'Département',
            repertoires: cardData.repertoires || [],
            theme: cardData.theme || cardData.client || 'Personnalisé',
            description: cardData.description || cardData.dossier || 'Description de la carte',
            stats: cardData.stats || { documents: 0, lastUpdate: 'maintenant' },
            documentContent: cardData.documentContent || null
        };

        super({ ...textDefaults, ...cardData }, workspaceManager);
        this.isDocumentMode = false;
        this.loadDocumentContent();
    }

    getHTML() {
        const actions = [
            { 
                class: 'chat-toggle-btn', 
                icon: 'fas fa-edit', 
                title: 'Mode Collaboration' 
            },
            { 
                class: 'clear-content-btn', 
                icon: 'fas fa-eraser', 
                title: 'Vider le contenu' 
            }
        ];

        return `
            ${CardSystem.createCardHeader(this.data, actions)}
            
            <div class="card-main-title" contenteditable="true" id="main-title-${this.data.id}">
                ${this.data.mainTitle || this.data.title || 'TITRE'}
            </div>
            
            <div class="card-content-view" id="content-${this.data.id}">
                <div class="card-theme">${this.data.client || 'Client'}</div>
                <p class="card-description">${this.data.dossier || this.data.title}</p>
                
                <div class="card-juridique-info">
                    <div class="repertoires-list">
                        ${this.getRepertoiresHTML()}
                    </div>
                    <div class="departement-info">
                        <i class="fas fa-building"></i>
                        <span>${this.data.departement || 'Département'}</span>
                    </div>
                </div>
            </div>
            
            <div class="card-document-view" id="document-${this.data.id}" style="display: none;">
                <div class="document-content" contenteditable="true" id="doc-content-${this.data.id}">
                    <h1 class="document-title">${this.data.title}</h1>
                    <div class="document-body" id="doc-body-${this.data.id}">
                        <p class="document-placeholder">Commencez à taper ou utilisez l'IA pour générer du contenu...</p>
                    </div>
                </div>
                <div class="document-status">
                    <span class="collab-indicator">✍️ Mode collaboration - Tapez ou utilisez la barre de chat</span>
                </div>
            </div>
        `;
    }

    getRepertoiresHTML() {
        if (!this.data.repertoires || !Array.isArray(this.data.repertoires)) return '';
        
        return this.data.repertoires.map(rep => `
            <div class="repertoire-item">
                <i class="fas fa-folder" style="color: #f1c40f;"></i>
                <span>${rep}</span>
            </div>
        `).join('');
    }

    setupSpecificEvents() {
        // Events spécifiques aux cartes texte
        const chatToggleBtn = this.element.querySelector('.chat-toggle-btn');
        const clearContentBtn = this.element.querySelector('.clear-content-btn');
        
        chatToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDocumentMode();
        });
        
        clearContentBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearDocumentContent();
        });

        // Event de saisie dans le document
        const docContent = this.element.querySelector('.document-content');
        if (docContent) {
            docContent.addEventListener('input', () => {
                this.saveDocumentContent();
            });
        }

        // Event pour le titre principal modifiable
        const mainTitle = this.element.querySelector(`#main-title-${this.data.id}`);
        if (mainTitle) {
            mainTitle.addEventListener('blur', () => {
                this.data.mainTitle = mainTitle.textContent.trim() || 'TITRE';
                this.saveData();
            });
            
            mainTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    mainTitle.blur();
                }
            });
        }
    }

    toggleDocumentMode() {
        const documentView = this.element.querySelector('.card-document-view');
        const contentView = this.element.querySelector('.card-content-view');
        const toggleBtn = this.element.querySelector('.chat-toggle-btn');
        
        this.isDocumentMode = documentView.style.display !== 'none';
        
        if (this.isDocumentMode) {
            // Retour au mode normal
            documentView.style.display = 'none';
            contentView.style.display = 'block';
            this.element.classList.remove('document-mode');
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i>';
            toggleBtn.title = 'Mode Collaboration';
            
            if (this.workspaceManager.activeCardChat === this.data.id) {
                this.workspaceManager.disconnectFromMainChat();
            }
        } else {
            // Passage au mode document
            documentView.style.display = 'block';
            contentView.style.display = 'none';
            this.element.classList.add('document-mode');
            toggleBtn.classList.add('active');
            toggleBtn.innerHTML = '<i class="fas fa-file-alt"></i>';
            toggleBtn.title = 'Retour vue normale';
            
            this.workspaceManager.connectToMainChat(this.data.id, this.element);
            
            const docContent = this.element.querySelector('.document-content');
            if (docContent) {
                docContent.focus();
            }
        }
        
        this.isDocumentMode = !this.isDocumentMode;
    }

    saveDocumentContent() {
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (!docBody) return;
        
        const content = docBody.innerHTML;
        this.data.documentContent = content;
        this.saveData();
        localStorage.setItem(`workspace-doc-${this.data.id}`, content);
    }

    loadDocumentContent() {
        // Charger le contenu depuis localStorage
        const content = localStorage.getItem(`workspace-doc-${this.data.id}`);
        if (content) {
            this.data.documentContent = content;
        }
    }

    afterRender() {
        // Restaurer le contenu du document après le rendu
        if (this.data.documentContent) {
            const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
            if (docBody) {
                docBody.innerHTML = this.data.documentContent;
            }
        }
    }

    clearDocumentContent() {
        if (confirm('Vider tout le contenu de ce document ?')) {
            const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
            if (docBody) {
                docBody.innerHTML = '<p class="document-placeholder">Commencez à taper ou utilisez l\'IA pour générer du contenu...</p>';
            }
            
            this.data.documentContent = null;
            this.saveData();
            localStorage.removeItem(`workspace-doc-${this.data.id}`);
            
            console.log(`Document vidé pour la carte ${this.data.id}`);
        }
    }

    getDocumentContent() {
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (!docBody) return '';
        
        return docBody.textContent || docBody.innerText || '';
    }

    // Méthodes pour l'intégration avec le système de chat
    addDocumentSection(sectionTitle, token) {
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (!docBody) return;
        
        // Supprimer le placeholder s'il existe
        const placeholder = docBody.querySelector('.document-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
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

    updateDocumentSection(token, content) {
        const sectionContent = this.element.querySelector(`#content-${token}`);
        if (!sectionContent) return;
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent + '<span class="typing-cursor">▊</span>';
        
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (docBody) {
            docBody.scrollTop = docBody.scrollHeight;
        }
    }

    finalizeDocumentSection(token, content) {
        const sectionContent = this.element.querySelector(`#content-${token}`);
        if (!sectionContent) return;
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent;
        
        // Mettre à jour le titre de la carte si c'est une nouvelle section
        if (token.startsWith('section-') && !token.includes('error')) {
            this.updateCardTitle(content);
        }
        
        this.saveDocumentContent();
    }

    formatDocumentContent(content) {
        if (!content) return '';
        
        // Utiliser marked si disponible, sinon formatage basique
        if (window.marked) {
            return window.marked.parse(content);
        }
        
        return content
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // Auto-génération du titre de carte
    updateCardTitle(content) {
        if (!content) return;
        
        const currentTitle = this.data.mainTitle || '';
        // Ne générer que si titre vide ou par défaut
        if (currentTitle === 'TITRE' || currentTitle === '' || currentTitle === this.data.title) {
            // Extraire les 3-4 premiers mots significatifs
            const words = content.trim().split(/\s+/);
            const significantWords = words
                .filter(word => word.length > 2 && !/^(le|la|les|de|du|des|un|une|et|ou|à|dans|pour|avec|sur|par)$/i.test(word))
                .slice(0, 3);
            
            if (significantWords.length > 0) {
                const newTitle = significantWords.join(' ');
                this.data.mainTitle = newTitle;
                
                // Mettre à jour le DOM
                const titleElement = this.element.querySelector(`#main-title-${this.data.id}`);
                if (titleElement) {
                    titleElement.textContent = newTitle;
                }
                
                this.saveData();
            }
        }
    }
    
    cleanup() {
        // Nettoyage spécifique aux cartes texte
        if (this.workspaceManager.activeCardChat === this.data.id) {
            this.workspaceManager.disconnectFromMainChat();
        }
        
        // Supprimer les données de localStorage si nécessaire
        // localStorage.removeItem(`workspace-doc-${this.data.id}`);
    }

    // Méthodes statiques pour la création de cartes texte
    static createDefaultTextCard(position = { x: 200, y: 200 }) {
        return {
            id: CardSystem.generateCardId('text'),
            type: 'text',
            title: 'Nouvelle carte texte',
            mainTitle: 'TITRE',
            theme: 'Personnalisé',
            description: 'Description de la nouvelle carte',
            position,
            stats: { documents: 0, lastUpdate: 'maintenant' },
            pinned: false,
            documentContent: null
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextCard;
} else {
    window.TextCard = TextCard;
}
