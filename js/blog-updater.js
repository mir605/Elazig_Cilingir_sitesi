// Blog sayfası güncelleme sistemi
class BlogUpdater {
    constructor() {
        this.init();
    }

    init() {
        // Sayfa yüklenince mevcut güncellemeleri kontrol et
        this.checkForUpdates();
        
        // Storage event'lerini dinle
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('blog_')) {
                const slug = e.key.replace('blog_', '');
                this.updateCurrentPage(slug, e.newValue);
            }
        });
        
        // PostMessage event'lerini dinle
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'blog_updated') {
                this.updateCurrentPage(e.data.slug, e.data.htmlContent);
            }
        });
        
        console.log('🔄 Blog updater initialized');
    }

    // Sayfa yüklenince güncellemeleri kontrol et
    checkForUpdates() {
        try {
            const currentSlug = this.getCurrentBlogSlug();
            if (!currentSlug) return;

            const savedBlogs = JSON.parse(localStorage.getItem('updated_blogs') || '{}');
            if (savedBlogs[currentSlug]) {
                console.log('📝 Güncellenmiş blog içeriği bulundu:', currentSlug);
                this.updateCurrentPage(currentSlug, savedBlogs[currentSlug].htmlContent);
            }
        } catch (error) {
            console.warn('Blog güncelleme kontrolü başarısız:', error);
        }
    }

    // Mevcut blog slug'ını al
    getCurrentBlogSlug() {
        const path = window.location.pathname;
        const match = path.match(/\/blog\/([^\/]+)\.html/);
        return match ? match[1] : null;
    }

    // Mevcut sayfayı güncelle
    updateCurrentPage(slug, htmlContent) {
        const currentSlug = this.getCurrentBlogSlug();
        if (currentSlug !== slug) return;

        try {
            // HTML'den article içeriğini çıkar
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const newArticle = doc.querySelector('article');
            
            if (newArticle) {
                const currentArticle = document.querySelector('article');
                if (currentArticle) {
                    // Article içeriğini güncelle
                    currentArticle.innerHTML = newArticle.innerHTML;
                    console.log('✅ Blog içeriği güncellendi:', slug);
                    
                    // Başarı bildirimi göster
                    this.showUpdateNotification();
                }
            }
        } catch (error) {
            console.error('Blog güncelleme hatası:', error);
        }
    }

    // Güncelleme bildirimi göster
    showUpdateNotification() {
        // Mevcut bildirimi kaldır
        const existing = document.getElementById('blog-update-notification');
        if (existing) existing.remove();

        // Yeni bildirim oluştur
        const notification = document.createElement('div');
        notification.id = 'blog-update-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                animation: slideIn 0.3s ease-out;
            ">
                ✅ Blog güncellendi!
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // 3 saniye sonra kaldır
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
}

// Blog updater'ı başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BlogUpdater());
} else {
    new BlogUpdater();
}
