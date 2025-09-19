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
                <div class="card-category-section">
                    <div class="category-tag" id="category-${this.data.id}">
                        ${this.data.category || 'Document de travail'}
                    </div>
                </div>
                
                <div class="card-summary-section">
                    <div class="card-summary-text" id="summary-${this.data.id}">
                        ${this.generateSummary()}
                    </div>
                </div>
                
                <div class="card-filing-section">
                    <div class="filing-folder">
                        <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                            <path d="M10 4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6z"
                                  fill="rgba(253, 224, 71, 0.6)" />
                        </svg>
                        <select class="filing-select" id="filing-select-${this.data.id}">
                            ${this.getFilingOptionsHTML()}
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="card-document-view" id="document-${this.data.id}" style="display: none;">
                <div class="document-content" contenteditable="true" id="doc-content-${this.data.id}">
                    <div class="document-body" id="doc-body-${this.data.id}">
                        <p class="document-placeholder">Commencez à taper ou utilisez l'IA pour générer du contenu...</p>
                    </div>
                </div>
                
                <div class="collaboration-indicator" id="collab-indicator-${this.data.id}" style="display: none;">
                    <svg class="collab-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                        <circle cx="9" cy="8" r="2.5" fill="rgba(59,130,246,0.4)" stroke="rgba(255,255,255,0.8)" stroke-width="1"/>
                        <path d="M4.5 19c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="rgba(255,255,255,0.8)" stroke-width="1" fill="none"/>
                        <rect x="15" y="7" width="4" height="4" rx="1" fill="rgba(16,185,129,0.4)" stroke="rgba(255,255,255,0.8)" stroke-width="1"/>
                        <circle cx="16" cy="8.5" r="0.5" fill="rgba(255,255,255,0.9)"/>
                        <circle cx="18" cy="8.5" r="0.5" fill="rgba(255,255,255,0.9)"/>
                        <path d="M15 11v2c0 1 2 2 2s2-1 2-2v-2" stroke="rgba(255,255,255,0.8)" stroke-width="1" fill="none"/>
                    </svg>
                    <span class="collab-text">Collaboration active</span>
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

        // Event pour le titre éditable dans le header
        const mainTitle = this.element.querySelector('.card-title');
        if (mainTitle) {
            mainTitle.addEventListener('input', () => {
                const newTitle = mainTitle.textContent.trim() || 'TITRE';
                // Mettre à jour les DEUX champs
                this.data.title = newTitle;
                this.data.mainTitle = newTitle;
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
                e.stopPropagation();
            });
            
            mainTitle.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Event pour changement de répertoire
        const filingSelect = this.element.querySelector(`#filing-select-${this.data.id}`);
        if (filingSelect) {
            filingSelect.addEventListener('change', (e) => {
                const newFolder = e.target.value;
                this.data.filingFolder = newFolder;
                this.saveData();
            });
            
            // Empêcher le drag sur la dropdown
            filingSelect.addEventListener('mousedown', (e) => e.stopPropagation());
            filingSelect.addEventListener('click', (e) => e.stopPropagation());
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
            // Masquer l'indicateur de collaboration
            const collabIndicatorHide = this.element.querySelector(`#collab-indicator-${this.data.id}`);
            if (collabIndicatorHide) {
                collabIndicatorHide.style.display = 'none';
            }
            
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
            // Afficher l'indicateur de collaboration
            const collabIndicatorShow = this.element.querySelector(`#collab-indicator-${this.data.id}`);
            if (collabIndicatorShow) {
                collabIndicatorShow.style.display = 'flex';
            }
            
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
        }
    }

    getDocumentContent() {
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (!docBody) return '';
        
        return docBody.textContent || docBody.innerText || '';
    }

    addDocumentSection(sectionTitle, token) {
        const docBody = this.element.querySelector(`#doc-body-${this.data.id}`);
        if (!docBody) {
            console.error(`docBody non trouvé !`);
            return;
        }
        
        // Supprimer le placeholder s'il existe
        const placeholder = docBody.querySelector('.document-placeholder');
        if (placeholder) {
            placeholder.remove();
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
    }

    updateDocumentSection(token, content) {
        const sectionContent = this.element.querySelector(`#content-${token}`);
        if (!sectionContent) {
            console.error(`Section content non trouvée pour token: ${token}`);
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
        const sectionContent = this.element.querySelector(`#content-${token}`);
        if (!sectionContent) {
            console.error(`Section content non trouvée pour finalisation !`);
            return;
        }
        
        // Exécuter les commandes JavaScript avant tout
        this.executeJavaScriptCommands(content);
        
        // Nettoyer le contenu en supprimant les blocs JavaScript
        const cleanContent = this.removeJavaScriptBlocks(content);
        
        // Formater le contenu pour l'affichage
        const formattedContent = this.formatDocumentContent(cleanContent);
        sectionContent.innerHTML = formattedContent;
        
        // Enregistrer le contenu
        this.saveDocumentContent();
        
        // Mettre à jour le résumé
        this.updateSummary();
    }

    executeJavaScriptCommands(content) {
        // Détecter card.setTitle("...")
        const setTitleRegex = /card\.setTitle\s*\(\s*["']([^"']+)["']\s*\)/g;
        let titleMatch;
        while ((titleMatch = setTitleRegex.exec(content)) !== null) {
            const titleValue = titleMatch[1];
            try {
                this.setTitle(titleValue);
            } catch (error) {
                console.error(`Erreur setTitle:`, error);
            }
        }
        
        // Détecter card.setCategory("...")
        const setCategoryRegex = /card\.setCategory\s*\(\s*["']([^"']+)["']\s*\)/g;
        let categoryMatch;
        while ((categoryMatch = setCategoryRegex.exec(content)) !== null) {
            const categoryValue = categoryMatch[1];
            try {
                this.setCategory(categoryValue);
            } catch (error) {
                console.error(`Erreur setCategory:`, error);
            }
        }
        
        // Détecter card.setFolder("...")
        const setFolderRegex = /card\.setFolder\s*\(\s*["']([^"']+)["']\s*\)/g;
        let folderMatch;
        while ((folderMatch = setFolderRegex.exec(content)) !== null) {
            const folderValue = folderMatch[1];
            try {
                this.setFolder(folderValue);
            } catch (error) {
                console.error(`Erreur setFolder:`, error);
            }
        }
        
        // Détecter les blocs ```javascript ... ` ``
        const jsBlockRegex = /```javascript\s*\n([\s\S]*?)\n` ``/g;
        let match;
        while ((match = jsBlockRegex.exec(content)) !== null) {
            const jsCode = match[1].trim();
            try {
                const contextualCode = jsCode.replace(/\bcard\./g, 'this.');
                eval(contextualCode);
            } catch (error) {
                console.error(`Erreur JS:`, error);
            }
        }
    }

    removeJavaScriptBlocks(content) {
        // Supprimer les blocs ```javascript ... ` ``
        let cleanContent = content.replace(/```javascript\s*\n[\s\S]*?\n` ``/gs, '');
        cleanContent = cleanContent.replace(/```javascript[\s\S]*?` ``/gs, '');
        
        // Supprimer les lignes card.setTitle isolées
        cleanContent = cleanContent.replace(/^\s*card\.setTitle\s*\([^)]+\)\s*;?\s*$/gm, '');
        
        // Supprimer les lignes card.setCategory isolées
        cleanContent = cleanContent.replace(/^\s*card\.setCategory\s*\([^)]+\)\s*;?\s*$/gm, '');
        
        // Supprimer les lignes card.setFolder isolées
        cleanContent = cleanContent.replace(/^\s*card\.setFolder\s*\([^)]+\)\s*;?\s*$/gm, '');
        
        // Supprimer les balises <script>
        cleanContent = cleanContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Nettoyer les lignes vides
        cleanContent = cleanContent.replace(/^\s*$/gm, '');
        cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
        
        return cleanContent.trim();
    }

    formatDocumentContent(content) {
        if (!content) return '';
        
        return content
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/#{1,3}\s*(.+?)(<br>|$)/g, '<strong>$1</strong>$2'); // Transformer ## en gras
    }

    setTitle(newTitle) {
        if (newTitle && newTitle.trim().length > 0) {
            this.data.title = newTitle.trim();
            this.data.mainTitle = newTitle.trim();
            
            const titleElement = this.element.querySelector('.card-title');
            if (titleElement) {
                titleElement.textContent = newTitle.trim();
            }
            
            this.saveData();
        }
    }

    setCategory(category) {
        if (category && category.trim().length > 0) {
            this.data.category = category.trim();
            
            const categoryElement = this.element.querySelector(`#category-${this.data.id}`);
            if (categoryElement) {
                categoryElement.textContent = category.trim();
            }
            
            this.saveData();
        }
    }

    setFolder(folder) {
        if (folder && folder.trim().length > 0) {
            this.data.filingFolder = folder.trim();
            
            // Mettre à jour la dropdown
            const filingSelect = this.element.querySelector(`#filing-select-${this.data.id}`);
            if (filingSelect) {
                filingSelect.value = folder.trim();
            }
            
            this.saveData();
        }
    }

    generateSummary() {
        const content = this.getDocumentContent();
        
        if (!content || content.trim().length === 0) {
            return "Document vide - Cliquez pour ajouter du contenu";
        }
        
        // Extraire les premiers mots significatifs (ignorer les titres)
        const cleanContent = content
            .replace(/^#{1,6}\s+/gm, '') // Supprimer les # des titres
            .replace(/\*\*(.*?)\*\*/g, '$1') // Supprimer le gras
            .replace(/\*(.*?)\*/g, '$1') // Supprimer l'italique
            .trim();
        
        // Prendre les 100 premiers caractères
        let summary = cleanContent.substring(0, 100);
        
        // Couper au dernier mot complet
        if (summary.length === 100) {
            const lastSpace = summary.lastIndexOf(' ');
            if (lastSpace > 50) { // Minimum 50 caractères
                summary = summary.substring(0, lastSpace);
            }
            summary += '...';
        }
        
        return summary || "Contenu en cours de rédaction...";
    }

    updateSummary() {
        const summaryElement = this.element.querySelector(`#summary-${this.data.id}`);
        if (summaryElement) {
            summaryElement.textContent = this.generateSummary();
        }
    }

    getFilingOptionsHTML() {
        const allFolders = TextCard.getAllFolders();
        const currentFolder = this.data.filingFolder || 'Documents de travail';
        
        return allFolders.map(folder => 
            `<option value="${folder}" ${folder === currentFolder ? 'selected' : ''}>${folder}</option>` 
        ).join('');
    }

    static getAllFolders() {
        return [
            "Contrats", "Correspondance", "Documents de travail", "Factures de fournisseurs",
            "Office", "Portefeuilles", "Recherches", "Surveillance", "Contre-interrogatoire",
            "Preuve", "Rapports de recherches", "Registraire", "Procédures", 
            "Rapports de surveillance", "Contrats et formulaires", "Transferts de dossiers",
            "Arbitrage", "Cour d'appel du Québec", "Cour d'appel fédérale", 
            "Cour fédérale (Demandes)", "Cours provinciales", "Procès", "Règlement",
            "Autorité Réglementaire", "Concours", "Conditions générales de vente",
            "Incident", "Matériel publicitaire", "Opinions", "Mises en demeure",
            "Opérationnalisation", "Documents de clôture", "Vérification diligente",
            "Livre Corporatif", "Gouvernance", "Réunions", "Incidents", "Opinion / Avis"
        ];
    }

    static getRandomFolder() {
        const folders = TextCard.getAllFolders();
        const randomIndex = Math.floor(Math.random() * folders.length);
        return folders[randomIndex];
    }

    static createDefaultTextCard(cardData = {}) {
        const position = cardData.position || { x: 200, y: 200 };
        return {
            id: CardSystem.generateCardId('text'),
            type: 'text',
            title: 'TITRE',              // Titre par défaut cohérent
            mainTitle: 'TITRE',          // MainTitle par défaut cohérent
            theme: 'Personnalisé',
            description: 'Nouvelle carte de collaboration',
            position,
            stats: { documents: 0, lastUpdate: 'maintenant' },
            pinned: false,
            documentContent: null,
            // Champs de classement et catégorisation
            category: 'Document de travail',
            filingDepartment: 'AVOCAT',
            filingCategory: 'GÉNÉRAL (AVOCAT)',
            filingFolder: TextCard.getRandomFolder(),
            // Ajout des champs manquants
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
