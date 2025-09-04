// Centralized Comment System Manager
// Tüm yorum sistemi işlemlerini tek yerden yönetir

class CommentSystemManager {
    constructor() {
        this.config = {
            supabaseUrl: window.COMMENT_SYSTEM_CONFIG?.supabase?.url || 'https://zgpxnpkkfbsdnkitjhlb.supabase.co',
            supabaseKey: window.COMMENT_SYSTEM_CONFIG?.supabase?.key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncHhucGtrZmJzZG5raXRqaGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODkyMTMsImV4cCI6MjA3MTQ2NTIxM30.Tu-Xe0plnNvsz5QF7ZWTjf07p9ZXvsu9yo50iMyXBoo',
            maxLength: window.COMMENT_SYSTEM_CONFIG?.comments?.maxLength || 1000,
            minLength: window.COMMENT_SYSTEM_CONFIG?.comments?.minLength || 10,
            autoApprove: window.COMMENT_SYSTEM_CONFIG?.comments?.autoApprove || false,
            enableRating: window.COMMENT_SYSTEM_CONFIG?.comments?.enableRating || true,
            enableModeration: window.COMMENT_SYSTEM_CONFIG?.comments?.enableModeration || true
        };
        
        this.supabase = null;
        this.instances = new Map();
        this.init();
    }

    async init() {
        await this.initSupabase();
        this.setupGlobalFunctions();
        this.autoInitialize();
    }

