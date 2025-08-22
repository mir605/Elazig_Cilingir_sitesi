// Authentication System for Simple Username-based Comments
// Basit kullanıcı adı tabanlı yorum sistemi

class SimpleAuth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Sayfa yüklendiğinde mevcut kullanıcıyı kontrol et
        this.checkCurrentUser();
        this.setupEventListeners();
    }

    // LocalStorage'dan kullanıcıyı kontrol et
    checkCurrentUser() {
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI();
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('current_user');
            }
        }
    }

    // Event listener'ları kur
    setupEventListeners() {
        // Username form submit
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('username-form')) {
                e.preventDefault();
                this.handleUsernameSubmit(e.target);
            }
        });

        // Logout butonları
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    // Kullanıcı adı form işleme
    async handleUsernameSubmit(form) {
        const formData = new FormData(form);
        const username = formData.get('username').trim();
        const displayName = formData.get('display_name').trim();

        if (!username || username.length < 3) {
            this.showError('Kullanıcı adı en az 3 karakter olmalıdır.');
            return;
        }

        if (username.length > 50) {
            this.showError('Kullanıcı adı en fazla 50 karakter olabilir.');
            return;
        }

        // Kullanıcı adı geçerlilik kontrolü
        if (!/^[a-zA-Z0-9_çğıöşüÇĞIıÖŞÜ]+$/.test(username)) {
            this.showError('Kullanıcı adında sadece harf, rakam ve _ kullanabilirsiniz.');
            return;
        }

        try {
            await this.createOrLoginUser(username, displayName);
        } catch (error) {
            console.error('Error creating/logging in user:', error);
            this.showError('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    }

    // Kullanıcı oluştur veya giriş yap
    async createOrLoginUser(username, displayName) {
        try {
            // Önce kullanıcının var olup olmadığını kontrol et
            const { data: existingUser, error: selectError } = await window.supabaseClient
                .from(window.TABLES.USERS)
                .select('*')
                .eq('username', username)
                .single();

            let user;

            if (selectError && selectError.code === 'PGRST116') {
                // Kullanıcı bulunamadı, yeni kullanıcı oluştur
                const { data: newUser, error: insertError } = await window.supabaseClient
                    .from(window.TABLES.USERS)
                    .insert([{
                        username: username,
                        display_name: displayName || username,
                        is_active: true
                    }])
                    .select()
                    .single();

                if (insertError) {
                    if (insertError.code === '23505') { // Unique constraint violation
                        throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
                    }
                    throw insertError;
                }
                user = newUser;
            } else if (selectError) {
                throw selectError;
            } else {
                // Kullanıcı mevcut, display_name'i güncelle
                if (displayName && displayName !== existingUser.display_name) {
                    const { data: updatedUser, error: updateError } = await window.supabaseClient
                        .from(window.TABLES.USERS)
                        .update({ display_name: displayName })
                        .eq('id', existingUser.id)
                        .select()
                        .single();

                    if (updateError) throw updateError;
                    user = updatedUser;
                } else {
                    user = existingUser;
                }
            }

            // Kullanıcıyı kaydet
            this.currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            this.updateUI();
            this.showSuccess('Başarıyla giriş yaptınız!');

        } catch (error) {
            console.error('Error in createOrLoginUser:', error);
            throw error;
        }
    }

    // Çıkış yap
    logout() {
        this.currentUser = null;
        localStorage.removeItem('current_user');
        this.updateUI();
        this.showSuccess('Başarıyla çıkış yaptınız.');
    }

    // UI'yı güncelle
    updateUI() {
        const authContainer = document.getElementById('auth-container');
        const commentFormContainer = document.getElementById('comment-form-container');
        const userInfoContainer = document.getElementById('user-info-container');

        if (!authContainer) return;

        if (this.currentUser) {
            // Kullanıcı giriş yapmış
            authContainer.style.display = 'none';
            if (commentFormContainer) commentFormContainer.style.display = 'block';
            if (userInfoContainer) {
                userInfoContainer.style.display = 'block';
                userInfoContainer.innerHTML = `
                    <div class="user-info">
                        <span class="user-name">👤 ${this.currentUser.display_name || this.currentUser.username}</span>
                        <button class="logout-btn btn-secondary">Çıkış Yap</button>
                    </div>
                `;
            }
        } else {
            // Kullanıcı giriş yapmamış
            authContainer.style.display = 'block';
            if (commentFormContainer) commentFormContainer.style.display = 'none';
            if (userInfoContainer) userInfoContainer.style.display = 'none';
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
        const existingMessages = document.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());

        // Yeni mesaj oluştur
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.textContent = message;

        // Mesajı göster
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.appendChild(messageDiv);
        } else {
            // Auth container yoksa body'e ekle
            document.body.appendChild(messageDiv);
        }

        // 5 saniye sonra mesajı kaldır
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Mevcut kullanıcıyı al
    getCurrentUser() {
        return this.currentUser;
    }

    // Kullanıcının giriş yapıp yapmadığını kontrol et
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// Global auth instance oluştur
window.authSystem = new SimpleAuth();

console.log('Simple Auth system initialized');
