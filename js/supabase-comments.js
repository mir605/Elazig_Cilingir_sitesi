// Supabase-based Universal Comment System
(function() {
    'use strict';

    class SupabaseCommentSystem {
        constructor(containerId, pageId, options = {}) {
            this.containerId = containerId;
            this.pageId = pageId;
            this.options = {
                maxLength: 1000,
                minLength: 10,
                ...options
            };
            
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error(`Comment container with ID "${containerId}" not found`);
                return;
            }
            
            this.init();
        }
        
        init() {
            this.render();
            this.loadComments();
            this.bindEvents();
        }
        
        render() {
            this.container.innerHTML = `
                <div class="comments-section">
                    <h3 class="comments-title">
                        <i class="fas fa-comments"></i>
                        Müşteri Yorumları
                    </h3>
                    
                    <!-- Comment Form -->
                    <div class="comment-form-card">
                        <h3>✍️ Deneyiminizi Paylaşın</h3>
                        <p>MURAT OTO ANAHTAR hizmetlerimiz hakkındaki görüşlerinizi bizimle paylaşın</p>
                        
                        <form id="commentForm_${this.containerId}" class="simple-comment-form">
                            <div class="form-row">
                                <div class="form-col">
                                    <input 
                                        type="text" 
                                        id="nickname_${this.containerId}" 
                                        name="nickname" 
                                        maxlength="50" 
                                        required
                                        placeholder="Adınız (örn: Ahmet K.)"
                                    >
                                </div>
                                <div class="form-col">
                                    <select 
                                        id="rating_${this.containerId}" 
                                        name="rating"
                                    >
                                        <option value="5">⭐⭐⭐⭐⭐ Çok Faydalı</option>
                                        <option value="4">⭐⭐⭐⭐ Faydalı</option>
                                        <option value="3">⭐⭐⭐ Orta</option>
                                        <option value="2">⭐⭐ Az Faydalı</option>
                                        <option value="1">⭐ Faydasız</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="comment-textarea-wrapper">
                                <textarea 
                                    id="commentContent_${this.containerId}" 
                                    name="content" 
                                    maxlength="${this.options.maxLength}" 
                                    required
                                    placeholder="Yorumunuzu yazın... (en az ${this.options.minLength} karakter)"
                                    rows="4"
                                ></textarea>
                                <div class="char-counter">
                                    <span id="charCount_${this.containerId}">0</span> / ${this.options.maxLength}
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-modern">
                                <span class="btn-text">Yorum Gönder</span>
                                <span class="btn-icon">📝</span>
                            </button>
                        </form>
                    </div>
                    
                    <!-- Comments List -->
                    <div class="comments-list-container">
                        <div id="commentsList_${this.containerId}" class="comments-list">
                            <div class="loading-comments">
                                <i class="fas fa-spinner fa-spin"></i>
                                Yorumlar yükleniyor...
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        bindEvents() {
            const form = document.getElementById(`commentForm_${this.containerId}`);
            const contentTextarea = document.getElementById(`commentContent_${this.containerId}`);
            const charCount = document.getElementById(`charCount_${this.containerId}`);
            const ratingSelect = document.getElementById(`rating_${this.containerId}`);
            
            if (form) {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }
            
            if (contentTextarea && charCount) {
                // Set initial count
                charCount.textContent = contentTextarea.value.length;
                
                contentTextarea.addEventListener('input', (e) => {
                    const length = e.target.value.length;
                    charCount.textContent = length;
                    
                    // Update character counter styling
                    const counter = document.getElementById(`charCount_${this.containerId}`);
                    if (length < this.options.minLength) {
                        counter.className = 'char-counter error';
                    } else if (length > this.options.maxLength * 0.9) {
                        counter.className = 'char-counter warning';
                    } else {
                        counter.className = 'char-counter success';
                    }
                });
            }
            
            // Handle rating selection - simple dropdown
            if (ratingSelect) {
                // Set default value
                ratingSelect.value = '5';
            }
        }
        

        
        async handleSubmit(e) {
            e.preventDefault();
            
            const form = e.target;
            const formData = new FormData(form);
            const nickname = formData.get('nickname').trim();
            const content = formData.get('content').trim();
            const rating = formData.get('rating') || '5';
            
            // Debug: Log rating value
            console.log('Selected rating:', rating);
            
            // Validation
            if (nickname.length < 2) {
                this.showMessage('Kullanıcı adı en az 2 karakter olmalıdır', 'error');
                return;
            }
            
            if (content.length < this.options.minLength) {
                this.showMessage(`Yorum en az ${this.options.minLength} karakter olmalıdır`, 'error');
                return;
            }
            
            if (content.length > this.options.maxLength) {
                this.showMessage(`Yorum en fazla ${this.options.maxLength} karakter olabilir`, 'error');
                return;
            }
            
            // Disable form
            const submitBtn = form.querySelector('.btn-modern');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="btn-text">Gönderiliyor...</span><span class="btn-icon">⏳</span>';
            submitBtn.disabled = true;
            
            try {
                // Use Supabase CommentSystem with rating
                const result = await window.CommentSystem.submitComment(this.pageId, nickname, content, rating);
                
                if (result.success) {
                    this.showMessage('Yorum başarıyla gönderildi ve onay bekliyor', 'success');
                    form.reset();
                    // Reset character counter
                    const charCount = document.getElementById(`charCount_${this.containerId}`);
                    if (charCount) {
                        charCount.textContent = '0';
                        charCount.className = 'char-counter error';
                    }
                    // Reset rating select
                    const ratingSelect = document.getElementById(`rating_${this.containerId}`);
                    if (ratingSelect) {
                        ratingSelect.value = '5';
                    }
                    this.loadComments(); // Refresh comments
                } else {
                    this.showMessage(result.error || 'Yorum gönderilirken hata oluştu', 'error');
                }
                
            } catch (error) {
                console.error('Comment submission error:', error);
                this.showMessage('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
            } finally {
                // Re-enable form
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
        
        async loadComments() {
            const commentsList = document.getElementById(`commentsList_${this.containerId}`);
            if (!commentsList) return;
            
            try {
                // Use Supabase CommentSystem
                const result = await window.CommentSystem.getComments(this.pageId);
                
                if (result.success) {
                    this.renderComments(result.data);
                } else {
                    commentsList.innerHTML = `
                        <div class="no-comments">
                            <i class="fas fa-exclamation-triangle"></i>
                            Yorumlar yüklenirken hata oluştu
                        </div>
                    `;
                }
                
            } catch (error) {
                console.error('Comments loading error:', error);
                commentsList.innerHTML = `
                    <div class="no-comments">
                        <i class="fas fa-exclamation-triangle"></i>
                        Yorumlar yüklenemedi
                    </div>
                `;
            }
        }
        
        renderComments(comments) {
            const commentsList = document.getElementById(`commentsList_${this.containerId}`);
            if (!commentsList) return;
            
            if (comments.length === 0) {
                commentsList.innerHTML = `
                    <div class="no-comments">
                        <i class="fas fa-comment-slash"></i>
                        Henüz yorum yapılmamış. İlk yorumu siz yapın!
                    </div>
                `;
                return;
            }
            
            const commentsHTML = comments.map(comment => {
                const rating = comment.rating || 5;
                const ratingTexts = {
                    5: 'Çok Faydalı',
                    4: 'Faydalı',
                    3: 'Orta',
                    2: 'Az Faydalı',
                    1: 'Faydasız'
                };
                
                const stars = Array.from({length: 5}, (_, i) => 
                    `<i class="fas fa-star" style="color: ${i < rating ? '#fbbf24' : '#d1d5db'};"></i>`
                ).join('');
                
                return `
                    <div class="comment-item" data-id="${comment.id}">
                        <div class="comment-header">
                            <div class="comment-author">
                                <i class="fas fa-user"></i>
                                <span class="nickname">${this.escapeHtml(comment.nickname)}</span>
                            </div>
                            <div class="comment-meta">
                                <div class="comment-rating">
                                    <div class="rating-stars" style="display: inline-flex; gap: 0.125rem; margin-right: 0.5rem;">
                                        ${stars}
                                    </div>
                                    <span style="font-size: 0.85rem; color: #666;">${ratingTexts[rating]}</span>
                                </div>
                                <div class="comment-date">
                                    <i class="fas fa-clock"></i>
                                    ${this.formatDate(comment.created_at)}
                                </div>
                            </div>
                        </div>
                        <div class="comment-content">
                            ${this.escapeHtml(comment.content)}
                        </div>
                    </div>
                `;
            }).join('');
            
            commentsList.innerHTML = commentsHTML;
        }
        
        showMessage(message, type = 'info') {
            // Remove existing messages
            const existingMessages = document.querySelectorAll('.comment-message');
            existingMessages.forEach(msg => msg.remove());
            
            // Create new message
            const messageDiv = document.createElement('div');
            messageDiv.className = `comment-message comment-message-${type}`;
            messageDiv.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${message}
            `;
            
            // Insert after form
            const form = document.getElementById(`commentForm_${this.containerId}`);
            if (form && form.parentNode) {
                form.parentNode.insertBefore(messageDiv, form.nextSibling);
            }
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffInHours = (now - date) / (1000 * 60 * 60);
            
            if (diffInHours < 1) {
                return 'Az önce';
            } else if (diffInHours < 24) {
                const hours = Math.floor(diffInHours);
                return `${hours} saat önce`;
            } else if (diffInHours < 168) { // 7 days
                const days = Math.floor(diffInHours / 24);
                return `${days} gün önce`;
            } else {
                return date.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
    }
    
    // Global function to initialize comment system
    window.initSupabaseCommentSystem = function(containerId, pageId, options = {}) {
        return new SupabaseCommentSystem(containerId, pageId, options);
    };
    
    // Auto-initialize if data attributes are present
    document.addEventListener('DOMContentLoaded', function() {
        const commentContainers = document.querySelectorAll('[data-supabase-comment-system]');
        commentContainers.forEach(container => {
            const pageId = container.dataset.pageId || window.location.pathname;
            const options = {};
            
            new SupabaseCommentSystem(container.id, pageId, options);
        });
    });
    
})();
