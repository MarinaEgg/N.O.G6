// ========== CARTE FICHIER AVEC PREVIEW - VERSION FIXÉE ==========

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

    // ========== FIX : GESTION PREVIEW SIMPLIFIÉE ==========
    
    async processFile(file) {
        // Vérifier le type de fichier
        if (!this.isValidFileType(file.type)) {
            alert('Type de fichier non supporté. Utilisez PDF, PNG, JPG, JPEG, ou GIF.');
            return;
        }

        // Vérifier la taille (limite à 5MB au lieu de 10MB)
        const maxSize = 5 * 1024 * 1024; // 5MB pour éviter quota exceeded
        if (file.size > maxSize) {
            alert('Fichier trop volumineux. Taille maximale : 5MB.');
            return;
        }

        try {
            const fileData = await this.readFileAsDataURL(file);
            
            // Mettre à jour les données
            this.data.fileData = fileData;
            this.data.fileName = file.name;
            this.data.fileType = file.type;
            this.data.fileSize = file.size;
            this.data.uploadDate = new Date().toISOString();
            this.data.title = file.name;

            // 🔧 FIX : Sauvegarder SANS localStorage si trop gros
            this.saveDataSafely();
            
            // Re-render puis afficher automatiquement le preview
            this.render();
            
            // 🔧 FIX : Auto-preview après upload
            setTimeout(() => {
                this.showPreview();
            }, 100);

        } catch (error) {
            console.error('Erreur lors du traitement du fichier:', error);
            alert('Erreur lors du traitement du fichier.');
        }
    }

    // 🔧 FIX : Sauvegarde sécurisée
    saveDataSafely() {
        try {
            super.saveData();
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Fichier trop gros pour localStorage, stockage en mémoire uniquement');
                // Le fichier reste en mémoire dans this.data
            } else {
                console.error('❌ Erreur sauvegarde:', error);
            }
        }
    }

    // 🔧 FIX : Méthodes preview simplifiées
    
    showPreview() {
        if (!this.data.fileData) return;
        
        const fileView = this.element.querySelector(`#file-view-${this.data.id}`);
        const previewView = this.element.querySelector(`#file-preview-${this.data.id}`);
        const previewBtn = this.element.querySelector('.file-preview-btn');

        if (!fileView || !previewView || !previewBtn) return;

        // Afficher la preview
        fileView.style.display = 'none';
        previewView.style.display = 'block';
        this.element.classList.add('preview-mode');
        
        // Mettre à jour le bouton
        const icon = previewBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-info-circle';
        previewBtn.title = 'Voir infos fichier';
        
        this.isPreviewMode = true;
        console.log('👁️ Preview activée pour:', this.data.fileName);

        // Initialiser selon le type
        if (this.isPdfFile()) {
            this.initPdfPreview();
        }
    }

    hidePreview() {
        const fileView = this.element.querySelector(`#file-view-${this.data.id}`);
        const previewView = this.element.querySelector(`#file-preview-${this.data.id}`);
        const previewBtn = this.element.querySelector('.file-preview-btn');

        if (!fileView || !previewView || !previewBtn) return;

        // Afficher les infos
        fileView.style.display = 'block';
        previewView.style.display = 'none';
        this.element.classList.remove('preview-mode');
        
        // Mettre à jour le bouton
        const icon = previewBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-eye';
        previewBtn.title = 'Voir preview';
        
        this.isPreviewMode = false;
        console.log('👁️ Preview masquée');
    }

    // 🔧 FIX : Toggle preview corrigé
    async togglePreview() {
        if (!this.data.fileData) {
            console.warn('⚠️ Pas de fichier à prévisualiser');
            return;
        }

        if (this.isPreviewMode) {
            this.hidePreview();
        } else {
            this.showPreview();
        }
    }

    // ========== RESTE DU CODE IDENTIQUE ==========

    async renderPdfPage(pageNum) {
        if (!this.pdfDoc) return;

        try {
            const page = await this.pdfDoc.getPage(pageNum);
            const canvas = this.element.querySelector(`#pdf-canvas-${this.data.id}`);
            const ctx = canvas.getContext('2d');

            const cardWidth = this.element.offsetWidth - 32;
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(cardWidth / viewport.width, 0.8);
            const scaledViewport = page.getViewport({ scale });

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

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
        const downloadBtn = this.element.querySelector('.file-download-btn');
        const previewBtn = this.element.querySelector('.file-preview-btn');
        const uploadBtn = this.element.querySelector('.file-upload-btn');
        
        const hasFile = !!this.data.fileData;
        
        if (downloadBtn) {
            downloadBtn.disabled = !hasFile;
            downloadBtn.classList.toggle('disabled', !hasFile);
        }
        
        if (previewBtn) {
            const canPreview = hasFile && (this.isImageFile() || this.isPdfFile());
            previewBtn.disabled = !canPreview;
            previewBtn.classList.toggle('disabled', !canPreview);
        }
        
        if (uploadBtn) {
            uploadBtn.disabled = false;
        }
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
                    <p class="upload-hint">PDF, PNG, JPG, JPEG, GIF (max 5MB)</p>
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
                             class="preview-img"
                             onload="this.classList.add('loaded')">
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

        downloadBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFile();
        });

        // 🔧 FIX : Event preview corrigé
        previewBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('🔧 Click preview button');
            this.togglePreview();
        });

        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const uploadZone = this.element.querySelector('.file-upload-zone');
        if (!uploadZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
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

    async initPdfPreview() {
        if (!this.data.fileData || !this.isPdfFile()) return;

        try {
            await this.loadPdfJs();
            
            const pdfData = atob(this.data.fileData.split(',')[1]);
            const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
            
            this.pdfDoc = await loadingTask.promise;
            this.currentPage = 1;
            
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

    cleanup() {
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
            this.pdfDoc = null;
        }
    }

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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileCard;
} else {
    window.FileCard = FileCard;
}
