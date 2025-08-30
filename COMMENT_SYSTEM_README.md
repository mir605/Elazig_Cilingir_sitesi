# Merkezi Yorum Sistemi

Bu proje, tüm sayfalarda kullanılan yorum sistemini tek bir yerden yönetmek için oluşturulmuş merkezi bir çözümdür.

## 📁 Dosya Yapısı

```
js/
├── comment-system-config.js      # Yapılandırma dosyası
├── comment-system-manager.js     # Ana yorum sistemi yöneticisi
└── supabase-comments.js          # Eski sistem (artık kullanılmıyor)

admin/
├── js/
│   ├── admin-comment-manager.js  # Admin panel yorum yönetimi
│   └── admin.js                  # Ana admin panel
└── index.html                    # Admin panel arayüzü

config/
└── supabase.js                   # Eski Supabase yapılandırması (artık kullanılmıyor)
```

## 🔧 Kurulum

### 1. Yapılandırma Dosyası
`js/comment-system-config.js` dosyasında tüm ayarları yapabilirsiniz:

```javascript
window.COMMENT_SYSTEM_CONFIG = {
    supabase: {
        url: 'YOUR_SUPABASE_URL',
        key: 'YOUR_SUPABASE_KEY'
    },
    comments: {
        maxLength: 1000,
        minLength: 10,
        autoApprove: false,
        enableRating: true
    },
    // ... diğer ayarlar
};
```

### 2. Sayfa Entegrasyonu
Her sayfada yorum sistemi kullanmak için:

```html
<!-- Gerekli script'ler -->
<script src="js/comment-system-config.js"></script>
<script src="js/comment-system-manager.js"></script>

<!-- Yorum container'ı -->
<div id="comments-container" data-supabase-comment-system data-page-id="/sayfa-yolu"></div>
```

## 🚀 Kullanım

### Otomatik Başlatma
Yorum sistemi otomatik olarak `data-supabase-comment-system` attribute'u olan elementleri bulur ve başlatır.

### Manuel Başlatma
```javascript
// Tek bir container için
const commentSystem = window.initSupabaseCommentSystem('container-id', 'page-id', options);

// Merkezi yöneticiye erişim
window.commentSystemManager.updateConfig({ autoApprove: true });
```

## 📊 Admin Panel

Admin panelinde yorum yönetimi için:

1. `admin/index.html` sayfasına gidin
2. "Yorumlar" sekmesini kullanın
3. Yorumları onaylayın, reddedin veya silin

### Admin Panel Özellikleri
- Yorum listesi görüntüleme
- Durum filtreleme (Bekleyen, Onaylanan, Reddedilen)
- Toplu işlemler
- Yorum detayı görüntüleme
- İstatistikler

## ⚙️ Yapılandırma Seçenekleri

### Yorum Ayarları
```javascript
comments: {
    maxLength: 1000,           // Maksimum karakter sayısı
    minLength: 10,             // Minimum karakter sayısı
    autoApprove: false,        // Otomatik onay
    enableRating: true,        // Puanlama sistemi
    enableModeration: true,    // Moderation sistemi
    maxCommentsPerPage: 50     // Sayfa başına yorum sayısı
}
```

### Güvenlik Ayarları
```javascript
security: {
    enableCaptcha: false,      // CAPTCHA
    enableRateLimit: true,     // Hız sınırı
    maxCommentsPerHour: 5,     // Saat başına maksimum yorum
    enableSpamProtection: true, // Spam koruması
    blockedWords: ['spam', 'reklam'] // Yasaklı kelimeler
}
```

### UI Ayarları
```javascript
ui: {
    theme: 'default',          // Tema
    language: 'tr',            // Dil
    showCharacterCount: true,  // Karakter sayacı
    showRating: true,          // Puanlama gösterimi
    enableRichText: false,     // Zengin metin
    enableAttachments: false   // Dosya ekleme
}
```

## 🔄 API Fonksiyonları

### Yorum Gönderme
```javascript
const result = await window.CommentSystem.submitComment(pageId, nickname, content, rating);
```

### Yorumları Getirme
```javascript
const result = await window.CommentSystem.getComments(pageId);
```

### Tüm Yorumları Getirme (Admin)
```javascript
const result = await window.CommentSystem.getAllComments();
```

### Yorum Durumu Güncelleme
```javascript
const result = await window.CommentSystem.updateCommentStatus(commentId, 'approved');
```

### Yorum Silme
```javascript
const result = await window.CommentSystem.deleteComment(commentId);
```

### İstatistikleri Getirme
```javascript
const result = await window.CommentSystem.getCommentStats();
```

## 🎨 Özelleştirme

### CSS Sınıfları
```css
.comments-section          /* Ana yorum bölümü */
.comment-form-card         /* Yorum formu kartı */
.comment-item              /* Tek yorum */
.comment-header            /* Yorum başlığı */
.comment-content           /* Yorum içeriği */
.comment-rating            /* Puanlama */
.status-badge              /* Durum rozeti */
```

### Tema Değişiklikleri
`comment-system-config.js` dosyasında `ui.theme` ayarını değiştirerek farklı temalar kullanabilirsiniz.

## 🔧 Sorun Giderme

### Yaygın Sorunlar

1. **Yorumlar yüklenmiyor**
   - Supabase bağlantısını kontrol edin
   - Console'da hata mesajlarını kontrol edin

2. **Admin panelinde yorumlar görünmüyor**
   - Admin authentication'ını kontrol edin
   - Supabase RLS (Row Level Security) ayarlarını kontrol edin

3. **Yorum gönderilemiyor**
   - Form validation'ını kontrol edin
   - Rate limit ayarlarını kontrol edin

### Debug Modu
```javascript
// Debug modunu aktifleştirin
window.commentSystemManager.updateConfig({ debug: true });
```

## 📈 Performans

### Optimizasyonlar
- Lazy loading yorumlar
- Pagination desteği
- Caching mekanizması
- Debounced input handling

### Monitoring
```javascript
// Performans metriklerini izleyin
window.commentSystemManager.getPerformanceMetrics();
```

## 🔒 Güvenlik

### Güvenlik Özellikleri
- XSS koruması
- SQL injection koruması
- Rate limiting
- Spam koruması
- Input validation

### Güvenlik Ayarları
```javascript
security: {
    enableCaptcha: true,
    enableRateLimit: true,
    maxCommentsPerHour: 3,
    enableSpamProtection: true,
    blockedWords: ['spam', 'reklam', 'kumar']
}
```

## 📝 Güncelleme Geçmişi

### v2.0.0 (Mevcut)
- Merkezi yorum sistemi
- Admin panel entegrasyonu
- Yapılandırılabilir ayarlar
- Güvenlik iyileştirmeleri

### v1.0.0 (Eski)
- Temel yorum sistemi
- Supabase entegrasyonu

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Destek

Sorunlarınız için:
- GitHub Issues kullanın
- Email: support@example.com
- Dokümantasyon: [Wiki](https://github.com/username/repo/wiki)
