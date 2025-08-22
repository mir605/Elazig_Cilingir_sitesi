// Admin Panel Main JavaScript
// Ana Admin Panel Yönetimi

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        // Admin auth kontrolü
        if (!window.adminAuth || !window.adminAuth.isAuth()) {
            return; // Auth olmamışsa login formunu göster
        }

        this.setupEventListeners();
        this.loadInitialData();
        
        // Override admin auth showAdminPanel method
        window.adminAuth.showAdminPanel = () => {
            // Panel zaten yüklü, bir şey yapma
        };
    }

    // Event listener'ları kur
    setupEventListeners() {
        // Menu navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-item') || e.target.closest('.menu-item')) {
                const menuItem = e.target.classList.contains('menu-item') ? e.target : e.target.closest('.menu-item');
                const section = menuItem.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            }
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                window.adminAuth.logout();
            }
        });

        // Mobile menu
        document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
            document.querySelector('.admin-sidebar').classList.toggle('active');
        });

        // Modal controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'settings-form') {
                e.preventDefault();
                this.saveSettings(e.target);
            }
        });

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'comments-filter') {
                this.loadComments();
            }
            if (e.target.id === 'messages-filter') {
                this.loadMessages();
            }
        });

        // Refresh buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refresh-comments' || e.target.closest('#refresh-comments')) {
                this.loadComments();
            }
            if (e.target.id === 'refresh-users' || e.target.closest('#refresh-users')) {
                this.loadUsers();
            }
            if (e.target.id === 'refresh-messages' || e.target.closest('#refresh-messages')) {
                this.loadMessages();
            }
        });

        // Search
        document.getElementById('users-search')?.addEventListener('input', 
            this.debounce((e) => this.searchUsers(e.target.value), 500)
        );
    }

    // Bölüm değiştir
    switchSection(section) {
        // Eski aktif menüyü kaldır
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Eski aktif içeriği gizle
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Yeni menü öğesini aktif yap
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Yeni içeriği göster
        document.getElementById(`${section}-section`).classList.add('active');

        // Sayfa başlığını güncelle
        const titles = {
            dashboard: 'Ana Panel',
            comments: 'Yorum Yönetimi',
            users: 'Kullanıcı Yönetimi',
            messages: 'İletişim Mesajları',
            settings: 'Site Ayarları'
        };
        document.getElementById('page-title').textContent = titles[section];

        this.currentSection = section;

        // Bölüme özel verileri yükle
        this.loadSectionData(section);
    }

    // Bölüm verilerini yükle
    loadSectionData(section) {
        switch(section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'comments':
                this.loadComments();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'messages':
                this.loadMessages();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Başlangıç verileri yükle
    async loadInitialData() {
        await this.loadDashboard();
        await this.updateBadges();
    }

    // Dashboard verilerini yükle
    async loadDashboard() {
        this.showLoading();

        try {
            // İstatistikleri al
            const [commentsCount, pendingCommentsCount, usersCount, newMessagesCount] = await Promise.all([
                this.getCommentsCount(),
                this.getPendingCommentsCount(),
                this.getUsersCount(),
                this.getNewMessagesCount()
            ]);

            // İstatistikleri güncelle
            document.getElementById('total-comments').textContent = commentsCount;
            document.getElementById('pending-comments').textContent = pendingCommentsCount;
            document.getElementById('total-users').textContent = usersCount;
            document.getElementById('new-messages').textContent = newMessagesCount;

            // Son yorumları yükle
            await this.loadRecentComments();
            
            // Son mesajları yükle
            await this.loadRecentMessages();

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showNotification('Dashboard yüklenirken hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Yorumları yükle
    async loadComments() {
        this.showLoading();

        try {
            const filter = document.getElementById('comments-filter')?.value || 'all';
            let query = window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .select(`
                    id,
                    username,
                    content,
                    status,
                    created_at,
                    users (
                        display_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data: comments, error } = await query;

            if (error) throw error;

            this.renderCommentsTable(comments);

        } catch (error) {
            console.error('Error loading comments:', error);
            this.showNotification('Yorumlar yüklenirken hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Kullanıcıları yükle
    async loadUsers() {
        this.showLoading();

        try {
            const { data: users, error } = await window.supabaseClient
                .from(window.TABLES.USERS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderUsersTable(users);

        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Kullanıcılar yüklenirken hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Mesajları yükle
    async loadMessages() {
        this.showLoading();

        try {
            const filter = document.getElementById('messages-filter')?.value || 'all';
            let query = window.supabaseClient
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data: messages, error } = await query;

            if (error) throw error;

            this.renderMessagesTable(messages);

        } catch (error) {
            console.error('Error loading messages:', error);
            this.showNotification('Mesajlar yüklenirken hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Ayarları yükle
    async loadSettings() {
        this.showLoading();

        try {
            const { data: settings, error } = await window.supabaseClient
                .from(window.TABLES.ADMIN_SETTINGS)
                .select('*');

            if (error) throw error;

            // Ayarları forma doldur
            settings.forEach(setting => {
                const element = document.getElementById(setting.setting_key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = setting.setting_value === 'true';
                    } else {
                        element.value = setting.setting_value || '';
                    }
                }
            });

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Ayarlar yüklenirken hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Badge'leri güncelle
    async updateBadges() {
        try {
            const [pendingCommentsCount, newMessagesCount] = await Promise.all([
                this.getPendingCommentsCount(),
                this.getNewMessagesCount()
            ]);

            const pendingBadge = document.getElementById('pending-comments-badge');
            const messagesBadge = document.getElementById('new-messages-badge');

            if (pendingBadge) {
                pendingBadge.textContent = pendingCommentsCount;
                pendingBadge.style.display = pendingCommentsCount > 0 ? 'flex' : 'none';
            }

            if (messagesBadge) {
                messagesBadge.textContent = newMessagesCount;
                messagesBadge.style.display = newMessagesCount > 0 ? 'flex' : 'none';
            }

        } catch (error) {
            console.error('Error updating badges:', error);
        }
    }

    // Yorumları tablo olarak render et
    renderCommentsTable(comments) {
        const tbody = document.querySelector('#comments-table tbody');
        if (!tbody) return;

        if (comments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Yorum bulunamadı.</td></tr>';
            return;
        }

        tbody.innerHTML = comments.map(comment => `
            <tr>
                <td>${this.escapeHtml(comment.users?.display_name || comment.username)}</td>
                <td>
                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                        ${this.escapeHtml(comment.content.substring(0, 100))}${comment.content.length > 100 ? '...' : ''}
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${comment.status}">
                        ${this.getStatusText(comment.status)}
                    </span>
                </td>
                <td>${new Date(comment.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                    <button class="action-btn view" onclick="adminPanel.viewComment('${comment.id}')" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${comment.status === 'pending' ? `
                        <button class="action-btn approve" onclick="adminPanel.approveComment('${comment.id}')" title="Onayla">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn reject" onclick="adminPanel.rejectComment('${comment.id}')" title="Reddet">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    // Kullanıcıları tablo olarak render et
    renderUsersTable(users) {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Kullanıcı bulunamadı.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.escapeHtml(user.display_name || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                    <span class="status-badge ${user.is_active ? 'status-approved' : 'status-rejected'}">
                        ${user.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit" onclick="adminPanel.toggleUserStatus('${user.id}', ${!user.is_active})" 
                            title="${user.is_active ? 'Pasif Yap' : 'Aktif Yap'}">
                        <i class="fas fa-${user.is_active ? 'user-slash' : 'user-check'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Mesajları tablo olarak render et
    renderMessagesTable(messages) {
        const tbody = document.querySelector('#messages-table tbody');
        if (!tbody) return;

        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Mesaj bulunamadı.</td></tr>';
            return;
        }

        tbody.innerHTML = messages.map(message => `
            <tr>
                <td>${this.escapeHtml(message.name)}</td>
                <td>${this.escapeHtml(message.email || '-')}</td>
                <td>${this.escapeHtml(message.phone || '-')}</td>
                <td>${this.escapeHtml(message.subject || '-')}</td>
                <td>
                    <span class="status-badge status-${message.status}">
                        ${message.status === 'new' ? 'Yeni' : 'Okunmuş'}
                    </span>
                </td>
                <td>${new Date(message.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                    <button class="action-btn view" onclick="adminPanel.viewMessage('${message.id}')" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${message.status === 'new' ? `
                        <button class="action-btn edit" onclick="adminPanel.markMessageRead('${message.id}')" title="Okundu İşaretle">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    // Son yorumları yükle
    async loadRecentComments() {
        try {
            const { data: comments, error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .select(`
                    id,
                    username,
                    content,
                    status,
                    created_at,
                    users (display_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            const container = document.getElementById('recent-comments');
            if (container) {
                container.innerHTML = comments.map(comment => `
                    <div class="recent-item">
                        <h4>${this.escapeHtml(comment.users?.display_name || comment.username)}</h4>
                        <p>${this.escapeHtml(comment.content.substring(0, 100))}${comment.content.length > 100 ? '...' : ''}</p>
                        <div class="date">${new Date(comment.created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Error loading recent comments:', error);
        }
    }

    // Son mesajları yükle
    async loadRecentMessages() {
        try {
            const { data: messages, error } = await window.supabaseClient
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            const container = document.getElementById('recent-messages');
            if (container) {
                container.innerHTML = messages.map(message => `
                    <div class="recent-item">
                        <h4>${this.escapeHtml(message.name)}</h4>
                        <p>${this.escapeHtml(message.subject || message.message.substring(0, 100))}</p>
                        <div class="date">${new Date(message.created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Error loading recent messages:', error);
        }
    }

    // Yorum onayla
    async approveComment(commentId) {
        try {
            const { error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .update({ 
                    status: window.COMMENT_STATUS.APPROVED,
                    approved_at: new Date().toISOString()
                })
                .eq('id', commentId);

            if (error) throw error;

            this.showNotification('Yorum onaylandı.', 'success');
            this.loadComments();
            this.updateBadges();

        } catch (error) {
            console.error('Error approving comment:', error);
            this.showNotification('Yorum onaylanırken hata oluştu.', 'error');
        }
    }

    // Yorum reddet
    async rejectComment(commentId) {
        try {
            const { error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .update({ status: window.COMMENT_STATUS.REJECTED })
                .eq('id', commentId);

            if (error) throw error;

            this.showNotification('Yorum reddedildi.', 'success');
            this.loadComments();
            this.updateBadges();

        } catch (error) {
            console.error('Error rejecting comment:', error);
            this.showNotification('Yorum reddedilirken hata oluştu.', 'error');
        }
    }

    // Yorum görüntüle
    async viewComment(commentId) {
        try {
            const { data: comment, error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .select(`
                    *,
                    users (display_name)
                `)
                .eq('id', commentId)
                .single();

            if (error) throw error;

            this.showCommentModal(comment);

        } catch (error) {
            console.error('Error viewing comment:', error);
            this.showNotification('Yorum görüntülenirken hata oluştu.', 'error');
        }
    }

    // Yorum modal göster
    showCommentModal(comment) {
        const modal = document.getElementById('comment-modal');
        const detail = document.getElementById('comment-detail');
        
        if (modal && detail) {
            detail.innerHTML = `
                <div>
                    <h4>Kullanıcı: ${this.escapeHtml(comment.users?.display_name || comment.username)}</h4>
                    <p><strong>Durum:</strong> <span class="status-badge status-${comment.status}">${this.getStatusText(comment.status)}</span></p>
                    <p><strong>Tarih:</strong> ${new Date(comment.created_at).toLocaleString('tr-TR')}</p>
                    <hr>
                    <p><strong>Yorum:</strong></p>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">
                        ${this.escapeHtml(comment.content).replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;

            // Buton event listener'ları
            document.getElementById('approve-comment').onclick = () => {
                this.approveComment(comment.id);
                this.closeModal();
            };

            document.getElementById('reject-comment').onclick = () => {
                this.rejectComment(comment.id);
                this.closeModal();
            };

            modal.classList.add('active');
        }
    }

    // Kullanıcı durumunu değiştir
    async toggleUserStatus(userId, newStatus) {
        try {
            const { error } = await window.supabaseClient
                .from(window.TABLES.USERS)
                .update({ is_active: newStatus })
                .eq('id', userId);

            if (error) throw error;

            this.showNotification(`Kullanıcı ${newStatus ? 'aktif' : 'pasif'} yapıldı.`, 'success');
            this.loadUsers();

        } catch (error) {
            console.error('Error toggling user status:', error);
            this.showNotification('Kullanıcı durumu değiştirilirken hata oluştu.', 'error');
        }
    }

    // Mesaj görüntüle
    async viewMessage(messageId) {
        try {
            const { data: message, error } = await window.supabaseClient
                .from('contact_messages')
                .select('*')
                .eq('id', messageId)
                .single();

            if (error) throw error;

            this.showMessageModal(message);

        } catch (error) {
            console.error('Error viewing message:', error);
            this.showNotification('Mesaj görüntülenirken hata oluştu.', 'error');
        }
    }

    // Mesaj modal göster
    showMessageModal(message) {
        const modal = document.getElementById('message-modal');
        const detail = document.getElementById('message-detail');
        
        if (modal && detail) {
            detail.innerHTML = `
                <div>
                    <h4>${this.escapeHtml(message.name)}</h4>
                    <p><strong>E-posta:</strong> ${this.escapeHtml(message.email || '-')}</p>
                    <p><strong>Telefon:</strong> ${this.escapeHtml(message.phone || '-')}</p>
                    <p><strong>Konu:</strong> ${this.escapeHtml(message.subject || '-')}</p>
                    <p><strong>Durum:</strong> <span class="status-badge status-${message.status}">${message.status === 'new' ? 'Yeni' : 'Okunmuş'}</span></p>
                    <p><strong>Tarih:</strong> ${new Date(message.created_at).toLocaleString('tr-TR')}</p>
                    <hr>
                    <p><strong>Mesaj:</strong></p>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">
                        ${this.escapeHtml(message.message).replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;

            // Buton event listener
            document.getElementById('mark-message-read').onclick = () => {
                this.markMessageRead(message.id);
                this.closeModal();
            };

            modal.classList.add('active');
        }
    }

    // Mesajı okundu işaretle
    async markMessageRead(messageId) {
        try {
            const { error } = await window.supabaseClient
                .from('contact_messages')
                .update({ 
                    status: 'read',
                    read_at: new Date().toISOString()
                })
                .eq('id', messageId);

            if (error) throw error;

            this.showNotification('Mesaj okundu olarak işaretlendi.', 'success');
            this.loadMessages();
            this.updateBadges();

        } catch (error) {
            console.error('Error marking message as read:', error);
            this.showNotification('Mesaj işaretlenirken hata oluştu.', 'error');
        }
    }

    // Ayarları kaydet
    async saveSettings(form) {
        this.showLoading();

        try {
            const formData = new FormData(form);
            const updates = [];

            // Form verilerini işle
            for (const [key, value] of formData.entries()) {
                updates.push({
                    setting_key: key,
                    setting_value: value
                });
            }

            // Checkbox'ları da kontrol et
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (!formData.has(checkbox.name)) {
                    updates.push({
                        setting_key: checkbox.name,
                        setting_value: 'false'
                    });
                }
            });

            // Ayarları güncelle
            for (const update of updates) {
                const { error } = await window.supabaseClient
                    .from(window.TABLES.ADMIN_SETTINGS)
                    .upsert(update, { onConflict: 'setting_key' });

                if (error) throw error;
            }

            this.showNotification('Ayarlar başarıyla kaydedildi.', 'success');

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Ayarlar kaydedilirken hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Kullanıcı ara
    async searchUsers(query) {
        if (!query || query.length < 2) {
            this.loadUsers();
            return;
        }

        this.showLoading();

        try {
            const { data: users, error } = await window.supabaseClient
                .from(window.TABLES.USERS)
                .select('*')
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderUsersTable(users);

        } catch (error) {
            console.error('Error searching users:', error);
            this.showNotification('Kullanıcı arama işleminde hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Yardımcı fonksiyonlar
    async getCommentsCount() {
        try {
            const { count, error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting comments count:', error);
            return 0;
        }
    }

    async getPendingCommentsCount() {
        try {
            const { count, error } = await window.supabaseClient
                .from(window.TABLES.COMMENTS)
                .select('*', { count: 'exact', head: true })
                .eq('status', window.COMMENT_STATUS.PENDING);
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting pending comments count:', error);
            return 0;
        }
    }

    async getUsersCount() {
        try {
            const { count, error } = await window.supabaseClient
                .from(window.TABLES.USERS)
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting users count:', error);
            return 0;
        }
    }

    async getNewMessagesCount() {
        try {
            const { count, error } = await window.supabaseClient
                .from('contact_messages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting new messages count:', error);
            return 0;
        }
    }

    getStatusText(status) {
        const statusTexts = {
            pending: 'Bekliyor',
            approved: 'Onaylandı',
            rejected: 'Reddedildi'
        };
        return statusTexts[status] || status;
    }

    // Modal kapat
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Loading göster
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    // Loading gizle
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // Bildirim göster
    showNotification(message, type = 'info') {
        // Basit bildirim sistemi
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            font-size: 0.9rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        // CSS animasyon
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 5 saniye sonra kaldır
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    // HTML escape
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Admin panel'i başlat
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabaseClient) {
        window.adminPanel = new AdminPanel();
        console.log('Admin panel initialized');
    } else {
        console.error('Supabase client not found');
    }
});

// Global adminPanel instance
window.AdminPanel = AdminPanel;
