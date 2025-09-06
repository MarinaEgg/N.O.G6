/* ========== GESTIONNAIRE DE LA BARRE DE CHAT RESPONSIVE ========== */

class ChatInputManager {
  constructor() {
    this.textarea = null;
    this.inputBox = null;
    this.messagesContainer = null;
    this.minHeight = 40;
    this.maxHeight = 200;
    this.lineHeight = 20;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupElements());
    } else {
      this.setupElements();
    }
  }

  setupElements() {
    this.textarea = document.getElementById('message-input');
    this.inputBox = document.querySelector('.input-box');
    this.messagesContainer = document.getElementById('messages');
    
    if (!this.textarea || !this.inputBox) {
      console.warn('Éléments de chat non trouvés, retry dans 100ms');
      setTimeout(() => this.setupElements(), 100);
      return;
    }

    this.setupEventListeners();
    this.isInitialized = true;
    console.log('ChatInputManager initialisé avec succès');
  }

  setupEventListeners() {
    // Événement principal pour le redimensionnement
    this.textarea.addEventListener('input', (e) => {
      this.handleInput(e);
    });

    // Événement pour les touches spéciales
    this.textarea.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // Événement pour la perte de focus (mobile)
    this.textarea.addEventListener('blur', () => {
      this.handleBlur();
    });

    // Événement pour le focus
    this.textarea.addEventListener('focus', () => {
      this.handleFocus();
    });

    // Redimensionnement initial
    this.resizeTextarea();
  }

  handleInput(event) {
    this.resizeTextarea();
    
    // Déclencher d'autres événements si nécessaire
    this.dispatchCustomEvent('chatInputChange', {
      value: this.textarea.value,
      height: this.textarea.style.height
    });
  }

  handleKeyDown(event) {
    console.log('Touche pressée:', event.key, 'shiftKey:', event.shiftKey);
    
    // Gérer Entrée pour envoyer (si pas Shift+Entrée)
    if (event.key === 'Enter' && !event.shiftKey) {
      console.log('Entrée détectée - tentative d\'envoi');
      event.preventDefault();
      this.sendMessage();
      return;
    }

    // Gérer Shift+Entrée pour nouvelle ligne
    if (event.key === 'Enter' && event.shiftKey) {
      console.log('Shift+Entrée détecté - nouvelle ligne');
      // Laisser le comportement par défaut, puis redimensionner
      setTimeout(() => this.resizeTextarea(), 0);
    }
  }

  handleBlur() {
    // Sur mobile, éviter le scroll automatique
    if (this.isMobile()) {
      window.scrollTo(0, 0);
    }
  }

  handleFocus() {
    // Assurer que l'input est visible
    if (this.isMobile()) {
      setTimeout(() => {
        this.textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  resizeTextarea() {
    if (!this.textarea || !this.inputBox) return;

    // Sauvegarder la position de scroll
    const scrollTop = this.textarea.scrollTop;
    
    // Reset height pour calculer la nouvelle hauteur
    this.textarea.style.height = 'auto';
    
    // Calculer la hauteur nécessaire
    const scrollHeight = this.textarea.scrollHeight;
    let newHeight;

    if (scrollHeight <= this.minHeight) {
      newHeight = this.minHeight;
      this.textarea.classList.remove('scrollable');
    } else if (scrollHeight >= this.maxHeight) {
      newHeight = this.maxHeight;
      this.textarea.classList.add('scrollable');
    } else {
      // Calculer la hauteur ligne par ligne pour un meilleur contrôle
      const lines = Math.ceil((scrollHeight - this.minHeight) / this.lineHeight) + 1;
      newHeight = this.minHeight + (lines - 1) * this.lineHeight;
      this.textarea.classList.remove('scrollable');
    }
    
    // Appliquer la nouvelle hauteur
    this.textarea.style.height = newHeight + 'px';
    
    // Ajuster la hauteur du conteneur
    this.adjustContainerHeight(newHeight);
    
    // Restaurer la position de scroll si nécessaire
    if (this.textarea.classList.contains('scrollable')) {
      this.textarea.scrollTop = scrollTop;
    }

    // Déclencher l'événement de redimensionnement
    this.dispatchCustomEvent('chatInputResize', {
      textareaHeight: newHeight,
      containerHeight: this.inputBox.style.height
    });
  }

  adjustContainerHeight(textareaHeight) {
    // Calculer la hauteur du conteneur (textarea + padding)
    const containerHeight = Math.max(textareaHeight + 20, 60);
    this.inputBox.style.height = containerHeight + 'px';
    
    // Calculer l'offset pour les autres éléments
    const heightDifference = containerHeight - 60; // 60 est la hauteur minimale
    document.documentElement.style.setProperty('--chat-height-offset', `${heightDifference}px`);
    
    // Ajuster la zone de messages
    this.adjustMessagesContainer(heightDifference);
  }

  adjustMessagesContainer(heightDifference) {
    if (!this.messagesContainer) return;

    if (heightDifference > 0) {
      this.messagesContainer.classList.add('expanded-input');
      this.messagesContainer.style.paddingBottom = `${120 + heightDifference}px`;
    } else {
      this.messagesContainer.classList.remove('expanded-input');
      this.messagesContainer.style.paddingBottom = '120px';
    }
  }

  resetHeight() {
    if (!this.textarea || !this.inputBox) return;

    this.textarea.style.height = this.minHeight + 'px';
    this.textarea.classList.remove('scrollable');
    this.inputBox.style.height = '60px';
    
    // Reset des variables CSS
    document.documentElement.style.setProperty('--chat-height-offset', '0px');
    
    // Reset du conteneur de messages
    if (this.messagesContainer) {
      this.messagesContainer.classList.remove('expanded-input');
      this.messagesContainer.style.paddingBottom = '120px';
    }

    this.dispatchCustomEvent('chatInputReset');
  }

  sendMessage() { 
    const message = this.textarea.value.trim(); 
    if (message.length === 0) return; 
 
    // Vérifier si handle_ask est disponible, sinon attendre 
    if (typeof window.handle_ask === 'function') { 
      window.handle_ask(); 
      this.resetHeight(); 
    } else { 
      // Attendre que handle_ask soit chargée avec retry intelligent 
      let attempts = 0; 
      const maxAttempts = 50; // 5 secondes maximum 
      
      const checkAndCall = () => { 
        attempts++; 
        if (typeof window.handle_ask === 'function') { 
          console.log(`handle_ask trouvée après ${attempts} tentatives`); 
          window.handle_ask(); 
          this.resetHeight(); 
        } else if (attempts < maxAttempts) { 
          setTimeout(checkAndCall, 100); 
        } else { 
          console.error('handle_ask non disponible après 5 secondes'); 
          // Fallback : déclencher l'événement click sur le bouton send 
          const sendButton = document.querySelector('#send-button'); 
          if (sendButton) { 
            sendButton.click(); 
            this.resetHeight(); 
          } 
        } 
      }; 
      checkAndCall(); 
    } 
  }

  setValue(value) {
    if (!this.textarea) return;
    
    this.textarea.value = value;
    this.resizeTextarea();
  }

  getValue() {
    return this.textarea ? this.textarea.value : '';
  }

  focus() {
    if (this.textarea) {
      this.textarea.focus();
    }
  }

  disable() {
    if (this.inputBox) {
      this.inputBox.classList.add('disabled');
    }
    if (this.textarea) {
      this.textarea.disabled = true;
    }
  }

  enable() {
    if (this.inputBox) {
      this.inputBox.classList.remove('disabled');
    }
    if (this.textarea) {
      this.textarea.disabled = false;
    }
  }

  isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    
    if (this.textarea) {
      this.textarea.dispatchEvent(event);
    } else {
      document.dispatchEvent(event);
    }
  }

  // Méthode publique pour forcer un redimensionnement
  forceResize() {
    this.resizeTextarea();
  }

  // Méthode pour obtenir les dimensions actuelles
  getDimensions() {
    if (!this.textarea || !this.inputBox) return null;

    return {
      textareaHeight: parseInt(this.textarea.style.height) || this.minHeight,
      containerHeight: parseInt(this.inputBox.style.height) || 60,
      isScrollable: this.textarea.classList.contains('scrollable'),
      heightOffset: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--chat-height-offset')) || 0
    };
  }
}

// Fonction globale pour maintenir la compatibilité avec l'ancien code
function resizeTextarea(textarea) {
  if (window.chatInputManager && window.chatInputManager.isInitialized) {
    window.chatInputManager.resizeTextarea();
  }
}

// Fonction globale pour réinitialiser la hauteur
function resetChatBarHeight() {
  if (window.chatInputManager && window.chatInputManager.isInitialized) {
    window.chatInputManager.resetHeight();
  }
}

// Initialiser le gestionnaire quand le script est chargé
if (typeof window !== 'undefined') {
  window.chatInputManager = new ChatInputManager();
  
  // Exposer les méthodes principales globalement pour compatibilité
  window.resizeTextarea = resizeTextarea;
  window.resetChatBarHeight = resetChatBarHeight;
}

// Export pour utilisation en module (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatInputManager;
}