    async initSupabase() {
        try {
            if (typeof window !== 'undefined' && window.supabase) {
                this.supabase = window.supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                });
                console.log('Comment System Manager: Supabase initialized successfully');
                console.log('Supabase URL:', this.config.supabaseUrl);
                console.log('Supabase Key (first 20 chars):', this.config.supabaseKey.substring(0, 20) + '...');
            } else {
                console.error('Comment System Manager: Supabase not available');
                console.error('window.supabase:', typeof window.supabase);
            }
        } catch (error) {
            console.error('Comment System Manager: Error initializing Supabase:', error);
        }
    }

    setupGlobalFunctions() {
        // Global functions for backward compatibility
        window.CommentSystem = {
            submitComment: (pageId, nickname, content, rating) => 
                this.submitComment(pageId, nickname, content, rating),
            submitAdminReply: (parentId, content, pageId) => 
                this.submitAdminReply(parentId, content, pageId),
            updateAdminReply: (replyId, content) => 
                this.updateAdminReply(replyId, content),
            getComments: (pageId) => this.getComments(pageId),
            getAllComments: () => this.getAllComments(),
            updateCommentStatus: (commentId, status) => this.updateCommentStatus(commentId, status),
            deleteComment: (commentId) => this.deleteComment(commentId),
            getCommentStats: () => this.getCommentStats(),
            debugDatabaseState: () => this.debugDatabaseState()
        };

        // Global initialization function
        window.initSupabaseCommentSystem = (containerId, pageId, options = {}) => {
            return this.createInstance(containerId, pageId, options);
        };
    }

    autoInitialize() {
        document.addEventListener('DOMContentLoaded', () => {
            const containers = document.querySelectorAll('[data-supabase-comment-system]');
            containers.forEach(container => {
                const pageId = container.dataset.pageId;
                if (!pageId) {
                    console.error('Comment container missing data-page-id attribute:', container);
                    return;
                }
                const options = {};
                this.createInstance(container.id, pageId, options);
            });
        });
    }

    createInstance(containerId, pageId, options = {}) {
        if (this.instances.has(containerId)) {
            return this.instances.get(containerId);
        }

        const instance = new CommentInstance(containerId, pageId, {
            ...this.config,
            ...options
        }, this);
        
        this.instances.set(containerId, instance);
        return instance;
    }

    // API Methods
    async submitComment(pageId, nickname, content, rating = 5) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            console.log('Submitting comment for page_id:', pageId);

            const commentData = {
                page_id: pageId,
                nickname: nickname.trim(),
                content: content.trim(),
                rating: parseInt(rating) || 5,
                status: this.config.autoApprove ? 'approved' : 'pending'
            };

            const { data, error } = await this.supabase
                .from('comments')
                .insert(commentData)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Comment submission error:', error);
            return { 
                success: false, 
                error: error.message || 'Unknown error occurred' 
            };
        }
    }

    // Admin reply ekleme
    async submitAdminReply(parentId, content, pageId) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const replyData = {
                page_id: pageId,
                nickname: 'Murat Oto Anahtar',
                content: content.trim(),
                rating: 5,
                status: 'approved',
                parent_id: parentId
            };

            const { data, error } = await this.supabase
                .from('comments')
                .insert(replyData)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Admin reply submission error:', error);
            return { 
                success: false, 
                error: error.message || 'Unknown error occurred' 
            };
        }
    }

    // Admin reply güncelleme
    async updateAdminReply(replyId, content) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('comments')
                .update({ 
                    content: content.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', replyId)
                .eq('nickname', 'Murat Oto Anahtar') // Sadece admin yanıtlarını güncelleyebilir
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Admin reply update error:', error);
            return { 
                success: false, 
                error: error.message || 'Unknown error occurred' 
            };
        }
    }

    async getComments(pageId) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            console.log('Fetching comments for page_id:', pageId);

            // Get only main comments (not replies) for this page
            const { data: comments, error: commentsError } = await this.supabase
                .from('comments')
                .select('*')
                .eq('page_id', pageId)
                .eq('status', 'approved')
                .is('parent_id', null) // Only main comments, not replies
                .order('created_at', { ascending: false });

            if (commentsError) throw commentsError;

            console.log(`Found ${comments?.length || 0} comments for page_id: ${pageId}`);

            // Get replies for these comments
            if (comments && comments.length > 0) {
                const commentIds = comments.map(c => c.id);
                const { data: replies, error: repliesError } = await this.supabase
                    .from('comments')
                    .select('*')
                    .in('parent_id', commentIds)
                    .eq('status', 'approved')
                    .order('created_at', { ascending: true });

                if (repliesError) throw repliesError;

                // Attach replies to their parent comments
                const commentsWithReplies = comments.map(comment => ({
                    ...comment,
                    replies: replies.filter(reply => reply.parent_id === comment.id)
                }));

                return { success: true, data: commentsWithReplies };
            }

            return { success: true, data: comments || [] };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    async getAllComments() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            console.log('Fetching all comments...');

            // First, get all comments
            const { data: comments, error: commentsError } = await this.supabase
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false });

            if (commentsError) throw commentsError;

            console.log(`Found ${comments?.length || 0} total comments`);
            
            // Log unique page_ids for debugging
            if (comments && comments.length > 0) {
                const uniquePageIds = [...new Set(comments.map(c => c.page_id))];
                console.log('Unique page_ids in database:', uniquePageIds);
            }

            return { success: true, data: comments || [] };
        } catch (error) {
            console.error('Error fetching all comments:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCommentStatus(commentId, status) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('comments')
                .update({ 
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', commentId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error updating comment status:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteComment(commentId) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { error } = await this.supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting comment:', error);
            return { success: false, error: error.message };
        }
    }

    async getCommentStats() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('comments')
                .select('status');

            if (error) throw error;

            const stats = {
                total: data.length,
                pending: data.filter(c => c.status === 'pending').length,
                approved: data.filter(c => c.status === 'approved').length,
                rejected: data.filter(c => c.status === 'rejected').length
            };

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching comment stats:', error);
            return { success: false, error: error.message };
        }
    }

    // Submit a reply to a comment
    async submitReply(replyData) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            // Validate required fields
            if (!replyData.page_id || !replyData.nickname || !replyData.content || !replyData.parent_id) {
                throw new Error('Missing required fields for reply');
            }

            const commentData = {
                page_id: replyData.page_id,
                nickname: replyData.nickname.trim(),
                content: replyData.content.trim(),
                rating: parseInt(replyData.rating) || 5,
                status: replyData.status || 'approved', // Replies are approved by default
                parent_id: replyData.parent_id
            };

            const { data, error } = await this.supabase
                .from('comments')
                .insert(commentData)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Reply submission error:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    // Get replies for a comment
    async getReplies(commentId) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('comments')
                .select('*')
                .eq('parent_id', commentId)
                .eq('status', 'approved')
                .order('created_at', { ascending: true });

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching replies:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    // Configuration methods
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Comment System Manager: Configuration updated', this.config);
    }

    getConfig() {
        return { ...this.config };
    }

    // Debug method to check database state
    async debugDatabaseState() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            console.log('=== DATABASE DEBUG INFO ===');
            
            // Get all comments
            const { data: allComments, error: allError } = await this.supabase
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false });

            if (allError) throw allError;

            console.log(`Total comments in database: ${allComments?.length || 0}`);
            
            if (allComments && allComments.length > 0) {
                // Group by page_id
                const pageIdGroups = {};
                allComments.forEach(comment => {
                    if (!pageIdGroups[comment.page_id]) {
                        pageIdGroups[comment.page_id] = [];
                    }
                    pageIdGroups[comment.page_id].push(comment);
                });

                console.log('Comments grouped by page_id:');
                Object.keys(pageIdGroups).forEach(pageId => {
                    console.log(`  ${pageId}: ${pageIdGroups[pageId].length} comments`);
                });
            }

            // Get unique page_ids
            const { data: uniquePageIds, error: uniqueError } = await this.supabase
                .from('comments')
                .select('page_id')
                .order('page_id');

            if (!uniqueError && uniquePageIds) {
                const uniqueIds = [...new Set(uniquePageIds.map(c => c.page_id))];
                console.log('Unique page_ids:', uniqueIds);
            }

            console.log('=== END DATABASE DEBUG ===');
            
            return { success: true, data: { allComments, uniquePageIds } };
        } catch (error) {
            console.error('Database debug error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Individual Comment Instance
class CommentInstance {
    constructor(containerId, pageId, config, manager) {
        this.containerId = containerId;
        this.pageId = pageId;
        this.config = config;
        this.manager = manager;
        this.container = document.getElementById(containerId);
        
        console.log('Creating CommentInstance:', { containerId, pageId });
        
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
                                <label for="rating_${this.containerId}" class="form-label">Değerlendirme</label>
                                <select 
                                    id="rating_${this.containerId}" 
                                    name="rating"
                                    aria-label="Yorum değerlendirmesi seçin"
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
                                maxlength="${this.config.maxLength}" 
                                required
                                placeholder="Yorumunuzu yazın... (en az ${this.config.minLength} karakter)"
                                rows="4"
                            ></textarea>
                            <div class="char-counter">
                                <span id="charCount_${this.containerId}">0</span> / ${this.config.maxLength}
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
            charCount.textContent = contentTextarea.value.length;
            
            contentTextarea.addEventListener('input', (e) => {
                const length = e.target.value.length;
                charCount.textContent = length;
                
                const counter = document.getElementById(`charCount_${this.containerId}`);
                if (length < this.config.minLength) {
                    counter.className = 'char-counter error';
                } else if (length > this.config.maxLength * 0.9) {
                    counter.className = 'char-counter warning';
                } else {
                    counter.className = 'char-counter success';
                }
            });
        }
        
        if (ratingSelect) {
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
        
        // Validation
        if (nickname.length < 2) {
            this.showMessage('Kullanıcı adı en az 2 karakter olmalıdır', 'error');
            return;
        }
        
        if (content.length < this.config.minLength) {
            this.showMessage(`Yorum en az ${this.config.minLength} karakter olmalıdır`, 'error');
            return;
        }
        
        if (content.length > this.config.maxLength) {
            this.showMessage(`Yorum en fazla ${this.config.maxLength} karakter olabilir`, 'error');
            return;
        }
        
        // Disable form
        const submitBtn = form.querySelector('.btn-modern');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="btn-text">Gönderiliyor...</span><span class="btn-icon">⏳</span>';
        submitBtn.disabled = true;
        
        try {
            console.log('Submitting comment with pageId:', this.pageId);
            const result = await this.manager.submitComment(this.pageId, nickname, content, rating);
            
            console.log('Submit result:', result);
            
            if (result.success) {
                this.showMessage('Yorum başarıyla gönderildi ve onay bekliyor', 'success');
                form.reset();
                
                const charCount = document.getElementById(`charCount_${this.containerId}`);
                if (charCount) {
                    charCount.textContent = '0';
                    charCount.className = 'char-counter error';
                }
                
                const ratingSelect = document.getElementById(`rating_${this.containerId}`);
                if (ratingSelect) {
                    ratingSelect.value = '5';
                }
                
                this.loadComments();
            } else {
                this.showMessage(result.error || 'Yorum gönderilirken hata oluştu', 'error');
            }
            
        } catch (error) {
            console.error('Comment submission error:', error);
            this.showMessage('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadComments() {
        const commentsList = document.getElementById(`commentsList_${this.containerId}`);
        if (!commentsList) return;
        
        console.log('Loading comments for instance:', this.containerId, 'pageId:', this.pageId);
        
        try {
            const result = await this.manager.getComments(this.pageId);
            
            console.log('Load comments result:', result);
            
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
        
        // Filter out replies - they will be displayed under their parent comments
        const topLevelComments = comments.filter(comment => !comment.parent_id);
        
        if (topLevelComments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comment-slash"></i>
                    Henüz yorum yapılmamış. İlk yorumu siz yapın!
                </div>
            `;
            return;
        }
        
        const commentsHTML = topLevelComments.map(comment => {
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
            
            // Use the new renderReplies function
            const repliesHTML = this.renderReplies(comment.replies || []);
            
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
                    ${repliesHTML ? `<div class="comment-replies">${repliesHTML}</div>` : ''}
                </div>
            `;
        }).join('');
        
        commentsList.innerHTML = commentsHTML;
    }

    renderReplies(replies) {
        if (!replies || replies.length === 0) {
            return '';
        }

        const repliesHTML = replies.map(reply => {
            const isAdmin = reply.nickname === 'Murat Oto Anahtar';
            
            // Admin cevaplarında yıldız gösterme
            const ratingSection = isAdmin ? '' : `
                <div class="reply-rating">
                    <div class="rating-stars" style="display: inline-flex; gap: 0.125rem; margin-right: 0.5rem;">
                        ${Array.from({length: 5}, (_, i) => 
                            `<i class="fas fa-star" style="color: ${i < (reply.rating || 5) ? '#fbbf24' : '#d1d5db'}; font-size: 0.8rem;"></i>`
                        ).join('')}
                    </div>
                    <span style="font-size: 0.75rem; color: #666;">
                        ${['Faydasız', 'Az Faydalı', 'Orta', 'Faydalı', 'Çok Faydalı'][(reply.rating || 5) - 1]}
                    </span>
                </div>
            `;
            
            return `
                <div class="comment-reply" data-id="${reply.id}" data-parent-id="${reply.parent_id}">
                    <div class="reply-header">
                        <div class="reply-author">
                            <i class="fas fa-reply" style="color: #dc2626; margin-right: 0.5rem;"></i>
                            <span class="nickname">${this.escapeHtml(reply.nickname)}</span>
                            ${isAdmin ? '<span class="admin-badge" style="background: #dc2626; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 8px; font-weight: 600;">Yönetici</span>' : ''}
                        </div>
                        <div class="reply-meta">
                            ${ratingSection}
                            <div class="reply-date">
                                <i class="fas fa-clock"></i>
                                ${this.formatDate(reply.created_at)}
                            </div>
                        </div>
                    </div>
                    <div class="reply-content">
                        ${this.escapeHtml(reply.content)}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="comment-replies">
                ${repliesHTML}
            </div>
        `;
    }

    showMessage(message, type = 'info') {
        const existingMessages = document.querySelectorAll('.comment-message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `comment-message comment-message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        const form = document.getElementById(`commentForm_${this.containerId}`);
        if (form && form.parentNode) {
            form.parentNode.insertBefore(messageDiv, form.nextSibling);
        }
        
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
    }
}

// Initialize the manager when the script loads
const commentSystemManager = new CommentSystemManager();

// Make it globally available
window.commentSystemManager = commentSystemManager;
