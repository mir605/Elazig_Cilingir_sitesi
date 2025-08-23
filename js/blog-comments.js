// Blog Comments Integration
// Add comment system to blog pages

class BlogCommentsSystem {
    constructor() {
        this.supabase = window.supabaseClient;
        this.blogUrl = window.location.pathname;
        this.init();
    }

    async init() {
        this.createCommentSection();
        
        // Wait for DOM elements to be available
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        if (this.supabase) {
            await this.loadBlogComments();
        } else {
            console.warn('Supabase not available for blog comments');
        }
    }

    createCommentSection() {
        // Find article content container
        const articleContainer = document.querySelector('.article-content') || 
                                document.querySelector('.blog-content') || 
                                document.querySelector('main') ||
                                document.querySelector('.container');

        if (!articleContainer) return;

        // Create comment section HTML
        const commentSection = document.createElement('section');
        commentSection.className = 'blog-comments-section';
        commentSection.innerHTML = `
            <div class="comments-container">
                <div class="comments-header">
                    <h3>💬 Bu makale hakkında yorumlarınız</h3>
                    <p>Deneyimlerinizi ve görüşlerinizi paylaşın</p>
                </div>

                <!-- Comment Form -->
                <div class="blog-comment-form-section">
                    <div class="comment-form-card">
                        <form id="blog-comment-form" class="simple-comment-form">
                            <div class="form-row">
                                <div class="form-col">
                                    <input type="text" id="blog-comment-name" name="name" required 
                                           placeholder="Adınız (örn: Ahmet K.)" maxlength="50">
                                </div>
                                <div class="form-col">
                                    <select id="blog-comment-rating" name="rating">
                                        <option value="5">⭐⭐⭐⭐⭐ Çok Faydalı</option>
                                        <option value="4">⭐⭐⭐⭐ Faydalı</option>
                                        <option value="3">⭐⭐⭐ Orta</option>
                                        <option value="2">⭐⭐ Az Faydalı</option>
                                        <option value="1">⭐ Faydasız</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="comment-textarea-wrapper">
                                <textarea id="blog-comment-text" name="comment" required 
                                          placeholder="Bu makale hakkındaki görüşlerinizi yazın... (en az 20 karakter)" 
                                          minlength="20" maxlength="500" rows="4"></textarea>
                                <div class="char-counter">
                                    <span id="blog-char-count">0</span>/500
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-modern">
                                <span class="btn-text">Yorum Gönder</span>
                                <span class="btn-icon">📝</span>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Comments Display -->
                <div id="blog-comments-display" class="blog-comments-display">
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i>
                        Yorumlar yükleniyor...
                    </div>
                </div>
            </div>
        `;

        // Add styles for blog comments
        this.addBlogCommentStyles();

        // Insert comment section
        articleContainer.appendChild(commentSection);

        // Setup event listeners
        this.setupEventListeners();
    }

    addBlogCommentStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .blog-comments-section {
                margin: 4rem 0 2rem 0;
                padding: 2rem 0;
                border-top: 2px solid #e2e8f0;
            }

            .comments-header {
                text-align: center;
                margin-bottom: 2.5rem;
            }

            .comments-header h3 {
                font-size: 1.75rem;
                color: #1e293b;
                margin-bottom: 0.5rem;
                font-weight: 700;
            }

            .comments-header p {
                color: #64748b;
                font-size: 1.1rem;
            }

            .blog-comment-form-section {
                margin-bottom: 3rem;
                display: flex;
                justify-content: center;
            }

            .blog-comments-display {
                margin-top: 2rem;
            }

            .loading-message {
                text-align: center;
                color: #64748b;
                padding: 2rem;
                font-style: italic;
            }

            .no-blog-comments {
                text-align: center;
                padding: 3rem 2rem;
                background: #f8fafc;
                border-radius: 16px;
                border: 2px dashed #e2e8f0;
            }

            .blog-comment-item {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }

