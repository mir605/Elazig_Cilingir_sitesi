// Comment System Configuration
// Merkezi yorum sistemi yapılandırması

window.COMMENT_SYSTEM_CONFIG = {
    // Supabase Configuration
    supabase: {
        url: 'https://zgpxnpkkfbsdnkitjhlb.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncHhucGtrZmJzZG5raXRqaGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODkyMTMsImV4cCI6MjA3MTQ2NTIxM30.Tu-Xe0plnNvsz5QF7ZWTjf07p9ZXvsu9yo50iMyXBoo'
    },

    // Comment Settings
    comments: {
        maxLength: 1000,
        minLength: 10,
        autoApprove: false,
        enableRating: true,
        enableModeration: true,
        maxCommentsPerPage: 50
    },

    // UI Settings
    ui: {
        theme: 'default',
        language: 'tr',
        showCharacterCount: true,
        showRating: true,
        enableRichText: false,
        enableAttachments: false
    },

    // Admin Settings
    admin: {
        itemsPerPage: 10,
        enableBulkActions: true,
        enableExport: true,
        enableNotifications: true
    },

    // Security Settings
    security: {
        enableCaptcha: false,
        enableRateLimit: true,
        maxCommentsPerHour: 5,
        enableSpamProtection: true,
        blockedWords: [
            'spam',
            'reklam',
            'kumar',
            'bahis'
        ]
    },

    // Notification Settings
    notifications: {
        emailOnNewComment: true,
        emailOnApproval: false,
        enableInAppNotifications: true
    }
};

// Configuration helper functions
window.COMMENT_SYSTEM_CONFIG_HELPERS = {
    // Get configuration value with fallback
    get: (path, defaultValue = null) => {
        const keys = path.split('.');
        let value = window.COMMENT_SYSTEM_CONFIG;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    },

    // Update configuration
    update: (path, newValue) => {
        const keys = path.split('.');
        let current = window.COMMENT_SYSTEM_CONFIG;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = newValue;
    },

    // Validate comment content
    validateComment: (content, nickname) => {
        const errors = [];
        
        if (!nickname || nickname.trim().length < 2) {
            errors.push('Kullanıcı adı en az 2 karakter olmalıdır');
        }
        
        if (!content || content.trim().length < window.COMMENT_SYSTEM_CONFIG.comments.minLength) {
            errors.push(`Yorum en az ${window.COMMENT_SYSTEM_CONFIG.comments.minLength} karakter olmalıdır`);
        }
        
        if (content && content.trim().length > window.COMMENT_SYSTEM_CONFIG.comments.maxLength) {
            errors.push(`Yorum en fazla ${window.COMMENT_SYSTEM_CONFIG.comments.maxLength} karakter olabilir`);
        }
        
        // Check for blocked words
        const blockedWords = window.COMMENT_SYSTEM_CONFIG.security.blockedWords;
        const contentLower = content.toLowerCase();
        const foundBlockedWords = blockedWords.filter(word => 
            contentLower.includes(word.toLowerCase())
        );
        
        if (foundBlockedWords.length > 0) {
            errors.push('Yorumunuzda uygun olmayan kelimeler bulunmaktadır');
        }
        
        return errors;
    },

    // Check rate limit
    checkRateLimit: () => {
        const lastCommentTime = localStorage.getItem('lastCommentTime');
        const now = Date.now();
        
        if (lastCommentTime) {
            const timeDiff = now - parseInt(lastCommentTime);
            const hourInMs = 60 * 60 * 1000;
            
            if (timeDiff < hourInMs) {
                return false; // Rate limit exceeded
            }
        }
        
        localStorage.setItem('lastCommentTime', now.toString());
        return true;
    },

    // Format date
    formatDate: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Az önce';
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} saat önce`;
        } else if (diffInHours < 168) {
            const days = Math.floor(diffInHours / 24);
            return `${days} gün önce`;
        } else {
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },

    // Escape HTML
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
