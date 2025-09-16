// ========== CARTE TEXTE COLLABORATIVE - TITRE GPT DANS HEADER ==========

class TextCard extends BaseCard {
    constructor(cardData, workspaceManager) {
        // Données par défaut pour les cartes texte
        const textDefaults = {
            type: 'text',
            mainTitle: cardData.mainTitle || 'TITRE', // Sera modifié par GPT
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
            
            <div class="card-content-view" id="content-${this.data.id}">
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

        // 🔧 FIX : Event pour le titre principal modifiable dans le header
        const mainTitle = this.element.querySelector('.card-title');
        if (mainTitle) {
            // 🔧 NOUVEAU : Autoriser l'édition manuelle du titre
            mainTitle.addEventListener('input', () => {
                this.data.mainTitle = mainTitle.textContent.trim() || 'TITRE';
                this.data.title = this.data.mainTitle; // Sync pour compatibilité
                this.saveData();
            });
            
            mainTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    mainTitle.blur();
                }
            });
            
            // 🔧 NOUVEAU : Empêcher le drag quand on édite le titre
            mainTitle.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Empêche le drag de la carte
            });
            
            mainTitle.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche la sélection de carte
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

    // 🔧 MODIFICATION MAJEURE : Méthodes pour l'intégration avec le système de chat
    // Le contenu est ajouté directement dans le document, SANS créer de sections avec titres
    addDocumentSection(sectionTitle, token) {
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (!docBody) return;
        
        // Supprimer le placeholder s'il existe
        const placeholder = docBody.querySelector('.document-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // 🔧 NOUVEAU : Créer juste une div de contenu, SANS titre de section
        const sectionHTML = `
            <div class="document-section" id="section-${token}">
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
        
        // 🔧 MODIFICATION MAJEURE : Mettre à jour le titre du HEADER au lieu du contenu
        if (token.startsWith('section-') && !token.includes('error')) {
            this.updateHeaderTitle(content);
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

    // 🔧 NOUVELLE MÉTHODE : Générer titre dans le header au lieu du contenu
    updateHeaderTitle(content) {
        if (!content) return;
        
        const titleElement = this.element.querySelector('.card-title');
        if (!titleElement) return;
        
        const currentTitle = titleElement.textContent.trim();
        
        // Ne générer que si titre vide ou par défaut
        if (currentTitle === 'TITRE' || currentTitle === '' || currentTitle === 'Nouvelle carte texte' || 
            currentTitle.startsWith('Due Diligence') || currentTitle.startsWith('Compliance') || 
            currentTitle.startsWith('Contrats')) {
            
            // 🔧 AMÉLIORATION : Extraction plus intelligente du titre
            const newTitle = this.extractTitleFromContent(content);
            
            if (newTitle) {
                // Mettre à jour les données
                this.data.mainTitle = newTitle;
                this.data.title = newTitle; // Sync pour compatibilité
                
                // Mettre à jour le DOM directement
                titleElement.textContent = newTitle;
                
                // 🔧 NOUVEAU : Animation de mise à jour du titre
                titleElement.style.backgroundColor = 'rgba(249, 228, 121, 0.3)';
                setTimeout(() => {
                    titleElement.style.backgroundColor = '';
                }, 1000);
                
                this.saveData();
                
                console.log(`📝 Titre généré par GPT: "${newTitle}"`);
            }
        }
    }

    // 🔧 NOUVELLE MÉTHODE : Extraction intelligente du titre depuis le contenu GPT
    extractTitleFromContent(content) {
        if (!content || content.length < 10) return null;
        
        // Nettoyer le contenu des balises HTML
        const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Chercher d'abord les titres markdown (## Titre)
        const markdownTitleMatch = cleanContent.match(/^#{1,3}\s*(.+?)(?:\n|$)/m);
        if (markdownTitleMatch) {
            const title = markdownTitleMatch[1].trim();
            if (title.length <= 50) {
                return title;
            }
        }
        
        // Sinon, extraire la première phrase significative
        const sentences = cleanContent.split(/[.!?]+/);
        const firstSentence = sentences[0]?.trim();
        
        if (firstSentence && firstSentence.length > 5) {
            // Limiter à 40 caractères et nettoyer
            let title = firstSentence;
            
            // Supprimer les mots de début typiques
            title = title.replace(/^(voici|voilà|dans|pour|selon|il s'agit de|ceci est|c'est)\s+/i, '');
            
            // Limiter la longueur
            if (title.length > 40) {
                const words = title.split(' ');
                let shortTitle = '';
                for (const word of words) {
                    if ((shortTitle + ' ' + word).length > 37) break;
                    shortTitle += (shortTitle ? ' ' : '') + word;
                }
                title = shortTitle + '...';
            }
            
            // Capitaliser la première lettre
            title = title.charAt(0).toUpperCase() + title.slice(1);
            
            return title;
        }
        
        // Fallback : extraire les premiers mots significatifs
        const words = cleanContent.split(/\s+/);
        const significantWords = words
            .filter(word => word.length > 2 && !/^(le|la|les|de|du|des|un|une|et|ou|à|dans|pour|avec|sur|par|ce|cette|ces|son|sa|ses)$/i.test(word))
            .slice(0, 3);
        
        if (significantWords.length > 0) {
            const title = significantWords.join(' ');
            return title.charAt(0).toUpperCase() + title.slice(1);
        }
        
        return null;
    }

    // 🔧 NOUVELLE MÉTHODE : Réinitialiser le titre
    resetTitle() {
        this.data.mainTitle = 'TITRE';
        this.data.title = 'TITRE';
        
        const titleElement = this.element.querySelector('.card-title');
        if (titleElement) {
            titleElement.textContent = 'TITRE';
        }
        
        this.saveData();
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
    static createDefaultTextCard(cardData = {}) {
        const position = cardData.position || { x: 200, y: 200 };
        return {
            id: CardSystem.generateCardId('text'),
            type: 'text',
            title: 'TITRE', // 🔧 CHANGEMENT : Titre par défaut unifié
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
