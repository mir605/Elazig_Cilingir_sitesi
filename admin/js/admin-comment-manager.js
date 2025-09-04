// Admin Comment Manager - Merkezi Yorum Sistemi ile Entegre
// Admin paneli için yorum yönetimi

class AdminCommentManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 50; // Varsayılan olarak 50 yorum göster
        this.currentFilter = 'all';
        this.currentPageFilter = 'all';
        this.comments = [];
        this.filteredComments = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadComments();
        this.updateBadges();
        
        // HTML'den seçili items per page değerini al
        const itemsPerPageSelect = document.getElementById('items-per-page');
        if (itemsPerPageSelect) {
            const selectedValue = itemsPerPageSelect.value;
            this.itemsPerPage = selectedValue === 'all' ? Infinity : parseInt(selectedValue);
            console.log('Initial itemsPerPage set to:', this.itemsPerPage);
        }
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

        // Items per page changes
        document.getElementById('items-per-page')?.addEventListener('change', (e) => {
            this.itemsPerPage = e.target.value === 'all' ? Infinity : parseInt(e.target.value);
            this.currentPage = 1;
            this.filterComments();
            this.renderCommentsTable();
            this.renderPagination();
            this.updateFilteredStats();
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && !isNaN(page)) {
                    this.currentPage = page;
                    this.filterComments();
                    this.renderCommentsTable();
                    this.renderPagination();
                    this.updateFilteredStats();
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
            
            // Check if this is edit mode or add mode
            const submitButton = document.getElementById('submit-reply');
            const mode = submitButton?.dataset?.mode || 'add';
            
            if (mode === 'edit') {
                // Update existing reply
                const replyId = submitButton.dataset.replyId;
                if (replyId) {
                    const result = await window.commentSystemManager.updateAdminReply(replyId, content);
                    if (result.success) {
                        this.showNotification('Yanıt başarıyla güncellendi.', 'success');
                        this.closeReplyModal();
                        this.loadComments();
                        this.updateFilteredStats();
                    } else {
                        this.showNotification(result.error || 'Yanıt güncellenirken hata oluştu.', 'error');
                    }
                }
            } else {
                // Submit new admin reply
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
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            this.showNotification('Cevap eklenirken hata oluştu.', 'error');
        }
    }

    filterComments() {
        console.log('filterComments called with:', {
            currentFilter: this.currentFilter,
            currentPageFilter: this.currentPageFilter,
            totalComments: this.comments?.length || 0
        });
        
        if (!this.comments || this.comments.length === 0) {
            console.log('No comments to filter');
            this.filteredComments = [];
            return;
        }
        
        let filteredComments = [...this.comments];
        
        // Filter by status
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'unanswered') {
                // Cevaplanmamış yorumlar: onaylanmış ama yanıtlanmamış ana yorumlar
                filteredComments = filteredComments.filter(comment => {
                    if (comment.status !== 'approved' || comment.parent_id || comment.nickname === 'Murat Oto Anahtar') {
                        return false;
                    }
                    
                    // Bu yoruma admin yanıtı var mı kontrol et - sadece parent_id ile eşleşen yanıtları kabul et
                    const hasAdminReply = this.comments.some(reply => 
                        reply.parent_id === comment.id && reply.nickname === 'Murat Oto Anahtar'
                    );
                    
                    return !hasAdminReply;
                });
                console.log(`Unanswered filter: Found ${filteredComments.length} unanswered comments`);
            } else if (this.currentFilter === 'answered') {
                // Cevaplanan yorumlar: onaylanmış ve yanıtlanmış ana yorumlar
                filteredComments = filteredComments.filter(comment => {
                    if (comment.status !== 'approved' || comment.parent_id || comment.nickname === 'Murat Oto Anahtar') {
                        return false;
                    }
                    
                    // Bu yoruma admin yanıtı var mı kontrol et - sadece parent_id ile eşleşen yanıtları kabul et
                    const hasAdminReply = this.comments.some(reply => 
                        reply.parent_id === comment.id && reply.nickname === 'Murat Oto Anahtar'
                    );
                    
                    return hasAdminReply;
                });
                console.log(`Answered filter: Found ${filteredComments.length} answered comments`);
            } else {
                filteredComments = filteredComments.filter(comment => 
                    comment.status === this.currentFilter
                );
            }
            console.log(`After status filter (${this.currentFilter}):`, filteredComments.length);
        }
        
        // Filter by page
        if (this.currentPageFilter !== 'all') {
            filteredComments = filteredComments.filter(comment => 
                comment.page_id === this.currentPageFilter
            );
            console.log(`After page filter (${this.currentPageFilter}):`, filteredComments.length);
        }
        
        // Sort by creation date (newest first) and group replies with their parent comments
        filteredComments.sort((a, b) => {
            // Ana yorumlar ve yanıtları ayrı ayrı sırala
            const aIsReply = a.parent_id || a.nickname === 'Murat Oto Anahtar';
            const bIsReply = b.parent_id || b.nickname === 'Murat Oto Anahtar';
            
            if (aIsReply && !bIsReply) return 1; // Yanıtlar ana yorumlardan sonra
            if (!aIsReply && bIsReply) return -1; // Ana yorumlar önce
            
            // Ana yorumlar arasında tarihe göre sırala (en yeni önce)
            if (!aIsReply && !bIsReply) {
                return new Date(b.created_at) - new Date(a.created_at);
            }
            
            // Yanıtlar arasında tarihe göre sırala (en yeni önce)
            if (aIsReply && bIsReply) {
                return new Date(b.created_at) - new Date(a.created_at);
            }
            
            return 0;
        });
        
        this.filteredComments = filteredComments;
        
        console.log('Filtered comments result:', {
            total: this.comments.length,
            filtered: filteredComments.length,
            mainComments: filteredComments.filter(c => !c.parent_id && c.nickname !== 'Murat Oto Anahtar').length,
            adminReplies: filteredComments.filter(c => c.nickname === 'Murat Oto Anahtar').length,
            otherReplies: filteredComments.filter(c => c.parent_id && c.nickname !== 'Murat Oto Anahtar').length,
            unanswered: this.currentFilter === 'unanswered' ? filteredComments.length : 'N/A',
            answered: this.currentFilter === 'answered' ? filteredComments.length : 'N/A',
            statusCounts: {
                pending: filteredComments.filter(c => c.status === 'pending').length,
                approved: filteredComments.filter(c => c.status === 'approved').length,
                rejected: filteredComments.filter(c => c.status === 'rejected').length
            }
        });
    }

    renderCommentsTable() {
        console.log('renderCommentsTable called:', {
            totalComments: this.comments?.length || 0,
            filteredComments: this.filteredComments?.length || 0,
            currentPage: this.currentPage,
            itemsPerPage: this.itemsPerPage,
            totalPages: this.itemsPerPage === Infinity ? 1 : Math.ceil((this.filteredComments?.length || 0) / this.itemsPerPage)
        });
        
        const grid = document.querySelector('#comments-grid');
        if (!grid) return;

        if (!this.filteredComments || this.filteredComments.length === 0) {
            grid.innerHTML = '<div class="text-center" style="grid-column: 1 / -1; padding: 40px; color: #6b7280;">Yorum bulunamadı.</div>';
            return;
        }

        // Sayfa başına yorum sayısı kontrolü
        let pageComments;
        if (this.itemsPerPage === Infinity) {
            // Tüm yorumları göster
            pageComments = this.filteredComments;
        } else {
            // Sayfalama yap
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            pageComments = this.filteredComments.slice(startIndex, endIndex);
            
            console.log('Pagination details:', {
                startIndex,
                endIndex,
                itemsPerPage: this.itemsPerPage,
                currentPage: this.currentPage,
                totalFiltered: this.filteredComments.length,
                pageCommentsCount: pageComments.length
            });
        }

        if (pageComments.length === 0) {
            grid.innerHTML = '<div class="text-center" style="grid-column: 1 / -1; padding: 40px; color: #6b7280;">Yorum bulunamadı.</div>';
            return;
        }

        // Ana yorumları ve yanıtları ayır
        const mainComments = pageComments.filter(comment => 
            !comment.parent_id && comment.nickname !== 'Murat Oto Anahtar'
        );
        // Yanıtları tüm yorumlardan bul (sayfa yorumlarından değil)
        const replies = this.comments.filter(comment => 
            comment.parent_id || comment.nickname === 'Murat Oto Anahtar'
        );

        console.log('Comment grouping:', {
            totalPageComments: pageComments.length,
            mainComments: mainComments.length,
            replies: replies.length,
            mainCommentIds: mainComments.map(c => c.id),
            replyIds: replies.map(r => r.id)
        });

        // Kullanılan yanıtları takip et
        const usedReplies = new Set();

        let html = '';
        
                 // Ana yorumları render et
         mainComments.forEach(mainComment => {
             // Bu ana yoruma ait yanıtları bul
             let commentReplies = replies.filter(reply => 
                 reply.parent_id === mainComment.id && reply.nickname === 'Murat Oto Anahtar'
             );
             
             html += `
                 <div class="comment-group">
                     <div class="comment-card">
                         <div class="comment-header">
                             <div class="comment-user">
                                 <i class="fas fa-user"></i>
                                 <span>${this.escapeHtml(mainComment.nickname)}</span>
                             </div>
                             <span class="status-badge status-${mainComment.status}">
                                 ${this.getStatusText(mainComment.status)}
                             </span>
                         </div>
                         
                         <div class="comment-meta">
                             <span><i class="fas fa-calendar"></i> ${new Date(mainComment.created_at).toLocaleDateString('tr-TR')}</span>
                             <span><i class="fas fa-globe"></i> ${this.escapeHtml(mainComment.page_id)}</span>
                             ${mainComment.rating ? `<span><i class="fas fa-star"></i> ${mainComment.rating}/5</span>` : ''}
                             <span style="color: #666; font-size: 0.8rem;">ID: ${mainComment.id} | Parent: ${mainComment.parent_id || 'Yok'} | Status: ${mainComment.status}</span>
                         </div>
                         
                         <div class="comment-content">
                             ${this.escapeHtml(mainComment.content)}
                         </div>
                         
                         <div class="comment-actions">
                             <button class="action-btn view" onclick="adminCommentManager.viewComment('${mainComment.id}')" title="Görüntüle">
                                 <i class="fas fa-eye"></i> Görüntüle
                             </button>
                             ${mainComment.status === 'pending' ? `
                                 <button class="action-btn approve" onclick="adminCommentManager.approveComment('${mainComment.id}')" title="Onayla">
                                     <i class="fas fa-check"></i> Onayla
                                 </button>
                                 <button class="action-btn reject" onclick="adminCommentManager.rejectComment('${mainComment.id}')" title="Reddet">
                                     <i class="fas fa-times"></i> Reddet
                                 </button>
                             ` : ''}
                             ${mainComment.status === 'approved' ? `
                                 ${commentReplies.length > 0 ? `
                                     <button class="action-btn edit-reply" onclick="adminCommentManager.editReply('${mainComment.id}')" title="Yanıtı Düzenle">
                                         <i class="fas fa-edit"></i> Yanıtı Düzenle
                                     </button>
                                 ` : `
                                     <button class="action-btn reply" onclick="adminCommentManager.showReplyModal('${mainComment.id}')" title="Cevap Ver">
                                         <i class="fas fa-reply"></i> Cevap Ver
                                     </button>
                                 `}
                             ` : ''}
                             <button class="action-btn delete" onclick="adminCommentManager.deleteComment('${mainComment.id}')" title="Sil">
                                 <i class="fas fa-trash"></i> Sil
                             </button>
                         </div>
                     </div>
             `;
            
                         // Bu ana yoruma ait yanıtları bul ve ekle
             // commentReplies zaten yukarıda tanımlandı
            
            // Parent_id ile eşleşen yanıtları kullanıldı olarak işaretle
            commentReplies.forEach(reply => usedReplies.add(reply.id));
            
            
            
            if (commentReplies.length > 0) {
                commentReplies.forEach(reply => {
                    html += `
                        <div class="comment-card reply-card">
                            <div class="comment-header">
                                <div class="comment-user">
                                    <i class="fas fa-reply" style="color: #8b5cf6;"></i>
                                    <span>${this.escapeHtml(reply.nickname)}</span>
                                    <span class="admin-badge">Admin</span>
                                </div>
                                <span class="status-badge status-${reply.status}">
                                    ${this.getStatusText(reply.status)}
                                </span>
                            </div>
                            
                            <div class="comment-meta">
                                <span><i class="fas fa-calendar"></i> ${new Date(reply.created_at).toLocaleDateString('tr-TR')}</span>
                                <span style="color: #666; font-size: 0.8rem;">Yanıt ID: ${reply.id} | Parent: ${reply.parent_id || 'Otomatik Eşleştirildi'}</span>
                            </div>
                            
                            <div class="comment-content">
                                ${this.escapeHtml(reply.content)}
                            </div>
                            
                            <div class="comment-actions">
                                <button class="action-btn view" onclick="adminCommentManager.viewComment('${reply.id}')" title="Görüntüle">
                                    <i class="fas fa-eye"></i> Görüntüle
                                </button>
                                <button class="action-btn delete" onclick="adminCommentManager.deleteComment('${reply.id}')" title="Sil">
                                    <i class="fas fa-trash"></i> Sil
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
            
            html += '</div>'; // comment-group kapat
        });
        
        grid.innerHTML = html;
    }

    renderPagination() {
        const pagination = document.getElementById('comments-pagination');
        if (!pagination) return;

        // Eğer tüm yorumlar gösteriliyorsa sayfalama gerekmez
        if (this.itemsPerPage === Infinity) {
            pagination.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(this.filteredComments.length / this.itemsPerPage);
        
        // Sayfalama her zaman gösterilsin (test için)
        if (totalPages <= 1) {
            pagination.innerHTML = '<span class="pagination-info">Tüm yorumlar tek sayfada gösteriliyor</span>';
            return;
        }

        let paginationHTML = '';
        
        // Pagination info
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredComments.length);
        paginationHTML += `<span class="pagination-info">${startItem}-${endItem} / ${this.filteredComments.length} yorum</span>`;
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage - 1}">Önceki</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" disabled>Önceki</button>`;
        }
        
        // Page numbers (smart display - max 7 visible)
        const maxVisiblePages = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-info">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="pagination-current">${i}</span>`;
            } else {
                paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            }
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-info">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage + 1}">Sonraki</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" disabled>Sonraki</button>`;
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

    showEditReplyModal(commentId, replyId, replyContent) {
        console.log('showEditReplyModal called with commentId:', commentId, 'replyId:', replyId);
        
        const modal = document.getElementById('reply-modal');
        const detailDiv = document.getElementById('reply-detail');
        const submitButton = document.getElementById('submit-reply');
        
        if (modal && detailDiv && submitButton) {
            // Set data attributes for editing mode
            submitButton.dataset.commentId = commentId;
            submitButton.dataset.replyId = replyId;
            submitButton.dataset.mode = 'edit'; // Düzenleme modu
            submitButton.innerHTML = '<i class="fas fa-edit"></i> Yanıtı Güncelle';
            
            detailDiv.innerHTML = `
                <div class="reply-detail-content">
                    <div class="reply-detail-header">
                        <h4>Admin Yanıtını Düzenle</h4>
                        <p><strong>Mevcut Yanıt:</strong></p>
                    </div>
                    <div class="reply-form">
                        <textarea id="reply-content" placeholder="Yanıtınızı yazın..." required>${this.escapeHtml(replyContent)}</textarea>
                    </div>
                </div>
            `;
            
            modal.style.display = 'flex';
        }
    }

         editReply(commentId) {
         console.log('editReply called with commentId:', commentId);
         
         // Bu yoruma ait admin yanıtını bul - sadece parent_id ile eşleşen yanıtları kabul et
         const adminReply = this.comments.find(reply => 
             reply.parent_id === commentId && reply.nickname === 'Murat Oto Anahtar'
         );
         
         console.log('Looking for admin reply to comment:', commentId);
         console.log('Available replies:', this.comments.filter(r => r.parent_id || r.nickname === 'Murat Oto Anahtar'));
         console.log('Found admin reply:', adminReply);
         
         if (adminReply) {
             this.showEditReplyModal(commentId, adminReply.id, adminReply.content);
         } else {
             this.showNotification('Bu yoruma ait admin yanıtı bulunamadı.', 'error');
         }
     }

    showReplyModal(commentId) {
        console.log('showReplyModal called with commentId:', commentId);
        
        // Try to find comment by ID
        let comment = this.comments.find(c => c.id == commentId);
        
        // If not found, try to find by string comparison
        if (!comment) {
            comment = this.comments.find(c => String(c.id) === String(commentId));
        }
        
        if (!comment) {
            console.error('Comment not found:', commentId);
            this.showNotification('Yorum bulunamadı.', 'error');
            return;
        }

        const modal = document.getElementById('reply-modal');
        const detailDiv = document.getElementById('reply-detail');
        const submitButton = document.getElementById('submit-reply');
        
        if (modal && detailDiv && submitButton) {
            // Set comment ID for the reply button
            submitButton.dataset.commentId = comment.id;
            submitButton.dataset.mode = 'add'; // Yeni yanıt ekleme modu
            
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
        const submitButton = document.getElementById('submit-reply');
        
        if (modal) {
            modal.style.display = 'none';
            // Clear textarea
            const textarea = document.getElementById('reply-content');
            if (textarea) {
                textarea.value = '';
            }
        }
        
        // Reset submit button state
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-reply"></i> Cevap Gönder';
            submitButton.dataset.mode = 'add';
            delete submitButton.dataset.replyId;
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
