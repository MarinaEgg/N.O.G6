// État de l'onboarding
let currentStep = 1;
const totalSteps = 3;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeOnboarding();
    
    // S'assurer que les éléments de la page principale sont masqués
    hideMainPageElements();
});

// Fonction d'initialisation
function initializeOnboarding() {
    // Afficher la première étape
    showStep(1);
    
    // Événements pour les indicateurs de points
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToStep(index + 1);
        });
    });
    
    // Événements pour les touches clavier
    document.addEventListener('keydown', handleKeyPress);
    
    console.log('Onboarding initialisé');
}

// Masquer tous les éléments de la page principale
function hideMainPageElements() {
    const elementsToHide = [
        '.conversations',
        '#conversations',
        '.sidebar-toggle',
        '.user-input-container',
        '.sidenav',
        '#librarySideNav',
        '#LinksSideNav',
        '.chat-main-container',
        '.gradient'
    ];
    
    elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
            }
        });
    });
}

// Navigation entre les étapes
function nextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
        currentStep = step;
        showStep(currentStep);
    }
}

// Afficher une étape spécifique
function showStep(step) {
    // Masquer toutes les étapes
    document.querySelectorAll('.step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Afficher l'étape courante
    const currentStepEl = document.querySelector(`.step[data-step="${step}"]`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }
    
    // Mettre à jour les indicateurs de points
    document.querySelectorAll('.dot').forEach((dot, index) => {
        if (index + 1 === step) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    // Mettre à jour les boutons de navigation
    updateNavigationButtons();
    
    console.log(`Étape ${step} affichée`);
}

// Mettre à jour l'état des boutons de navigation
function updateNavigationButtons() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentStep === 1;
    }
    
    if (nextBtn) {
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
            nextBtn.disabled = false;
        }
    }
}

// Gestion des touches clavier
function handleKeyPress(event) {
    switch (event.key) {
        case 'ArrowRight':
        case ' ':
            event.preventDefault();
            nextStep();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            prevStep();
            break;
        case 'Escape':
            event.preventDefault();
            closeOnboarding();
            break;
        case 'Enter':
            if (currentStep === totalSteps) {
                event.preventDefault();
                startChat();
            }
            break;
    }
}

// Actions des boutons CTA
function startChat() {
    console.log('Démarrage du chat');
    
    // Sauvegarder que l'onboarding a été complété
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Rediriger vers la page principale
    window.location.href = '/';
}

function skipOnboarding() {
    console.log('Onboarding ignoré');
    
    // Sauvegarder que l'onboarding a été ignoré
    localStorage.setItem('onboardingCompleted', 'skipped');
    
    // Rediriger vers la page principale
    window.location.href = '/';
}

function closeOnboarding() {
    console.log('Fermeture de l\'onboarding');
    
    // Option 1: Rediriger vers la page principale
    window.location.href = '/';
    
    // Option 2: Si c'est une modal/overlay, masquer l'onboarding
    // const onboardingContainer = document.querySelector('.onboarding-container');
    // if (onboardingContainer) {
    //     onboardingContainer.style.display = 'none';
    // }
}

// Utilitaires pour la persistance de données
function saveOnboardingProgress() {
    const progress = {
        currentStep: currentStep,
        timestamp: Date.now()
    };
    localStorage.setItem('onboardingProgress', JSON.stringify(progress));
}

function loadOnboardingProgress() {
    const savedProgress = localStorage.getItem('onboardingProgress');
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            // Reprendre à l'étape sauvegardée si récente (moins de 24h)
            if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
                goToStep(progress.currentStep);
                return true;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la progression:', error);
        }
    }
    return false;
}

// Vérifier si l'onboarding a déjà été complété
function isOnboardingCompleted() {
    const completed = localStorage.getItem('onboardingCompleted');
    return completed === 'true' || completed === 'skipped';
}

// Analytics/tracking (optionnel)
function trackOnboardingStep(step) {
    console.log(`Tracking: Étape ${step} vue`);
    // Ici tu peux ajouter des appels à tes outils d'analytics
    // Par exemple: gtag('event', 'onboarding_step', { step: step });
}

function trackOnboardingCompletion(method) {
    console.log(`Tracking: Onboarding complété via ${method}`);
    // Exemple: gtag('event', 'onboarding_complete', { method: method });
}

// Vérification de compatibilité
function checkBrowserCompatibility() {
    const isCompatible = 'localStorage' in window && 
                        'addEventListener' in document &&
                        'querySelector' in document;
    
    if (!isCompatible) {
        console.warn('Navigateur non compatible détecté');
        // Afficher un message de fallback ou rediriger
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; font-family: sans-serif;">
                <h2>Navigateur non supporté</h2>
                <p>Veuillez utiliser un navigateur plus récent pour accéder à nOg.</p>
                <a href="/" style="color: #667eea; text-decoration: none;">Continuer vers l'application</a>
            </div>
        `;
        return false;
    }
    
    return true;
}

// Auto-exécution des vérifications
if (!checkBrowserCompatibility()) {
    console.error('Navigateur non compatible');
}

// Nettoyer les événements lors de la fermeture
window.addEventListener('beforeunload', function() {
    saveOnboardingProgress();
    document.removeEventListener('keydown', handleKeyPress);
});
