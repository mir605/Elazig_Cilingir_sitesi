// Supabase Comments System
// Real-time comment system with Supabase backend

class SupabaseCommentsSystem {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }

    async init() {
        if (!this.supabase) {
            console.error('Supabase client not initialized');
            return;
        }
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.setupEventListeners();
            this.setupCharCounter();
        }, 100);
        
        await this.loadComments();
        console.log('Supabase Comments System initialized');
    }

    setupEventListeners() {
        const form = document.getElementById('simple-comment-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            });
        }
    }

    setupCharCounter() {
        // Try both homepage and blog comment textareas
        const textareas = [
            { textarea: document.getElementById('comment-text'), counter: document.getElementById('char-count') },
            { textarea: document.getElementById('comment-content'), counter: document.getElementById('comment-char-count') }
        ];
        
        textareas.forEach(({ textarea, counter }) => {
            if (textarea && counter) {
                console.log('Setting up char counter for:', textarea.id);
                
                // Set initial count
                const initialLength = textarea.value.length;
                counter.textContent = initialLength;
                
                textarea.addEventListener('input', () => {
                    const length = textarea.value.length;
                    counter.textContent = length;
                    
                    if (length > 450) {
                        counter.style.color = '#dc2626';
                    } else if (length > 400) {
                        counter.style.color = '#ea580c';
                    } else {
                        counter.style.color = '#64748b';
                    }
                });
                
                // Also trigger on keyup for better responsiveness
                textarea.addEventListener('keyup', () => {
                    const length = textarea.value.length;
                    counter.textContent = length;
                });
            }
        });
    }

    async handleCommentSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Gönderiliyor...</span><span class="btn-icon">⏳</span>';

        try {
            const formData = new FormData(form);
            const name = formData.get('name').trim();
            const rating = parseInt(formData.get('rating'));
            const comment = formData.get('comment').trim();

            // Validation
            if (!name || name.length < 2) {
                throw new Error('Lütfen geçerli bir ad girin.');
            }

            if (!comment || comment.length < 20) {
                throw new Error('Yorum en az 20 karakter olmalıdır.');
            }

            // Create user if not exists
            const user = await this.createOrGetUser(name);
            
            // Insert comment
            const { data, error } = await this.supabase
                .from('comments')
                .insert({
                    user_id: user.id,
                    name: name,
                    rating: rating,
                    content: comment,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Success
            form.reset();
            document.getElementById('char-count').textContent = '0';
            this.showMessage('✅ Yorumunuz gönderildi! Admin onayından sonra yayınlanacaktır.', 'success');
            
            // Reload comments
            await this.loadComments();

        } catch (error) {
            console.error('Comment submission error:', error);
            this.showMessage(`❌ Hata: ${error.message}`, 'error');
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async createOrGetUser(name) {
        // Check if user exists
        const { data: existingUser } = await this.supabase
            .from('users')
            .select('*')
            .eq('display_name', name)
            .single();

        if (existingUser) {
            return existingUser;
        }

        // Create new user
        const username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
        
        const { data, error } = await this.supabase
            .from('users')
            .insert({
                username: username,
                display_name: name
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async loadComments() {
        const container = document.getElementById('comments-container');
        if (!container) return;

        try {
            // Show loading
            container.innerHTML = `
                <div class="loading-comments">
                    <div class="loading-spinner"></div>
                    <p>Yorumlar yükleniyor...</p>
                </div>
            `;

            // Fetch approved comments
            const { data: comments, error } = await this.supabase
                .from('comments')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderComments(comments || []);

        } catch (error) {
            console.error('Error loading comments:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>❌ Yorumlar yüklenirken hata oluştu. Lütfen sayfayı yenileyin.</p>
                </div>
            `;
        }
    }

    renderComments(comments) {
        const container = document.getElementById('comments-container');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="no-comments">
                    <div class="no-comments-card">
                        <div class="no-comments-icon">💬</div>
                        <h3>Henüz yorum yok</h3>
                        <p>İlk yorumu yapan siz olun!</p>
                    </div>
                </div>
            `;
            return;
        }

        const commentsHTML = comments.map(comment => this.renderComment(comment)).join('');
        
        container.innerHTML = `
            <div class="comments-list-modern">
                <div class="comments-header">
                    <h3>💬 Müşteri Deneyimleri</h3>
                    <p>${comments.length} müşterimizin görüşü</p>
                </div>
                ${commentsHTML}
            </div>
        `;
    }

    renderComment(comment) {
        const stars = '⭐'.repeat(comment.rating);
        const date = new Date(comment.created_at).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="modern-comment-card">
                <div class="comment-header-modern">
                    <div class="comment-author-info">
                        <div class="author-avatar">
                            ${comment.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="author-details">
                            <h4>${this.escapeHtml(comment.name)}</h4>
                            <div class="comment-rating">${stars}</div>
                        </div>
                    </div>
                    <div class="comment-date-modern">${date}</div>
                </div>
                <div class="comment-text-modern">
                    <p>"${this.escapeHtml(comment.content)}"</p>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.comment-notification');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const notification = document.createElement('div');
        notification.className = `comment-notification comment-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Insert before form
        const form = document.getElementById('simple-comment-form');
        if (form) {
            form.parentNode.insertBefore(notification, form);
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Admin methods
    async getAllComments() {
        const { data, error } = await this.supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async approveComment(id) {
        const { error } = await this.supabase
            .from('comments')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) throw error;
        await this.loadComments(); // Refresh comments
        return true;
    }

    async rejectComment(id) {
        const { error } = await this.supabase
            .from('comments')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    async deleteComment(id) {
        const { error } = await this.supabase
            .from('comments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await this.loadComments(); // Refresh comments
        return true;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase client to be ready
    if (window.supabaseClient) {
        window.supabaseCommentsSystem = new SupabaseCommentsSystem();
    } else {
        // Fallback to simple comments if Supabase not available
        console.warn('Supabase not available, using fallback system');
        if (window.SimpleCommentsSystem) {
            window.simpleCommentsSystem = new SimpleCommentsSystem();
        }
    }
});

// Export for admin panel
window.SupabaseCommentsSystem = SupabaseCommentsSystem;
