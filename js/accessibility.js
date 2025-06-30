/**
 * Accessibility Enhancement JavaScript
 * Manages accessibility features, form validation, and user preferences
 */

class AccessibilityManager {
    constructor() {
        this.panel = null;
        this.toggle = null;
        this.isInitialized = false;
        
        // Bind methods to maintain context
        this.handleToggleClick = this.handleToggleClick.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            this.setupAccessibilityPanel();
            this.setupThemeToggle();
            this.setupFormValidation();
            this.setupKeyboardNavigation();
            this.setupReducedMotion();
            this.loadUserPreferences();
            this.isInitialized = true;
            console.log('Accessibility Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing Accessibility Manager:', error);
        }
    }

    setupAccessibilityPanel() {
        this.panel = document.getElementById('accessibilityPanel');
        this.toggle = document.getElementById('accessibilityToggle');

        if (!this.panel || !this.toggle) {
            console.warn('Accessibility panel elements not found');
            return;
        }

        // Add click event listener to toggle button
        this.toggle.addEventListener('click', this.handleToggleClick);

        // Add document click listener for closing panel when clicking outside
        document.addEventListener('click', this.handleDocumentClick);

        // Add keyboard event listener for accessibility
        document.addEventListener('keydown', this.handleKeydown);

        // Set up tabindex management for panel content
        this.setupPanelTabbing();

        // Setup preference controls
        this.setupPreferenceControls();
    }

    setupPanelTabbing() {
        const panelElements = this.panel.querySelectorAll('input, select, button:not(.accessibility-toggle)');
        
        // Initially make panel content non-focusable
        panelElements.forEach(element => {
            element.setAttribute('tabindex', '-1');
        });

        // When panel opens, make content focusable
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
                    const isHidden = this.panel.getAttribute('aria-hidden') === 'true';
                    panelElements.forEach(element => {
                        element.setAttribute('tabindex', isHidden ? '-1' : '0');
                    });
                }
            });
        });

        observer.observe(this.panel, { attributes: true });
    }

    handleToggleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const isOpen = this.panel.classList.contains('open');
        
        if (isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    handleDocumentClick(event) {
        // Close panel if clicking outside of it
        if (this.panel && 
            this.panel.classList.contains('open') && 
            !this.panel.contains(event.target)) {
            this.closePanel();
        }
    }

    handleKeydown(event) {
        // Close panel on Escape key
        if (event.key === 'Escape' && this.panel && this.panel.classList.contains('open')) {
            this.closePanel();
            this.toggle.focus();
        }

        // Add keyboard navigation indicator
        if (event.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    }

    openPanel() {
        if (!this.panel || !this.toggle) return;
        
        this.panel.classList.add('open');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.panel.setAttribute('aria-hidden', 'false');
        
        // Focus the first focusable element in the panel
        const firstFocusable = this.panel.querySelector('input, select, button, textarea, [tabindex]');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
        
        this.announceToScreenReader('Accessibility panel opened');
    }

    closePanel() {
        if (!this.panel || !this.toggle) return;
        
        this.panel.classList.remove('open');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.panel.setAttribute('aria-hidden', 'true');
        
        this.announceToScreenReader('Accessibility panel closed');
    }

    setupPreferenceControls() {
        // Text size control
        const textSizeSelect = document.getElementById('textSize');
        if (textSizeSelect) {
            textSizeSelect.addEventListener('change', (e) => {
                this.setTextSize(e.target.value);
            });
        }

        // High contrast toggle
        const highContrastCheckbox = document.getElementById('highContrast');
        if (highContrastCheckbox) {
            highContrastCheckbox.addEventListener('change', (e) => {
                this.setHighContrast(e.target.checked);
            });
        }

        // Reduced motion toggle
        const reducedMotionCheckbox = document.getElementById('reducedMotion');
        if (reducedMotionCheckbox) {
            reducedMotionCheckbox.addEventListener('change', (e) => {
                this.setReducedMotion(e.target.checked);
            });
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isPressed = themeToggle.getAttribute('aria-pressed') === 'true';
                const newTheme = isPressed ? 'light' : 'dark';
                
                this.setTheme(newTheme);
                themeToggle.setAttribute('aria-pressed', !isPressed);
            });
        }

        // Also handle the original footer theme toggle for backward compatibility
        const footerThemeToggle = document.getElementById('toggleTheme');
        if (footerThemeToggle) {
            footerThemeToggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                this.setTheme(newTheme);
                
                // Sync with accessibility panel toggle
                if (themeToggle) {
                    themeToggle.setAttribute('aria-pressed', e.target.checked);
                }
            });
        }
    }

    setupFormValidation() {
        const form = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');

        if (!form || !submitBtn) return;

        // Initially disable the submit button
        this.updateSubmitButtonState();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateAndSubmitForm(form, submitBtn);
        });

        // Real-time validation for required fields
        const requiredFields = ['name', 'email', 'message'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                    this.updateSubmitButtonState();
                });
            }
        });
    }

    updateSubmitButtonState() {
        const submitBtn = document.getElementById('submitBtn');
        const requiredFields = ['name', 'email', 'message'];
        
        if (!submitBtn) return;

        let allFieldsValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const value = field.value.trim();
                if (!value || value.length < (fieldId === 'message' ? 10 : 2)) {
                    allFieldsValid = false;
                }
                
                // Also check for valid email format
                if (fieldId === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    allFieldsValid = false;
                }
            }
        });

        submitBtn.disabled = !allFieldsValid;
        
        if (allFieldsValid) {
            submitBtn.setAttribute('aria-describedby', 'submitReady');
            if (!document.getElementById('submitReady')) {
                const description = document.createElement('span');
                description.id = 'submitReady';
                description.className = 'sr-only';
                description.textContent = 'Form is ready to submit';
                submitBtn.parentNode.appendChild(description);
            }
        } else {
            submitBtn.removeAttribute('aria-describedby');
            const description = document.getElementById('submitReady');
            if (description) {
                description.remove();
            }
        }
    }

    setupKeyboardNavigation() {
        // Remove keyboard navigation indicator on mouse use
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Enhanced skip link functionality
        document.querySelectorAll('.skip-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const target = document.querySelector(targetId);
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    setupReducedMotion() {
        // Check for user's motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            const reducedMotionCheckbox = document.getElementById('reducedMotion');
            if (reducedMotionCheckbox) {
                reducedMotionCheckbox.checked = true;
            }
            this.setReducedMotion(true);
        }

        // Listen for changes in motion preference
        prefersReducedMotion.addEventListener('change', (e) => {
            const reducedMotionCheckbox = document.getElementById('reducedMotion');
            if (reducedMotionCheckbox) {
                reducedMotionCheckbox.checked = e.matches;
            }
            this.setReducedMotion(e.matches);
        });
    }

    setTextSize(size) {
        document.documentElement.classList.remove('text-large', 'text-extra-large');
        if (size !== 'normal') {
            document.documentElement.classList.add(`text-${size}`);
        }
        localStorage.setItem('textSize', size);
        this.announceToScreenReader(`Text size changed to ${size}`);
    }

    setHighContrast(enabled) {
        document.documentElement.classList.toggle('high-contrast', enabled);
        localStorage.setItem('highContrast', enabled);
        this.announceToScreenReader(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    setReducedMotion(enabled) {
        document.documentElement.classList.toggle('reduce-motion', enabled);
        localStorage.setItem('reducedMotion', enabled);
        this.announceToScreenReader(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.announceToScreenReader(`Switched to ${theme} theme`);
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'name':
                if (!value) {
                    errorMessage = 'Name is required';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Name must be at least 2 characters long';
                    isValid = false;
                }
                break;
            case 'email':
                if (!value) {
                    errorMessage = 'Email is required';
                    isValid = false;
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;
            case 'message':
                if (!value) {
                    errorMessage = 'Message is required';
                    isValid = false;
                } else if (value.length < 10) {
                    errorMessage = 'Message must be at least 10 characters long';
                    isValid = false;
                }
                break;
        }

        this.displayFieldError(field, errorMessage);
        
        // Update submit button state after validation
        setTimeout(() => this.updateSubmitButtonState(), 0);
        
        return isValid;
    }

    displayFieldError(field, message) {
        const errorElement = document.getElementById(`${field.name}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.toggle('visible', !!message);
        }
        field.setAttribute('aria-invalid', !!message);
    }

    clearFieldError(field) {
        const errorElement = document.getElementById(`${field.name}Error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('visible');
        }
        field.setAttribute('aria-invalid', 'false');
    }

    async validateAndSubmitForm(form, submitBtn) {
        const requiredFields = ['name', 'email', 'message'];
        let isFormValid = true;

        // Validate all required fields
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field && !this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.announceToScreenReader('Please correct the errors in the form');
            // Focus the first field with an error
            const firstErrorField = form.querySelector('[aria-invalid="true"]');
            if (firstErrorField) {
                firstErrorField.focus();
            }
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';

        try {
            // Simulate form submission (replace with actual submission logic)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.announceToScreenReader('Message sent successfully');
            form.reset();
            
            // Clear any existing error states
            requiredFields.forEach(fieldName => {
                const field = document.getElementById(fieldName);
                if (field) {
                    this.clearFieldError(field);
                }
            });
            
            // Show success message
            this.showSuccessMessage(form, 'Thank you for your message. We will get back to you soon!');
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.announceToScreenReader('Error sending message. Please try again.');
            this.showErrorMessage(form, 'There was an error sending your message. Please try again.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    showSuccessMessage(form, message) {
        // Remove any existing messages
        const existingMessage = form.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = message;
        successMessage.setAttribute('role', 'alert');
        successMessage.setAttribute('aria-live', 'polite');
        
        form.appendChild(successMessage);
        successMessage.focus();
        
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.remove();
            }
        }, 8000);
    }

    showErrorMessage(form, message) {
        // Remove any existing messages
        const existingMessage = form.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        errorMessage.setAttribute('role', 'alert');
        errorMessage.setAttribute('aria-live', 'assertive');
        errorMessage.style.cssText = `
            background: #fef2f2;
            border: 1px solid #dc2626;
            color: #dc2626;
            padding: var(--space-4);
            border-radius: var(--radius-md);
            margin-top: var(--space-4);
            font-size: var(--font-size-sm);
        `;
        
        form.appendChild(errorMessage);
        errorMessage.focus();
        
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.remove();
            }
        }, 8000);
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.remove();
            }
        }, 1000);
    }

    loadUserPreferences() {
        try {
            // Detect system theme preference
            const systemTheme = this.detectSystemTheme();
            
            // Load saved preferences from localStorage or use system/defaults
            const savedTheme = localStorage.getItem('theme') || systemTheme;
            const savedTextSize = localStorage.getItem('textSize') || 'normal';
            const savedHighContrast = localStorage.getItem('highContrast') === 'true';
            const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';

            // Apply preferences
            this.setTheme(savedTheme);
            this.setTextSize(savedTextSize);
            this.setHighContrast(savedHighContrast);
            this.setReducedMotion(savedReducedMotion);

            // Update form controls to reflect saved preferences
            this.updateThemeControls(savedTheme);

            const textSizeSelect = document.getElementById('textSize');
            if (textSizeSelect) {
                textSizeSelect.value = savedTextSize;
            }

            const highContrastToggle = document.getElementById('highContrast');
            if (highContrastToggle) {
                highContrastToggle.setAttribute('aria-pressed', savedHighContrast);
            }

            const reducedMotionToggle = document.getElementById('reducedMotion');
            if (reducedMotionToggle) {
                reducedMotionToggle.setAttribute('aria-pressed', savedReducedMotion);
            }

        } catch (error) {
            console.warn('Error loading user preferences:', error);
            // Fallback to defaults if there's an error
            this.setTheme('dark');
            this.updateThemeControls('dark');
        }
    }

    // Public method to check if the manager is initialized
    isReady() {
        return this.isInitialized;
    }
}

// Initialize the accessibility manager
let accessibilityManager;

// Ensure proper initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        accessibilityManager = new AccessibilityManager();
    });
} else {
    accessibilityManager = new AccessibilityManager();
}

// Make the manager available globally for debugging
window.accessibilityManager = accessibilityManager;

// Service Worker registration for progressive enhancement (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}