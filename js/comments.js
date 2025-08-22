// Comments System for Elazığ Çilingir Website
// Elazığ Çilingir Web Sitesi Yorum Sistemi

class CommentsSystem {
    constructor() {
        this.comments = [];
        this.currentPage = 1;
        this.commentsPerPage = 10;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadComments();
    }

    // Event listener'ları kur
    setupEventListeners() {
        // Yorum form submit
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('comment-form')) {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            }
        });

        // Sayfalama butonları
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadComments();
                }
            }
        });

        // Daha fazla yükle butonu
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('load-more-btn')) {
                e.preventDefault();
                this.loadMoreComments();
            }
        });
    }

    // Yorumları yükle
    async loadComments(append = false) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const { data: comments, error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .select(`
                    id,
                    username,
                    content,
                    created_at,
                    status,
                    users (
                        display_name
                    )
                `)
                .eq('status', window.COMMENT_STATUS.APPROVED)
                .order('created_at', { ascending: false })
                .range(
                    append ? this.comments.length : 0,
                    append ? this.comments.length + this.commentsPerPage - 1 : this.commentsPerPage - 1
                );

            if (error) throw error;

            if (append) {
                this.comments = [...this.comments, ...comments];
            } else {
                this.comments = comments;
            }

            this.renderComments();

        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Yorumlar yüklenirken bir hata oluştu.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // Daha fazla yorum yükle
    async loadMoreComments() {
        await this.loadComments(true);
    }

    // Yorum form işleme
    async handleCommentSubmit(form) {
        const user = window.authSystem.getCurrentUser();
        if (!user) {
            this.showError('Yorum yapmak için önce giriş yapmalısınız.');
            return;
        }

        const formData = new FormData(form);
        const content = formData.get('content').trim();

        if (!content || content.length < 10) {
            this.showError('Yorum en az 10 karakter olmalıdır.');
            return;
        }

        if (content.length > 1000) {
            this.showError('Yorum en fazla 1000 karakter olabilir.');
            return;
        }

        try {
            const { data: comment, error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .insert([{
                    user_id: user.id,
                    username: user.username,
                    content: content,
                    status: window.COMMENT_STATUS.PENDING,
                    page_url: window.location.href,
                    ip_address: await this.getClientIP(),
                    user_agent: navigator.userAgent
                }])
                .select()
                .single();

            if (error) throw error;

            // Formu temizle
            form.reset();
            
            this.showSuccess('Yorumunuz başarıyla gönderildi! Onaylandıktan sonra görünecektir.');

            // Yorumları yeniden yükle (onaylanmış yorumları görmek için)
            setTimeout(() => {
                this.loadComments();
            }, 1000);

        } catch (error) {
            console.error('Error submitting comment:', error);
            this.showError('Yorum gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    }

    // Yorumları render et
    renderComments() {
        const commentsContainer = document.getElementById('comments-container');
        if (!commentsContainer) return;

        if (this.comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="no-comments">
                    <p>Henüz onaylanmış yorum bulunmuyor. İlk yorumu siz yapın!</p>
                </div>
            `;
            return;
        }

        const commentsHTML = this.comments.map(comment => this.renderComment(comment)).join('');
        
        commentsContainer.innerHTML = `
            <div class="comments-list">
                ${commentsHTML}
            </div>
            ${this.renderLoadMoreButton()}
        `;
    }

    // Tek yorum render et
    renderComment(comment) {
        const displayName = comment.users?.display_name || comment.username;
        const createdAt = new Date(comment.created_at).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <span class="author-icon">👤</span>
                        <span class="author-name">${this.escapeHtml(displayName)}</span>
                    </div>
                    <div class="comment-date">${createdAt}</div>
                </div>
                <div class="comment-content">
                    <p>${this.escapeHtml(comment.content)}</p>
                </div>
            </div>
        `;
    }

    // Daha fazla yükle butonu
    renderLoadMoreButton() {
        // Basit kontrol: Eğer commentsPerPage kadar yorum varsa, daha fazla olabilir
        if (this.comments.length >= this.commentsPerPage && this.comments.length % this.commentsPerPage === 0) {
            return `
                <div class="load-more-container">
                    <button class="load-more-btn btn btn-secondary">Daha Fazla Yorum Yükle</button>
                </div>
            `;
        }
        return '';
    }

    // Loading göster
    showLoading() {
        const loadingElement = document.getElementById('comments-loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }

    // Loading gizle
    hideLoading() {
        const loadingElement = document.getElementById('comments-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // HTML escape
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Client IP al (opsiyonel)
    async getClientIP() {
        try {
            // Bu basit bir implementasyon, gerçek IP almak için dış servis gerekebilir
            return null;
        } catch (error) {
            return null;
        }
    }

    // Hata mesajı göster
    showError(message) {
        this.showMessage(message, 'error');
    }

    // Başarı mesajı göster
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // Mesaj göster
    showMessage(message, type) {
        // Mevcut mesajları temizle
        const existingMessages = document.querySelectorAll('.comment-message');
        existingMessages.forEach(msg => msg.remove());

        // Yeni mesaj oluştur
        const messageDiv = document.createElement('div');
        messageDiv.className = `comment-message comment-message-${type}`;
        messageDiv.textContent = message;

        // Mesajı göster
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
            commentsSection.insertBefore(messageDiv, commentsSection.firstChild);
        }

        // 5 saniye sonra mesajı kaldır
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Yorumları yeniden yükle
    async refreshComments() {
        this.currentPage = 1;
        this.comments = [];
        await this.loadComments();
    }

    // Yorum sayısını al
    async getCommentsCount() {
        try {
            const { count, error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .select('*', { count: 'exact', head: true })
                .eq('status', window.COMMENT_STATUS.APPROVED);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting comments count:', error);
            return 0;
        }
    }
}

// Global comments system instance oluştur
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabaseClient) {
        window.commentsSystem = new CommentsSystem();
        console.log('Comments system initialized');
    } else {
        console.error('Supabase client not found. Make sure to load supabase.js first.');
    }
});

// Export for other modules
window.CommentsSystem = CommentsSystem;
