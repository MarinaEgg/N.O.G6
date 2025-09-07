class ModernChatBar {
    constructor() {
        this.textarea = null;
        this.plusButton = null;
        this.connectorButton = null;
        this.plusMenu = null;
        this.connectorMenu = null;
        this.dragDropOverlay = null;
        this.isInitialized = false;
        
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
        // Utiliser le même textarea que l'ancien système
        this.textarea = document.getElementById('message-input');
        this.plusButton = document.getElementById('plusButton');
        this.connectorButton = document.getElementById('connectorButton');
        this.plusMenu = document.getElementById('plusMenu');
        this.connectorMenu = document.getElementById('connectorMenu');
        this.dragDropOverlay = document.getElementById('dragDropOverlay');

        if (!this.textarea) {
            console.warn('Modern chat elements not found, retrying...');
            setTimeout(() => this.setupElements(), 100);
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('ModernChatBar initialized successfully');
    }

    setupEventListeners() {
        this.setupTextareaResize();
        this.setupMenuToggles();
        this.setupDragAndDrop();
        this.setupKeyboardShortcuts();
        this.setupClickOutside();
    }

    setupTextareaResize() {
        this.textarea.addEventListener('input', () => {
            this.resizeTextarea();
        });

        // Ne pas redéfinir l'événement Enter car il est géré dans chat.js
    }

    resizeTextarea() {
        if (!this.textarea) return;
        
        this.textarea.style.height = 'auto';
        const scrollHeight = this.textarea.scrollHeight;
        const maxHeight = 200;
        const minHeight = 40;
        
        if (scrollHeight > maxHeight) {
            this.textarea.style.height = maxHeight + 'px';
            this.textarea.classList.add('scrollable');
        } else {
            this.textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
            this.textarea.classList.remove('scrollable');
        }
    }

    resetTextareaHeight() {
        if (!this.textarea) return;
        
        this.textarea.style.height = 'auto';
        this.textarea.style.height = '40px';
        this.textarea.classList.remove('scrollable');
    }

    setupMenuToggles() {
        if (this.plusButton) {
            this.plusButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu('plus');
            });
        }

        if (this.connectorButton) {
            this.connectorButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu('connector');
            });
        }
    }

    toggleMenu(type) {
        if (type === 'plus' && this.plusMenu && this.connectorMenu) {
            this.connectorMenu.classList.remove('show');
            this.connectorButton?.classList.remove('active');
            this.plusMenu.classList.toggle('show');
            this.plusButton?.classList.toggle('active');
        } else if (this.connectorMenu && this.plusMenu) {
            this.plusMenu.classList.remove('show');
            this.plusButton?.classList.remove('active');
            this.connectorMenu.classList.toggle('show');
            this.connectorButton?.classList.toggle('active');
        }
    }

    closeAllMenus() {
        this.plusMenu?.classList.remove('show');
        this.connectorMenu?.classList.remove('show');
        this.plusButton?.classList.remove('active');
        this.connectorButton?.classList.remove('active');
    }

    setupClickOutside() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.modern-chat-bar')) {
                this.closeAllMenus();
            }
        });
    }

    setupDragAndDrop() {
        if (!this.dragDropOverlay) return;
        
        let dragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            this.dragDropOverlay.classList.add('active');
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                this.dragDropOverlay.classList.remove('active');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            this.dragDropOverlay.classList.remove('active');
            this.handleFileDrop(e.dataTransfer.files);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'u':
                        e.preventDefault();
                        this.handleFileUpload();
                        break;
                    case 'k':
                        e.preventDefault();
                        this.focus();
                        break;
                }
            }
        });
    }

    handleFileDrop(files) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint'
        ];

        const validFiles = Array.from(files).filter(file => 
            allowedTypes.includes(file.type)
        );

        if (validFiles.length > 0) {
            console.log('Valid files dropped:', validFiles);
            this.processFiles(validFiles);
        } else {
            this.showError('Types de fichiers non supportés');
        }
    }

    processFiles(files) {
        files.forEach(file => {
            console.log(`Processing file: ${file.name}`);
            // Ici tu intégreras avec ton backend pour traiter les fichiers
        });
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(220, 38, 38, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            font-family: Inter, sans-serif;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Méthodes pour les actions des menus
    handleFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.processFiles(files);
            this.closeAllMenus();
        };
        input.click();
    }

    handleScreenshot() {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ 
                video: { 
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            })
            .then(stream => {
                console.log('Screenshot capture initiated');
                // Ici tu ajouteras la logique de capture d'écran
                // Pour l'instant on arrête juste le stream
                stream.getTracks().forEach(track => track.stop());
                this.closeAllMenus();
            })
            .catch(err => {
                console.error('Screenshot error:', err);
                this.showError('Erreur lors de la capture d\'écran');
            });
        } else {
            this.showError('La capture d\'écran n\'est pas supportée par ce navigateur');
        }
        this.closeAllMenus();
    }

    handleFolderSelection() {
        console.log('Opening iManage folder search');
        // Ici tu intégreras avec l'API iManage
        this.showError('Fonctionnalité iManage en cours de développement');
        this.closeAllMenus();
    }

    handleDeepSearch() {
        console.log('Activating deep search with Jina.ai');
        // Ici tu intégreras avec Jina.ai
        this.showError('Recherche approfondie en cours de développement');
        this.closeAllMenus();
    }

   handleAddConnectors() {
       console.log('Opening connector management');
       // Ici tu ajouteras l'interface de gestion
       this.showError('Gestion des connecteurs en cours de développement');
       this.closeAllMenus();
   }

   handleIManageConnection() {
       console.log('Connecting to iManage');
       // Ici tu ajouteras la logique de connexion
       this.showError('Connexion iManage en cours de développement');
       this.closeAllMenus();
   }

   // Méthode pour focus sur le textarea (utile pour les raccourcis)
   focus() {
       if (this.textarea) {
           this.textarea.focus();
       }
   }

   // Méthode pour insérer du texte dans le textarea
   insertText(text) {
       if (this.textarea) {
           const start = this.textarea.selectionStart;
           const end = this.textarea.selectionEnd;
           const currentValue = this.textarea.value;
           
           this.textarea.value = currentValue.substring(0, start) + text + currentValue.substring(end);
           this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
           this.resizeTextarea();
       }
   }
}

// Fonctions globales pour compatibilité avec les onclick dans le HTML
function handleFileUpload() {
   if (window.modernChatBar) {
       window.modernChatBar.handleFileUpload();
   }
}

function handleScreenshot() {
   if (window.modernChatBar) {
       window.modernChatBar.handleScreenshot();
   }
}

function handleFolderSelection() {
   if (window.modernChatBar) {
       window.modernChatBar.handleFolderSelection();
   }
}

function handleDeepSearch() {
   if (window.modernChatBar) {
       window.modernChatBar.handleDeepSearch();
   }
}

function handleAddConnectors() {
   if (window.modernChatBar) {
       window.modernChatBar.handleAddConnectors();
   }
}

function handleIManageConnection() {
   if (window.modernChatBar) {
       window.modernChatBar.handleIManageConnection();
   }
}

function sendMessage() {
   if (window.modernChatBar) {
       window.modernChatBar.sendMessage();
   }
}

// Export pour utilisation
if (typeof window !== 'undefined') {
   window.ModernChatBar = ModernChatBar;
}