            .blog-comment-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .blog-comment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .blog-comment-author {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .blog-author-avatar {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #dc2626, #ea580c);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
            }

            .blog-author-info h5 {
                margin: 0;
                color: #1e293b;
                font-weight: 600;
                font-size: 1rem;
            }

            .blog-comment-rating {
                font-size: 0.85rem;
                margin-top: 2px;
            }

            .blog-comment-date {
                color: #64748b;
                font-size: 0.85rem;
            }

            .blog-comment-content {
                color: #374151;
                line-height: 1.6;
                font-size: 1rem;
                font-style: italic;
            }

            @media (max-width: 768px) {
                .blog-comments-section {
                    margin: 2rem 0;
                    padding: 1rem;
                }

                .blog-comment-header {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .blog-comment-date {
                    align-self: flex-end;
                }

                .blog-comment-item {
                    padding: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const form = document.getElementById('blog-comment-form');
        const textarea = document.getElementById('blog-comment-text');
        const counter = document.getElementById('blog-char-count');

        console.log('Blog comment form:', form);
        console.log('Blog textarea:', textarea);
        console.log('Blog counter:', counter);

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBlogCommentSubmit(e.target);
            });
        }

        if (textarea && counter) {
            console.log('Setting up blog character counter');
            
            // Set initial count
            counter.textContent = textarea.value.length;
            
            textarea.addEventListener('input', () => {
                const length = textarea.value.length;
                counter.textContent = length;
                console.log('Blog chars:', length);
                
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

    async handleBlogCommentSubmit(form) {
        if (!this.supabase) {
            this.showMessage('❌ Yorum sistemi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Gönderiliyor...</span><span class="btn-icon">⏳</span>';

        try {
            const formData = new FormData(form);
            const name = formData.get('name').trim();
            const rating = parseInt(formData.get('rating'));
            const comment = formData.get('comment').trim();

            if (!name || name.length < 2) {
                throw new Error('Lütfen geçerli bir ad girin.');
            }

            if (!comment || comment.length < 20) {
                throw new Error('Yorum en az 20 karakter olmalıdır.');
            }

            // Create user
            const user = await this.createOrGetUser(name);
            
            // Insert blog comment
            const { data, error } = await this.supabase
                .from('comments')
                .insert({
                    user_id: user.id,
                    name: name,
                    rating: rating,
                    content: comment,
                    status: 'pending',
                    blog_url: this.blogUrl // Track which blog page
                })
                .select()
                .single();

            if (error) throw error;

            form.reset();
            document.getElementById('blog-char-count').textContent = '0';
            this.showMessage('✅ Yorumunuz gönderildi! Admin onayından sonra yayınlanacaktır.', 'success');
            
            await this.loadBlogComments();

        } catch (error) {
            console.error('Blog comment submission error:', error);
            this.showMessage(`❌ Hata: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async createOrGetUser(name) {
        const { data: existingUser } = await this.supabase
            .from('users')
            .select('*')
            .eq('display_name', name)
            .single();

        if (existingUser) {
            return existingUser;
        }

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

    async loadBlogComments() {
        const container = document.getElementById('blog-comments-display');
        if (!container) return;

        try {
            const { data: comments, error } = await this.supabase
                .from('comments')
                .select('*')
                .eq('status', 'approved')
                .eq('blog_url', this.blogUrl)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderBlogComments(comments || []);

        } catch (error) {
            console.error('Error loading blog comments:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>❌ Yorumlar yüklenirken hata oluştu.</p>
                </div>
            `;
        }
    }

    renderBlogComments(comments) {
        const container = document.getElementById('blog-comments-display');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="no-blog-comments">
                    <div class="no-comments-icon">💬</div>
                    <h4>Henüz yorum yok</h4>
                    <p>Bu makale hakkında ilk yorumu yapan siz olun!</p>
                </div>
            `;
            return;
        }

        const commentsHTML = comments.map(comment => {
            const stars = '⭐'.repeat(comment.rating);
            const date = new Date(comment.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <div class="blog-comment-item">
                    <div class="blog-comment-header">
                        <div class="blog-comment-author">
                            <div class="blog-author-avatar">
                                ${comment.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="blog-author-info">
                                <h5>${this.escapeHtml(comment.name)}</h5>
                                <div class="blog-comment-rating">${stars}</div>
                            </div>
                        </div>
                        <div class="blog-comment-date">${date}</div>
                    </div>
                    <div class="blog-comment-content">
                        "${this.escapeHtml(comment.content)}"
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="blog-comments-header">
                <h4>📝 Okuyucu Yorumları (${comments.length})</h4>
            </div>
            ${commentsHTML}
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        const existingMessages = document.querySelectorAll('.comment-notification');
        existingMessages.forEach(msg => msg.remove());

        const notification = document.createElement('div');
        notification.className = `comment-notification comment-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        const form = document.getElementById('blog-comment-form');
        if (form) {
            form.parentNode.insertBefore(notification, form);
        }

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on blog pages
    if (window.location.pathname.includes('/blog/') || 
        window.location.pathname.includes('blog.html')) {
        
        setTimeout(() => {
            window.blogCommentsSystem = new BlogCommentsSystem();
        }, 1000); // Wait for Supabase to load
    }
});
