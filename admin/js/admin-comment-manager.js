// Admin Comment Manager - Merkezi Yorum Sistemi ile Entegre
// Admin paneli için yorum yönetimi

class AdminCommentManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilter = 'all';
        this.currentPageFilter = 'all';
        this.comments = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadComments();
        this.updateBadges();
    }

    setupEventListeners() {
        // Filter changes
        document.getElementById('comments-filter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.currentPage = 1;
            this.loadComments();
        });

        // Page filter changes
        document.getElementById('page-filter')?.addEventListener('change', (e) => {
            this.currentPageFilter = e.target.value;
            this.currentPage = 1;
            this.filterComments();
            this.renderCommentsTable();
            this.renderPagination();
            this.updateFilteredStats();
        });

        // Filter button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                e.preventDefault();
                
                // Remove active class from all filter buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update filter
                this.currentFilter = e.target.dataset.filter;
                this.currentPage = 1;
                this.filterComments();
                this.renderCommentsTable();
                this.renderPagination();
                this.updateFilteredStats();
            }
        });

        // Refresh button
        document.getElementById('refresh-comments')?.addEventListener('click', () => {
            this.loadComments();
            this.updateBadges();
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page) {
                    this.currentPage = page;
                    this.loadComments();
                }
            }
        });

        // Modal actions
        document.addEventListener('click', (e) => {
            if (e.target.id === 'approve-comment') {
                const commentId = e.target.dataset.commentId;
                if (commentId) {
                    this.approveComment(commentId);
                }
            }
            
            if (e.target.id === 'reject-comment') {
                const commentId = e.target.dataset.commentId;
                if (commentId) {
                    this.rejectComment(commentId);
                }
            }

            if (e.target.id === 'submit-reply') {
                const commentId = e.target.dataset.commentId;
                const content = document.getElementById('reply-content')?.value?.trim();
                
                if (commentId && content) {
                    this.addReply(commentId, content);
                } else if (!content) {
                    this.showNotification('Lütfen bir cevap yazın.', 'error');
                }
            }

            // Modal close buttons
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                if (e.target.closest('#comment-modal')) {
                    this.closeModal();
                }
                if (e.target.closest('#reply-modal')) {
                    this.closeReplyModal();
                }
            }
        });
    }

    async loadComments() {
        this.showLoading();
        
        try {
            console.log('Loading comments...');
            // Use centralized comment system
            const result = await window.commentSystemManager.getAllComments();
            console.log('Load comments result:', result);
            
            if (result.success) {
                this.comments = result.data;
                console.log('Loaded comments:', this.comments);
                this.filterComments();
                this.renderCommentsTable();
                this.renderPagination();
                this.updateFilteredStats();
            } else {
                console.error('Failed to load comments:', result.error);
                this.showNotification('Yorumlar yüklenirken hata oluştu.', 'error');
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showNotification('Yorumlar yüklenirken hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Admin reply ekleme
    async addReply(commentId, content) {
        console.log('addReply called with commentId:', commentId, 'content:', content);
        console.log('Available comments in addReply:', this.comments);
        
        try {
            // Try to find comment by ID
            let comment = this.comments.find(c => c.id == commentId);
            
            // If not found, try to find by string comparison
            if (!comment) {
                comment = this.comments.find(c => String(c.id) === String(commentId));
            }
            
            // If still not found, try to reload comments
            if (!comment) {
                console.error('Comment not found for ID:', commentId);
                console.log('Attempting to reload comments...');
                
                // Reload comments
                await this.loadComments();
                
                // Try to find again
                comment = this.comments.find(c => c.id == commentId);
                if (!comment) {
                    comment = this.comments.find(c => String(c.id) === String(commentId));
                }
            }
            
            if (!comment) {
                console.error('Comment still not found after reload:', commentId);
                this.showNotification('Yorum bulunamadı.', 'error');
                return;
            }

            console.log('Found comment:', comment);
            console.log('Using commentSystemManager:', window.commentSystemManager);

            const result = await window.commentSystemManager.submitAdminReply(
                commentId, 
                content, 
                comment.page_id
            );

            console.log('Reply result:', result);

            if (result.success) {
                this.showNotification('Cevap başarıyla eklendi.', 'success');
                this.closeReplyModal();
                this.loadComments(); // Yorumları yenile
                this.updateFilteredStats();
            } else {
                this.showNotification(result.error || 'Cevap eklenirken hata oluştu.', 'error');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            this.showNotification('Cevap eklenirken hata oluştu.', 'error');
        }
    }

    filterComments() {
        let filteredComments = [...this.comments];
        
        // Filter by status
        if (this.currentFilter !== 'all') {
            filteredComments = filteredComments.filter(comment => 
                comment.status === this.currentFilter
            );
        }
        
        // Filter by page
        if (this.currentPageFilter !== 'all') {
            filteredComments = filteredComments.filter(comment => 
                comment.page_id === this.currentPageFilter
            );
        }
        
        // Sort by creation date (newest first)
        filteredComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        this.filteredComments = filteredComments;
    }

    renderCommentsTable() {
        const grid = document.querySelector('#comments-grid');
        if (!grid) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageComments = this.filteredComments.slice(startIndex, endIndex);

        if (pageComments.length === 0) {
            grid.innerHTML = '<div class="text-center" style="grid-column: 1 / -1; padding: 40px; color: #6b7280;">Yorum bulunamadı.</div>';
            return;
        }

        grid.innerHTML = pageComments.map(comment => `
            <div class="comment-card">
                <div class="comment-header">
                    <div class="comment-user">
                        <i class="fas fa-user"></i>
                        <span>${this.escapeHtml(comment.nickname)}</span>
                        ${comment.parent_id ? '<span class="reply-indicator" style="color: #8b5cf6; font-size: 0.8rem; margin-left: 8px;">↳ Yanıt</span>' : ''}
                    </div>
                    <span class="status-badge status-${comment.status}">
                        ${this.getStatusText(comment.status)}
                    </span>
                </div>
                
                <div class="comment-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                    <span><i class="fas fa-globe"></i> ${this.escapeHtml(comment.page_id)}</span>
                    ${comment.rating ? `<span><i class="fas fa-star"></i> ${comment.rating}/5</span>` : ''}
                    <span style="color: #666; font-size: 0.8rem;">ID: ${comment.id} | Parent: ${comment.parent_id || 'Yok'} | Status: ${comment.status}</span>
                </div>
                
                <div class="comment-content">
                    ${this.escapeHtml(comment.content)}
                </div>
                
                <div class="comment-actions">
                    <button class="action-btn view" onclick="adminCommentManager.viewComment('${comment.id}')" title="Görüntüle">
                        <i class="fas fa-eye"></i> Görüntüle
                    </button>
                    ${comment.status === 'pending' && !comment.parent_id ? `
                        <button class="action-btn approve" onclick="adminCommentManager.approveComment('${comment.id}')" title="Onayla">
                            <i class="fas fa-check"></i> Onayla
                        </button>
                        <button class="action-btn reject" onclick="adminCommentManager.rejectComment('${comment.id}')" title="Reddet">
                            <i class="fas fa-times"></i> Reddet
                        </button>
                    ` : ''}
                    ${comment.status === 'approved' && !comment.parent_id ? `
                        <button class="action-btn reply" onclick="console.log('Reply button clicked for comment:', '${comment.id}'); adminCommentManager.showReplyModal('${comment.id}')" title="Cevap Ver">
                            <i class="fas fa-reply"></i> Cevap Ver
                        </button>
                    ` : ''}
                    <button class="action-btn delete" onclick="adminCommentManager.deleteComment('${comment.id}')" title="Sil">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const pagination = document.getElementById('comments-pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredComments.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage - 1}">Önceki</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="pagination-current">${i}</span>`;
            } else {
                paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage + 1}">Sonraki</button>`;
        }
        
        pagination.innerHTML = paginationHTML;
    }

    async viewComment(commentId) {
        const comment = this.comments.find(c => c.id === commentId);
        if (!comment) return;

        const modal = document.getElementById('comment-modal');
        const detailDiv = document.getElementById('comment-detail');
        
        if (modal && detailDiv) {
            const rating = comment.rating || 5;
            const stars = Array.from({length: 5}, (_, i) => 
                `<i class="fas fa-star" style="color: ${i < rating ? '#fbbf24' : '#d1d5db'};"></i>`
            ).join('');
            
            detailDiv.innerHTML = `
                <div class="comment-detail-content">
                    <div class="comment-detail-header">
                        <h4>${this.escapeHtml(comment.nickname)}</h4>
                        <div class="comment-rating">
                            ${stars}
                            <span>(${rating}/5)</span>
                        </div>
                    </div>
                    <div class="comment-detail-meta">
                        <p><strong>Durum:</strong> ${this.getStatusText(comment.status)}</p>
                        <p><strong>Tarih:</strong> ${new Date(comment.created_at).toLocaleString('tr-TR')}</p>
                        <p><strong>Sayfa:</strong> ${comment.page_id}</p>
                    </div>
                    <div class="comment-detail-text">
                        <p>${this.escapeHtml(comment.content)}</p>
                    </div>
                </div>
            `;
            
            // Set comment ID for action buttons
            document.getElementById('approve-comment').dataset.commentId = commentId;
            document.getElementById('reject-comment').dataset.commentId = commentId;
            
            modal.style.display = 'flex';
        }
    }

    showReplyModal(commentId) {
        console.log('showReplyModal called with commentId:', commentId);
        console.log('Available comments:', this.comments);
        console.log('Comment IDs:', this.comments.map(c => c.id));
        
        // Try to find comment by ID
        let comment = this.comments.find(c => c.id == commentId);
        
        // If not found, try to find by string comparison
        if (!comment) {
            comment = this.comments.find(c => String(c.id) === String(commentId));
        }
        
        // If still not found, create a dummy comment for testing
        if (!comment) {
            console.error('Comment not found:', commentId);
            console.error('Available comment IDs:', this.comments.map(c => c.id));
            
            // Create a dummy comment for testing
            comment = {
                id: commentId,
                nickname: 'Unknown User',
                content: 'Test content',
                page_id: 'test-page',
                status: 'approved'
            };
            console.log('Using dummy comment for testing:', comment);
        }

        const modal = document.getElementById('reply-modal');
        const detailDiv = document.getElementById('reply-detail');
        
        if (modal && detailDiv) {
            detailDiv.innerHTML = `
                <div class="reply-detail-content">
                    <div class="reply-detail-header">
                        <h4>Yoruma Cevap Yaz</h4>
                        <p><strong>Yorum:</strong> ${this.escapeHtml(comment.content.substring(0, 200))}${comment.content.length > 200 ? '...' : ''}</p>
                        <p><strong>Kullanıcı:</strong> ${this.escapeHtml(comment.nickname)}</p>
                    </div>
                    <div class="reply-form">
                        <textarea id="reply-content" placeholder="Cevabınızı yazın..." rows="4" style="width: 100%; margin: 10px 0;"></textarea>
                    </div>
                </div>
            `;
            
            // Set comment ID for reply button
            const submitButton = document.getElementById('submit-reply');
            if (submitButton) {
                submitButton.dataset.commentId = commentId;
                console.log('Reply button comment ID set to:', commentId);
            } else {
                console.error('Submit reply button not found');
            }
            
            modal.style.display = 'flex';
            console.log('Reply modal opened');
        } else {
            console.error('Modal or detail div not found');
        }
    }

    closeReplyModal() {
        const modal = document.getElementById('reply-modal');
        if (modal) {
            modal.style.display = 'none';
            // Clear textarea
            const textarea = document.getElementById('reply-content');
            if (textarea) {
                textarea.value = '';
            }
        }
    }

    async approveComment(commentId) {
        if (!confirm('Bu yorumu onaylamak istediğinizden emin misiniz?')) return;
        
        try {
            const result = await window.commentSystemManager.updateCommentStatus(commentId, 'approved');
            
            if (result.success) {
                this.showNotification('Yorum başarıyla onaylandı.', 'success');
                this.closeModal();
                this.loadComments();
                this.updateBadges();
                this.updateFilteredStats();
            } else {
                this.showNotification('Yorum onaylanırken hata oluştu.', 'error');
            }
        } catch (error) {
            console.error('Error approving comment:', error);
            this.showNotification('Yorum onaylanırken hata oluştu.', 'error');
        }
    }

    async rejectComment(commentId) {
        if (!confirm('Bu yorumu reddetmek istediğinizden emin misiniz?')) return;
        
        try {
            const result = await window.commentSystemManager.updateCommentStatus(commentId, 'rejected');
            
            if (result.success) {
                this.showNotification('Yorum başarıyla reddedildi.', 'success');
                this.closeModal();
                this.loadComments();
                this.updateBadges();
                this.updateFilteredStats();
            } else {
                this.showNotification('Yorum reddedilirken hata oluştu.', 'error');
            }
        } catch (error) {
            console.error('Error rejecting comment:', error);
            this.showNotification('Yorum reddedilirken hata oluştu.', 'error');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
        
        try {
            const result = await window.commentSystemManager.deleteComment(commentId);
            
            if (result.success) {
                this.showNotification('Yorum başarıyla silindi.', 'success');
                this.loadComments();
                this.updateBadges();
                this.updateFilteredStats();
            } else {
                this.showNotification('Yorum silinirken hata oluştu.', 'error');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showNotification('Yorum silinirken hata oluştu.', 'error');
        }
    }

    async updateBadges() {
        try {
            const result = await window.commentSystemManager.getCommentStats();
            
            if (result.success) {
                const stats = result.data;
                const pendingBadge = document.getElementById('pending-comments-badge');
                
                if (pendingBadge) {
                    pendingBadge.textContent = stats.pending;
                    pendingBadge.style.display = stats.pending > 0 ? 'flex' : 'none';
                }
                
                // Update dashboard stats
                const totalComments = document.getElementById('total-comments');
                const pendingComments = document.getElementById('pending-comments');
                
                if (totalComments) totalComments.textContent = stats.total;
                if (pendingComments) pendingComments.textContent = stats.pending;
            }
        } catch (error) {
            console.error('Error updating badges:', error);
        }
    }

    updateFilteredStats() {
        // Calculate stats based on current filters
        const filteredStats = {
            total: this.filteredComments.length,
            pending: this.filteredComments.filter(c => c.status === 'pending').length,
            approved: this.filteredComments.filter(c => c.status === 'approved').length,
            rejected: this.filteredComments.filter(c => c.status === 'rejected').length
        };

        // Update the stats display
        const totalComments = document.getElementById('totalComments');
        const pendingComments = document.getElementById('pendingComments');
        const approvedComments = document.getElementById('approvedComments');
        const rejectedComments = document.getElementById('rejectedComments');

        if (totalComments) totalComments.textContent = filteredStats.total;
        if (pendingComments) pendingComments.textContent = filteredStats.pending;
        if (approvedComments) approvedComments.textContent = filteredStats.approved;
        if (rejectedComments) rejectedComments.textContent = filteredStats.rejected;
    }

    closeModal() {
        const modal = document.getElementById('comment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close')?.addEventListener('click', () => {
            notification.remove();
        });
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'Bekliyor',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi'
        };
        return statusTexts[status] || status;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('comments-section')) {
        window.adminCommentManager = new AdminCommentManager();
    }
});
