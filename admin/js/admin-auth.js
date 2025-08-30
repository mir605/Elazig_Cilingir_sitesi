// Admin Authentication System
// Basit admin giriş sistemi

class AdminAuth {
    constructor() {
        this.isAuthenticated = false;
        this.adminCredentials = {
            // Bu bilgileri production'da environment variables'dan alın
            username: 'MuratOto',
            password: 'MuratOto2312' // Bu şifreyi mutlaka değiştirin!
        };
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupLoginForm();
    }

    // Kimlik doğrulama kontrolü
    checkAuthentication() {
        const savedAuth = localStorage.getItem('admin_authenticated');
        const authTime = localStorage.getItem('admin_auth_time');
        
        if (savedAuth === 'true' && authTime) {
            const timeDiff = Date.now() - parseInt(authTime);
            const eightHours = 8 * 60 * 60 * 1000; // 8 saat
            
            if (timeDiff < eightHours) {
                this.isAuthenticated = true;
                this.showAdminPanel();
                return;
            } else {
                // Oturum süresi dolmuş
                this.logout();
            }
        }
        
        this.showLoginForm();
    }

    // Login formu göster
    showLoginForm() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <div class="login-header">
                        <h1>🔑 Admin Panel</h1>
                        <p>Elazığ Çilingir Yönetim Paneli</p>
                    </div>
                    
                    <form id="admin-login-form">
                        <div class="form-group">
                            <label for="admin-username">Kullanıcı Adı</label>
                            <input type="text" id="admin-username" name="username" required 
                                   class="form-input" placeholder="Admin kullanıcı adı">
                        </div>
                        
                        <div class="form-group">
                            <label for="admin-password">Şifre</label>
                            <input type="password" id="admin-password" name="password" required 
                                   class="form-input" placeholder="Admin şifresi">
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary btn-full">
                                <i class="fas fa-sign-in-alt"></i>
                                Giriş Yap
                            </button>
                        </div>
                        
                        <div id="login-message" class="login-message"></div>
                    </form>
                    
                    <div class="login-footer">
                        <p>Güvenlik nedeniyle oturum 8 saat sonra otomatik olarak kapanır.</p>
                    </div>
                </div>
            </div>

            <style>
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2rem;
                }

                .login-form {
                    background: white;
                    padding: 3rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    width: 100%;
                    max-width: 400px;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .login-header h1 {
                    color: var(--primary-color);
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .login-header p {
                    color: var(--text-light);
                    font-size: 0.9rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: var(--dark-color);
                }

                .form-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }

                .form-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
                }

                .btn-full {
                    width: 100%;
                    padding: 1rem;
                    font-size: 1rem;
                }

                .login-message {
                    padding: 0.75rem;
                    border-radius: 6px;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    text-align: center;
                    display: none;
                }

                .login-message.error {
                    background-color: #fee2e2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                    display: block;
                }

                .login-message.success {
                    background-color: #d1fae5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                    display: block;
                }

                .login-footer {
                    margin-top: 2rem;
                    text-align: center;
                }

                .login-footer p {
                    font-size: 0.8rem;
                    color: var(--text-light);
                }

                @media (max-width: 480px) {
                    .login-container {
                        padding: 1rem;
                    }
                    
                    .login-form {
                        padding: 2rem;
                    }
                }
            </style>
        `;
    }

    // Login form event listener
    setupLoginForm() {
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'admin-login-form') {
                e.preventDefault();
                this.handleLogin(e.target);
            }
        });
    }

    // Login işlemi
    async handleLogin(form) {
        const formData = new FormData(form);
        const username = formData.get('username').trim();
        const password = formData.get('password').trim();

        // Basic validation
        if (!username || !password) {
            this.showLoginMessage('Kullanıcı adı ve şifre gereklidir.', 'error');
            return;
        }

        // Check credentials
        if (username === this.adminCredentials.username && 
            password === this.adminCredentials.password) {
            
            // Başarılı giriş
            this.isAuthenticated = true;
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_auth_time', Date.now().toString());
            
            this.showLoginMessage('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
            
            setTimeout(() => {
                location.reload(); // Sayfayı yenile ve admin panelini göster
            }, 1500);
            
        } else {
            this.showLoginMessage('Geçersiz kullanıcı adı veya şifre!', 'error');
        }
    }

    // Login mesajı göster
    showLoginMessage(message, type) {
        const messageElement = document.getElementById('login-message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `login-message ${type}`;
        }

        // 5 saniye sonra mesajı temizle
        setTimeout(() => {
            if (messageElement) {
                messageElement.style.display = 'none';
            }
        }, 5000);
    }

    // Admin paneli göster
    showAdminPanel() {
        // Ana admin panel HTML'i yüklensin
        // Bu fonksiyon admin.js tarafından override edilecek
        console.log('Admin authenticated, loading panel...');
    }

    // Çıkış yap
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_auth_time');
        location.reload();
    }

    // Kimlik doğrulama durumunu kontrol et
    isAuth() {
        return this.isAuthenticated;
    }

    // Oturum süresini kontrol et
    checkSessionTimeout() {
        const authTime = localStorage.getItem('admin_auth_time');
        if (authTime) {
            const timeDiff = Date.now() - parseInt(authTime);
            const eightHours = 8 * 60 * 60 * 1000;
            
            if (timeDiff >= eightHours) {
                this.logout();
                return false;
            }
        }
        return true;
    }

    // Oturum süresini uzat
    extendSession() {
        if (this.isAuthenticated) {
            localStorage.setItem('admin_auth_time', Date.now().toString());
        }
    }
}

// Global admin auth instance
window.adminAuth = new AdminAuth();

// Sayfa aktivitesinde oturumu uzat
document.addEventListener('click', () => {
    if (window.adminAuth && window.adminAuth.isAuth()) {
        window.adminAuth.extendSession();
    }
});

document.addEventListener('keypress', () => {
    if (window.adminAuth && window.adminAuth.isAuth()) {
        window.adminAuth.extendSession();
    }
});

// Her 5 dakikada bir oturum kontrolü yap
setInterval(() => {
    if (window.adminAuth && window.adminAuth.isAuth()) {
        window.adminAuth.checkSessionTimeout();
    }
}, 5 * 60 * 1000);

console.log('Admin auth system initialized');
