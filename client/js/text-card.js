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

        // Event pour le titre principal modifiable dans le header
        const mainTitle = this.element.querySelector('.card-title');
        if (mainTitle) {
            // Autoriser l'édition manuelle du titre
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
            
            // Empêcher le drag quand on édite le titre
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

    // ⚡ MÉTHODE CRITIQUE - VERSION DEBUGGÉE ET SIMPLIFIÉE
    updateHeaderTitle(content) {
        console.log(`🎯 [${this.data.id}] updateHeaderTitle appelée`);
        console.log(`🎯 [${this.data.id}] Contenu reçu:`, content);
        
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
        
        // ⚡ CONDITION SIMPLIFIÉE : Toujours essayer d'extraire si titre par défaut
        if (currentTitle === 'TITRE' || currentTitle === '' || 
            currentTitle === 'Nouvelle carte texte' || currentTitle.length < 5) {
            
            console.log(`🎯 [${this.data.id}] Conditions remplies, extraction du titre...`);
            
            const newTitle = this.extractTitleFromContent(content);
            console.log(`🎯 [${this.data.id}] Titre extrait:`, newTitle);
            
            if (newTitle && newTitle !== currentTitle) {
                console.log(`✅ [${this.data.id}] Mise à jour titre: "${currentTitle}" → "${newTitle}"`);
                
                // Mettre à jour les données
                this.data.mainTitle = newTitle;
                this.data.title = newTitle;
                
                // Mettre à jour le DOM directement
                titleElement.textContent = newTitle;
                
                // Animation visuelle
                titleElement.style.backgroundColor = 'rgba(249, 228, 121, 0.5)';
                titleElement.style.transition = 'background-color 0.5s ease';
                setTimeout(() => {
                    titleElement.style.backgroundColor = '';
                }, 2000);
                
                this.saveData();
                
                console.log(`🎉 [${this.data.id}] TITRE MIS À JOUR AVEC SUCCÈS !`);
            } else {
                console.warn(`⚠️ [${this.data.id}] Aucun titre extrait ou titre identique`);
            }
        } else {
            console.log(`🚫 [${this.data.id}] Titre déjà défini, pas de mise à jour`);
        }
    }

    // ⚡ EXTRACTION ROBUSTE ET DEBUGGÉE
    extractTitleFromContent(content) {
        console.log(`🔍 [${this.data.id}] extractTitleFromContent - Début extraction`);
        console.log(`🔍 [${this.data.id}] Contenu brut:`, content.substring(0, 200));
        
        if (!content || content.length < 10) {
            console.warn(`⚠️ [${this.data.id}] Contenu trop court`);
            return null;
        }
        
        // Nettoyer le contenu des balises HTML mais garder les retours à la ligne
        let cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`🔍 [${this.data.id}] Contenu nettoyé:`, cleanContent.substring(0, 100));
        
        // ⚡ MÉTHODE 1 : Chercher les titres markdown ## ou ###
        const markdownPatterns = [
            /^##\s*([^#\n\r]+?)(?:\n|\r|$)/im,  // ## Titre
            /^###\s*([^#\n\r]+?)(?:\n|\r|$)/im, // ### Titre
            /^#\s*([^#\n\r]+?)(?:\n|\r|$)/im    // # Titre
        ];
        
        for (const pattern of markdownPatterns) {
            const match = cleanContent.match(pattern);
            if (match) {
                const title = match[1].trim();
                console.log(`🎯 [${this.data.id}] Titre markdown trouvé:`, title);
                if (title.length > 3 && title.length <= 60) {
                    return title;
                }
            }
        }
        
        // ⚡ MÉTHODE 2 : Première ligne significative
        const lines = cleanContent.split(/[\n\r]+/);
        const firstLine = lines[0]?.trim();
        
        if (firstLine && firstLine.length > 5 && firstLine.length <= 80) {
            // Nettoyer la première ligne
            let title = firstLine;
            title = title.replace(/^(voici|voilà|dans|pour|selon|il s'agit de|ceci est|c'est|bonjour|salut)\s+/i, '');
            title = title.replace(/[.!?]+$/, ''); // Supprimer ponctuation finale
            
            console.log(`🎯 [${this.data.id}] Première ligne nettoyée:`, title);
            
            if (title.length > 5 && title.length <= 50) {
                return title.charAt(0).toUpperCase() + title.slice(1);
            }
        }
        
        // ⚡ MÉTHODE 3 : Première phrase
        const sentences = cleanContent.split(/[.!?]+/);
        const firstSentence = sentences[0]?.trim();
        
        if (firstSentence && firstSentence.length > 10 && firstSentence.length <= 60) {
            let title = firstSentence;
            title = title.replace(/^(voici|voilà|dans|pour|selon|il s'agit de|ceci est|c'est)\s+/i, '');
            
            console.log(`🎯 [${this.data.id}] Première phrase nettoyée:`, title);
            return title.charAt(0).toUpperCase() + title.slice(1);
        }
        
        // ⚡ MÉTHODE 4 : Mots-clés significatifs (fallback)
        const words = cleanContent.split(/\s+/);
        const significantWords = words
            .filter(word => word.length > 2 && !/^(le|la|les|de|du|des|un|une|et|ou|à|dans|pour|avec|sur|par|ce|cette|ces|son|sa|ses|qui|que|quoi|comment|pourquoi)$/i.test(word))
            .slice(0, 4);
        
        if (significantWords.length >= 2) {
            const title = significantWords.join(' ');
            console.log(`🎯 [${this.data.id}] Titre par mots-clés:`, title);
            return title.charAt(0).toUpperCase() + title.slice(1);
        }
        
        console.warn(`⚠️ [${this.data.id}] Aucun titre extrait par toutes les méthodes`);
        return null;
    }

    // Méthode debug pour forcer la mise à jour du titre
    forceUpdateTitle(newTitle) {
        console.log(`🔧 [${this.data.id}] FORCE UPDATE TITRE:`, newTitle);
        
        const titleElement = this.element.querySelector('.card-title');
        if (titleElement) {
            this.data.mainTitle = newTitle;
            this.data.title = newTitle;
            titleElement.textContent = newTitle;
            
            // Animation forte pour debug
            titleElement.style.backgroundColor = 'red';
            titleElement.style.color = 'white';
            setTimeout(() => {
                titleElement.style.backgroundColor = '';
                titleElement.style.color = '';
            }, 3000);
            
            this.saveData();
            console.log(`🎉 [${this.data.id}] TITRE FORCÉ MIS À JOUR !`);
        }
    }

    // Méthode de réinitialisation du titre
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
    }

    // Méthodes statiques pour la création de cartes texte
    static createDefaultTextCard(cardData = {}) {
        const position = cardData.position || { x: 200, y: 200 };
        return {
            id: CardSystem.generateCardId('text'),
            type: 'text',
            title: 'TITRE',
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
