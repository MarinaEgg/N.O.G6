// ========== CARTE FICHIER AVEC PREVIEW ==========

class FileCard extends BaseCard {
    constructor(cardData, workspaceManager) {
        // Données par défaut pour les cartes fichier
        const fileDefaults = {
            type: 'file',
            fileData: cardData.fileData || null,
            fileName: cardData.fileName || null,
            fileType: cardData.fileType || null,
            fileSize: cardData.fileSize || 0,
            uploadDate: cardData.uploadDate || new Date().toISOString()
        };

        super({ ...fileDefaults, ...cardData }, workspaceManager);
        this.isPreviewMode = false;
        this.pdfDoc = null;
        this.currentPage = 1;
        
        // Charger PDF.js si pas déjà fait
        this.loadPdfJs();
    }

    async loadPdfJs() {
        if (window.pdfjsLib) return;
        
        try {
            // Approche directe avec script global
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
            
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('✅ PDF.js chargé avec succès');
            }
        } catch (error) {
            console.error('❌ Erreur chargement PDF.js:', error);
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Erreur chargement ${src}`));
            document.head.appendChild(script);
        });
    }

    async renderPdfPage(pageNum) {
        if (!this.pdfDoc) return;

        try {
            const page = await this.pdfDoc.getPage(pageNum);
            const canvas = this.element.querySelector(`#pdf-canvas-${this.data.id}`);
            const ctx = canvas.getContext('2d');

            // Calculer échelle pour s'adapter à la carte
            const cardWidth = this.element.offsetWidth - 32;
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(cardWidth / viewport.width, 0.8);
            const scaledViewport = page.getViewport({ scale });

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            // Rendu de la page
            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            await page.render(renderContext).promise;
            this.updatePageInfo();
            
        } catch (error) {
            console.error('Erreur rendu page PDF:', error);
            const canvas = this.element.querySelector(`#pdf-canvas-${this.data.id}`);
            if (canvas) {
                canvas.style.display = 'none';
                canvas.parentNode.innerHTML += '<p class="error">Erreur rendu PDF</p>';
            }
        }
    }

    setupPdfControls() {
        const prevBtn = this.element.querySelector(`#prev-page-${this.data.id}`);
        const nextBtn = this.element.querySelector(`#next-page-${this.data.id}`);

        prevBtn?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderPdfPage(this.currentPage);
            }
        });

        nextBtn?.addEventListener('click', () => {
            if (this.currentPage < this.pdfDoc.numPages) {
                this.currentPage++;
                this.renderPdfPage(this.currentPage);
            }
        });
    }

    updatePageInfo() {
        const pageInfo = this.element.querySelector(`#page-info-${this.data.id}`);
        if (pageInfo && this.pdfDoc) {
            pageInfo.textContent = `Page ${this.currentPage} / ${this.pdfDoc.numPages}`;
        }
    }

    // Méthodes utilitaires
    isValidFileType(mimeType) {
        const validTypes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif'
        ];
        return validTypes.includes(mimeType);
    }

    isImageFile() {
        return this.data.fileType && this.data.fileType.startsWith('image/');
    }

    isPdfFile() {
        return this.data.fileType === 'application/pdf';
    }

    getFileIcon() {
        if (this.isPdfFile()) return 'file-pdf';
        if (this.isImageFile()) return 'image';
        return 'file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    afterRender() {
        // Mettre à jour les boutons selon l'état du fichier
        const downloadBtn = this.element.querySelector('.file-download-btn');
        const previewBtn = this.element.querySelector('.file-preview-btn');
        const uploadBtn = this.element.querySelector('.file-upload-btn');
        
        const hasFile = !!this.data.fileData;
        
        // Mettre à jour le bouton de téléchargement
        if (downloadBtn) {
            downloadBtn.disabled = !hasFile;
            downloadBtn.title = hasFile ? 'Télécharger le fichier' : 'Aucun fichier à télécharger';
            downloadBtn.classList.toggle('disabled', !hasFile);
        }
        
        // Mettre à jour le bouton de prévisualisation
        if (previewBtn) {
            const canPreview = hasFile && (this.isImageFile() || this.isPdfFile());
            previewBtn.disabled = !canPreview;
            previewBtn.title = canPreview ? 
                (this.isPreviewMode ? 'Voir les détails du fichier' : 'Voir la prévisualisation') :
                'Prévisualisation non disponible';
            previewBtn.classList.toggle('disabled', !canPreview);
            
            // Mettre à jour l'icône en fonction du mode
            if (canPreview) {
                const icon = previewBtn.querySelector('i');
                if (icon) {
                    icon.className = this.isPreviewMode ? 'fas fa-info-circle' : 'fas fa-eye';
                }
            }
        }
        
        // Toujours activer le bouton d'upload
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.title = this.data.fileData ? 'Remplacer le fichier' : 'Téléverser un fichier';
        }
    }

    cleanup() {
        // Nettoyage spécifique aux cartes fichier
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
            this.pdfDoc = null;
        }
    }

    saveData() {
        super.saveData();
        // Sauvegarder aussi dans une clé spécifique pour les fichiers
        if (this.data.fileData) {
            localStorage.setItem(`workspace-file-${this.data.id}`, JSON.stringify({
                fileName: this.data.fileName,
                fileType: this.data.fileType,
                fileSize: this.data.fileSize,
                uploadDate: this.data.uploadDate
            }));
        }
    }

    // Méthodes statiques pour la création de cartes fichier
    static createDefaultFileCard(position = { x: 200, y: 200 }) {
        return {
            id: CardSystem.generateCardId('file'),
            type: 'file',
            title: 'Upload File',
            position,
            pinned: false,
            fileData: null,
            fileName: null,
            fileType: null,
            fileSize: 0,
            uploadDate: new Date().toISOString()
        };
    }


    getHTML() {
        const actions = [
            { 
                class: 'file-upload-btn', 
                icon: 'fas fa-upload', 
                title: 'Upload/Remplacer fichier' 
            },
            { 
                class: 'file-download-btn', 
                icon: 'fas fa-download', 
                title: 'Télécharger fichier',
                disabled: !this.data.fileData
            },
            { 
                class: 'file-preview-btn', 
                icon: 'fas fa-eye', 
                title: 'Voir/Masquer preview',
                disabled: !this.data.fileData
            }
        ];

        return `
            ${CardSystem.createCardHeader(this.data, actions)}
            
            <div class="card-file-view" id="file-view-${this.data.id}">
                ${this.getFileViewHTML()}
            </div>
            
            <div class="card-file-preview" id="file-preview-${this.data.id}" style="display: none;">
                ${this.getPreviewHTML()}
            </div>
            
            <input type="file" id="file-input-${this.data.id}" 
                   accept=".pdf,.png,.jpg,.jpeg,.gif" 
                   style="display: none;">
        `;
    }

    getFileViewHTML() {
        if (!this.data.fileData) {
            return `
                <div class="file-upload-zone">
                    <div class="upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <p class="upload-text">Cliquez pour uploader un fichier</p>
                    <p class="upload-hint">PDF, PNG, JPG, JPEG, GIF</p>
                </div>
            `;
        }

        return `
            <div class="file-info">
                <div class="file-icon">
                    <i class="fas fa-${this.getFileIcon()}"></i>
                </div>
                <div class="file-details">
                    <h4 class="file-name">${this.data.fileName}</h4>
                    <p class="file-meta">
                        <span class="file-type">${this.data.fileType.toUpperCase()}</span>
                        <span class="file-size">${this.formatFileSize(this.data.fileSize)}</span>
                    </p>
                    <p class="upload-date">
                        Uploadé le ${new Date(this.data.uploadDate).toLocaleDateString('fr-FR')}
                    </p>
                </div>
            </div>
        `;
    }

    getPreviewHTML() {
        if (!this.data.fileData) return '<p class="no-preview">Aucun fichier à prévisualiser</p>';

        if (this.isImageFile()) {
            return `
                <div class="image-preview">
                    <div class="image-container" id="image-container-${this.data.id}">
                        <img id="preview-image-${this.data.id}" 
                             src="${this.data.fileData}" 
                             alt="${this.data.fileName}"
                             class="preview-img loaded">
                    </div>
                </div>
            `;
        }

        if (this.isPdfFile()) {
            return `
                <div class="pdf-preview">
                    <div class="pdf-controls">
                        <button id="prev-page-${this.data.id}" class="pdf-btn">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span id="page-info-${this.data.id}">Page 1 / 1</span>
                        <button id="next-page-${this.data.id}" class="pdf-btn">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <canvas id="pdf-canvas-${this.data.id}" class="pdf-canvas"></canvas>
                </div>
            `;
        }

        return '<p class="no-preview">Preview non disponible pour ce type de fichier</p>';
    }

    setupSpecificEvents() {
        const uploadBtn = this.element.querySelector('.file-upload-btn');
        const downloadBtn = this.element.querySelector('.file-download-btn');
        const previewBtn = this.element.querySelector('.file-preview-btn');
        const fileInput = this.element.querySelector(`#file-input-${this.data.id}`);
        const uploadZone = this.element.querySelector('.file-upload-zone');

        // Upload/remplacement de fichier
        uploadBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        uploadZone?.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        fileInput?.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Téléchargement
        downloadBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFile();
        });

        // Toggle preview avec meilleure gestion
        previewBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.togglePreview();
        });

        // Gestion du clavier pour l'accessibilité
        [uploadBtn, downloadBtn, previewBtn].forEach(btn => {
            if (!btn) return;
            
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.click();
                }
            });
        });

        // Drag & drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const uploadZone = this.element.querySelector('.file-upload-zone');
        if (!uploadZone) return;

        // Events de base drag & drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // États visuels
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.add('dragging');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.remove('dragging');
            });
        });

        // Gestion du drop
        uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.remove('drag-over');
            });
        });

        uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        await this.processFile(file);
    }

    async processFile(file) {
        // Vérifier le type de fichier
        if (!this.isValidFileType(file.type)) {
            alert('Type de fichier non supporté. Utilisez PDF, PNG, JPG, JPEG, ou GIF.');
            return;
        }

        // Vérifier la taille (limite à 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('Fichier trop volumineux. Taille maximale : 10MB.');
            return;
        }

        try {
            // Lire le fichier
            const fileData = await this.readFileAsDataURL(file);
            
            // Mettre à jour les données
            this.data.fileData = fileData;
            this.data.fileName = file.name;
            this.data.fileType = file.type;
            this.data.fileSize = file.size;
            this.data.uploadDate = new Date().toISOString();
            this.data.title = file.name;

            // Sauvegarder et re-render
            this.saveData();
            this.render();

        } catch (error) {
            console.error('Erreur lors du traitement du fichier:', error);
            alert('Erreur lors du traitement du fichier.');
        }
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    downloadFile() {
        if (!this.data.fileData) return;

        const link = document.createElement('a');
        link.href = this.data.fileData;
        link.download = this.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async togglePreview() {
        if (!this.data.fileData) {
            console.warn('⚠️ Pas de fichier à prévisualiser');
            return;
        }

        const fileView = this.element.querySelector(`#file-view-${this.data.id}`);
        const previewView = this.element.querySelector(`#file-preview-${this.data.id}`);
        const previewBtn = this.element.querySelector('.file-preview-btn');

        if (!fileView || !previewView || !previewBtn) {
            console.error('❌ Éléments du DOM introuvables pour le togglePreview');
            return;
        }

        // Toggle state
        const isCurrentlyPreview = previewView.style.display !== 'none';
        
        if (isCurrentlyPreview) {
            // Retour au mode info
            fileView.style.display = 'block';
            previewView.style.display = 'none';
            this.element.classList.remove('preview-mode');
            previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            previewBtn.title = 'Voir preview';
            this.isPreviewMode = false;
            console.log('👁️ Retour mode info');
        } else {
            // Passage en mode preview
            fileView.style.display = 'none';
            previewView.style.display = 'block';
            this.element.classList.add('preview-mode');
            previewBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
            previewBtn.title = 'Voir infos fichier';
            this.isPreviewMode = true;
            console.log('👁️ Mode preview activé');

            // Initialiser le preview selon le type
            if (this.isPdfFile()) {
                console.log('📄 Initialisation preview PDF');
                await this.initPdfPreview();
            } else if (this.isImageFile()) {
                console.log('🖼️ Preview image déjà chargé');
                // Attendre le chargement de l'image
                const img = previewView.querySelector('img');
                if (img) {
                    try {
                        await new Promise((resolve, reject) => {
                            if (img.complete) {
                                resolve();
                            } else {
                                img.onload = resolve;
                                img.onerror = reject;
                            }
                        });
                        console.log('✅ Image chargée avec succès');
                    } catch (error) {
                        console.error('❌ Erreur chargement image:', error);
                        previewView.innerHTML = `
                            <div class="preview-error">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>Impossible de charger l'aperçu de l'image</p>
                            </div>
                        `;
                    }
                }
            }
        }
        
        this.saveData();
    }

    async initPdfPreview() {
        if (!this.data.fileData || !this.isPdfFile()) return;

        try {
            await this.loadPdfJs();
            
            // Décoder le PDF
            const pdfData = atob(this.data.fileData.split(',')[1]);
            const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
            
            this.pdfDoc = await loadingTask.promise;
            this.currentPage = 1;
            
            // Mettre à jour l'interface
            this.setupPdfControls();
            await this.renderPdfPage(this.currentPage);
            
        } catch (error) {
            console.error('❌ Erreur initialisation PDF:', error);
            const previewContainer = this.element.querySelector(`#file-preview-${this.data.id}`);
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="preview-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Impossible de charger l'aperçu PDF</p>
                    </div>
                `;
            }
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileCard;
} else {
    window.FileCard = FileCard;
}
