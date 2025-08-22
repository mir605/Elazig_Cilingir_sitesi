// Simple Comments System (LocalStorage based - no backend needed)
// Geçici çözüm: Supabase kurulumu yapılana kadar

class SimpleCommentsSystem {
    constructor() {
        this.comments = this.loadComments();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderComments();
        this.setupCharCounter();
    }

    // Event listener'ları kur
    setupEventListeners() {
        const form = document.getElementById('simple-comment-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            });
        }
    }

    // Karakter sayacını kur
    setupCharCounter() {
        const textarea = document.getElementById('comment-text');
        const counter = document.getElementById('char-count');
        
        if (textarea && counter) {
            textarea.addEventListener('input', () => {
                const length = textarea.value.length;
                counter.textContent = length;
                
                // Renk değişimi
                if (length > 450) {
                    counter.style.color = '#dc2626';
                } else if (length > 400) {
                    counter.style.color = '#ea580c';
                } else {
                    counter.style.color = '#64748b';
                }
            });
        }
    }

    // Yorum gönderme
    handleCommentSubmit(form) {
        const formData = new FormData(form);
        const name = formData.get('name').trim();
        const rating = formData.get('rating');
        const comment = formData.get('comment').trim();

        // Validasyon
        if (!name || name.length < 2) {
            this.showMessage('Lütfen geçerli bir ad girin.', 'error');
            return;
        }

        if (!comment || comment.length < 20) {
            this.showMessage('Yorum en az 20 karakter olmalıdır.', 'error');
            return;
        }

        // Yeni yorum oluştur
        const newComment = {
            id: Date.now().toString(),
            name: name,
            rating: parseInt(rating),
            comment: comment,
            date: new Date().toISOString(),
            status: 'pending' // Admin onayı bekliyor
        };

        // LocalStorage'a kaydet
        this.comments.unshift(newComment);
        this.saveComments();

        // Formu temizle
        form.reset();
        document.getElementById('char-count').textContent = '0';

        // Başarı mesajı
        this.showMessage('✅ Yorumunuz gönderildi! Admin onayından sonra yayınlanacaktır.', 'success');

        // Yorumları yeniden render et
        this.renderComments();
    }

    // Yorumları render et
    renderComments() {
        const container = document.getElementById('comments-container');
        if (!container) return;

        // Sadece onaylanmış yorumları göster
        const approvedComments = this.comments.filter(c => c.status === 'approved');

        if (approvedComments.length === 0) {
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

        const commentsHTML = approvedComments.map(comment => this.renderComment(comment)).join('');
        
        container.innerHTML = `
            <div class="comments-list-modern">
                <div class="comments-header">
                    <h3>💬 Müşteri Deneyimleri</h3>
                    <p>${approvedComments.length} müşterimizin görüşü</p>
                </div>
                ${commentsHTML}
            </div>
        `;
    }

    // Tek yorum render et
    renderComment(comment) {
        const stars = '⭐'.repeat(comment.rating);
        const date = new Date(comment.date).toLocaleDateString('tr-TR', {
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
                    <p>"${this.escapeHtml(comment.comment)}"</p>
                </div>
            </div>
        `;
    }

    // HTML escape
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Mesaj göster
    showMessage(message, type) {
        // Eski mesajları kaldır
        const existingMessages = document.querySelectorAll('.comment-notification');
        existingMessages.forEach(msg => msg.remove());

        // Yeni mesaj oluştur
        const notification = document.createElement('div');
        notification.className = `comment-notification comment-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Form'un üstüne ekle
        const form = document.getElementById('simple-comment-form');
        if (form) {
            form.parentNode.insertBefore(notification, form);
        }

        // 5 saniye sonra otomatik kaldır
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // LocalStorage'dan yorumları yükle
    loadComments() {
        try {
            const saved = localStorage.getItem('elazigcilingir_comments');
            return saved ? JSON.parse(saved) : this.getDefaultComments();
        } catch (error) {
            console.error('Error loading comments:', error);
            return this.getDefaultComments();
        }
    }

    // Yorumları LocalStorage'a kaydet
    saveComments() {
        try {
            localStorage.setItem('elazigcilingir_comments', JSON.stringify(this.comments));
        } catch (error) {
            console.error('Error saving comments:', error);
        }
    }

    // Varsayılan yorumlar (gerçek yorumlar için Supabase kullanın)
    getDefaultComments() {
        return []; // Mock yorumlar kaldırıldı
    }

    // Admin için tüm yorumları al
    getAllComments() {
        return this.comments;
    }

    // Admin: yorum onayla
    approveComment(id) {
        const comment = this.comments.find(c => c.id === id);
        if (comment) {
            comment.status = 'approved';
            this.saveComments();
            this.renderComments();
            return true;
        }
        return false;
    }

    // Admin: yorum reddet
    rejectComment(id) {
        const comment = this.comments.find(c => c.id === id);
        if (comment) {
            comment.status = 'rejected';
            this.saveComments();
            this.renderComments();
            return true;
        }
        return false;
    }

    // Admin: yorum sil
    deleteComment(id) {
        this.comments = this.comments.filter(c => c.id !== id);
        this.saveComments();
        this.renderComments();
    }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    window.simpleCommentsSystem = new SimpleCommentsSystem();
    console.log('Simple Comments System initialized');
});

// Export for admin panel
window.SimpleCommentsSystem = SimpleCommentsSystem;
