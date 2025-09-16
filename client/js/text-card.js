// ========== TEXTCARD - FIX DÉFINITIF TITRE HEADER ==========

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

        // ⚡ CORRECTION : Event pour le titre éditable dans le header
        const mainTitle = this.element.querySelector('.card-title');
        if (mainTitle) {
            mainTitle.addEventListener('input', () => {
                const newTitle = mainTitle.textContent.trim() || 'TITRE';
                // ⚡ Mettre à jour les DEUX champs
                this.data.title = newTitle;
                this.data.mainTitle = newTitle;
                this.saveData();
                console.log(`📝 Titre modifié manuellement: ${newTitle}`);
            });
            
            mainTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    mainTitle.blur();
                }
            });
            
            // Empêcher le drag quand on édite le titre
            mainTitle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            
            mainTitle.addEventListener('click', (e) => {
                e.stopPropagation();
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

    // ========== MÉTHODES GPT - VERSION SIMPLIFIÉE ET DEBUGGÉE ==========

    addDocumentSection(sectionTitle, token) {
        console.log(`🔧 [${this.data.id}] addDocumentSection appelée avec token: ${token}`);
        
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (!docBody) {
            console.error(`❌ [${this.data.id}] docBody non trouvé !`);
            return;
        }
        
        // Supprimer le placeholder s'il existe
        const placeholder = docBody.querySelector('.document-placeholder');
        if (placeholder) {
            placeholder.remove();
            console.log(`🔧 [${this.data.id}] Placeholder supprimé`);
        }
        
        // Créer juste une div de contenu, SANS titre de section
        const sectionHTML = `
            <div class="document-section" id="section-${token}">
                <div class="section-content" id="content-${token}">
                    <span class="typing-cursor">▊</span>
                </div>
            </div>
        `;
        
        docBody.insertAdjacentHTML('beforeend', sectionHTML);
        docBody.scrollTop = docBody.scrollHeight;
        
        console.log(`✅ [${this.data.id}] Section créée pour token: ${token}`);
    }

    updateDocumentSection(token, content) {
        console.log(`🔧 [${this.data.id}] updateDocumentSection - token: ${token}, content: ${content.substring(0, 50)}...`);
        
        const sectionContent = this.element.querySelector(`#content-${token}`);
        if (!sectionContent) {
            console.error(`❌ [${this.data.id}] Section content non trouvée pour token: ${token}`);
            return;
        }
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent + '<span class="typing-cursor">▊</span>';
        
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (docBody) {
            docBody.scrollTop = docBody.scrollHeight;
        }
    }

    finalizeDocumentSection(token, content) {
        console.log(`🔧 [${this.data.id}] finalizeDocumentSection - token: ${token}`);
        console.log(`🔧 [${this.data.id}] Contenu final (100 premiers caractères):`, content.substring(0, 100));
        
        const sectionContent = this.element.querySelector(`#content-${token}`);
        if (!sectionContent) {
            console.error(`❌ [${this.data.id}] Section content non trouvée pour finalisation !`);
            return;
        }
        
        const formattedContent = this.formatDocumentContent(content);
        sectionContent.innerHTML = formattedContent;
        
        // ⚡ POINT CRUCIAL : Extraire et mettre à jour le titre du HEADER
        if (token.startsWith('section-') && !token.includes('error')) {
            console.log(`🎯 [${this.data.id}] Tentative extraction titre depuis:`, content.substring(0, 200));
            this.updateHeaderTitle(content);
        }
        
        this.saveDocumentContent();
    }

    formatDocumentContent(content) {
        if (!content) return '';
        
        // ⚡ IMPORTANT : Garder le contenu brut pour l'extraction de titre
        // mais formater pour l'affichage
        return content
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/#{1,3}\s*(.+?)(<br>|$)/g, '<strong>$1</strong>$2'); // Transformer ## en gras
    }

    updateHeaderTitle(content) {
        console.log(`🎯 [${this.data.id}] updateHeaderTitle appelée`);
        
        if (!content) {
            console.warn(`⚠️ [${this.data.id}] Pas de contenu pour extraction titre`);
            return;
        }
        
        const titleElement = this.element.querySelector('.card-title');
        if (!titleElement) {
            console.error(`❌ [${this.data.id}] Élément titre non trouvé !`);
            return;
        }
        
        const currentTitle = titleElement.textContent.trim();
        console.log(`🎯 [${this.data.id}] Titre actuel:`, currentTitle);
        
        // CONDITION SIMPLIFIÉE : Toujours essayer d'extraire si titre par défaut
        if (currentTitle === 'TITRE' || currentTitle === 'New Document' || 
            currentTitle === 'Nouvelle carte texte' || currentTitle.length < 5) {
            
            console.log(`🎯 [${this.data.id}] Extraction du titre...`);
            
            const newTitle = this.extractTitleFromContent(content);
            console.log(`🎯 [${this.data.id}] Titre extrait:`, newTitle);
            
            if (newTitle && newTitle !== currentTitle) {
                console.log(`✅ [${this.data.id}] Mise à jour titre: "${currentTitle}" → "${newTitle}"`);
                
                // ⚡ CORRECTION CRITIQUE : Mettre à jour TOUS les champs de titre
                this.data.title = newTitle;        // Titre principal
                this.data.mainTitle = newTitle;    // Titre spécifique TextCard
                
                // Mettre à jour le DOM
                titleElement.textContent = newTitle;
                
                // Animation visuelle
                titleElement.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                titleElement.style.transition = 'background-color 0.5s ease';
                setTimeout(() => {
                    titleElement.style.backgroundColor = '';
                }, 2000);
                
                this.saveData();
                console.log(`🎉 [${this.data.id}] TITRE MIS À JOUR AVEC SUCCÈS !`);
            }
        }
    }

    extractTitleFromContent(content) {
        console.log(`🔍 [${this.data.id}] extractTitleFromContent - Début extraction`);
        
        if (!content || content.length < 10) {
            console.warn(`⚠️ [${this.data.id}] Contenu trop court`);
            return null;
        }
        
        // Nettoyer le contenu des balises HTML
        let cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`🔍 [${this.data.id}] Contenu nettoyé:`, cleanContent.substring(0, 100));
        
        // ⚡ MÉTHODE 1 : Chercher les titres markdown (priorité absolue)
        const markdownTitlePatterns = [
            /^##\s*([^#\n\r]+?)(?:\s*\n|\s*\r|$)/im,   // ## Titre Principal
            /^###\s*([^#\n\r]+?)(?:\s*\n|\s*\r|$)/im,  // ### Sous-titre
            /^#\s*([^#\n\r]+?)(?:\s*\n|\s*\r|$)/im     // # Titre simple
        ];
        
        for (const pattern of markdownTitlePatterns) {
            const match = cleanContent.match(pattern);
            if (match) {
                let title = match[1].trim();
                console.log(`🎯 [${this.data.id}] Titre markdown trouvé:`, title);
                
                // Nettoyer le titre
                title = title.replace(/[*_`]/g, ''); // Supprimer markdown
                
                if (title.length >= 3 && title.length <= 60) {
                    return title;
                }
            }
        }
        
        // ⚡ MÉTHODE 2 : Première phrase significative
        const sentences = cleanContent.split(/[.!?]+/);
        for (const sentence of sentences.slice(0, 3)) { // Tester les 3 premières phrases
            if (!sentence) continue;
            
            let title = sentence.trim();
            
            // Supprimer les mots d'introduction courants
            title = title.replace(/^(voici|voilà|dans|pour|selon|il s'agit de|ceci est|c'est|bonjour|salut|alors|donc|ainsi|enfin)\s+/i, '');
            
            // Vérifier si c'est un bon titre
            if (title.length >= 5 && title.length <= 50) {
                // Ne pas prendre des phrases trop génériques
                const genericPhrases = /^(je|nous|vous|il|elle|on|cela|ceci|cette|ce)/i;
                if (!genericPhrases.test(title)) {
                    console.log(`🎯 [${this.data.id}] Titre par phrase:`, title);
                    return title.charAt(0).toUpperCase() + title.slice(1);
                }
            }
        }
        
        // ⚡ MÉTHODE 3 : Première ligne non vide
        const lines = cleanContent.split(/[\n\r]+/);
        for (const line of lines.slice(0, 3)) {
            if (!line) continue;
            
            let title = line.trim();
            title = title.replace(/^(voici|voilà|dans|pour|selon|il s'agit de|ceci est|c'est)\s+/i, '');
            title = title.replace(/[.!?]+$/, ''); // Supprimer ponctuation finale
            
            if (title.length >= 5 && title.length <= 60) {
                console.log(`🎯 [${this.data.id}] Titre par ligne:`, title);
                return title.charAt(0).toUpperCase() + title.slice(1);
            }
        }
        
        console.warn(`⚠️ [${this.data.id}] Aucun titre extrait`);
        return null;
    }

    
    cleanup() {
        // Nettoyage spécifique aux cartes texte
        if (this.workspaceManager.activeCardChat === this.data.id) {
            this.workspaceManager.disconnectFromMainChat();
        }
    }

    // Méthodes statiques pour la création de cartes texte
    static createDefaultTextCard(cardData = {}) {
        const position = cardData.position || { x: 200, y: 200 };
        return {
            id: CardSystem.generateCardId('text'),
            type: 'text',
            title: 'TITRE',              // ⚡ Titre par défaut cohérent
            mainTitle: 'TITRE',          // ⚡ MainTitle par défaut cohérent
            theme: 'Personnalisé',
            description: 'Nouvelle carte de collaboration',
            position,
            stats: { documents: 0, lastUpdate: 'maintenant' },
            pinned: false,
            documentContent: null,
            // ⚡ Ajout des champs manquants
            client: 'Client',
            dossier: 'Nouveau dossier', 
            departement: 'Département',
            repertoires: []
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextCard;
} else {
    window.TextCard = TextCard;
}
