# Elazığ Çilingir Sitesi - Kurulum Rehberi

## Proje Özeti

Bu proje, Elazığ Çilingir ve Anahtarcı işletmesi için geliştirilmiş modern bir web sitesidir. CMS admin panel, kullanıcı yorum sistemi ve Supabase entegrasyonu ile birlikte gelir.

## Yeni Özellikler

- ✅ **Mobil Kaydırma Sorunu Düzeltildi**: Hizmetler bölümü artık mobilde dokunmatik olarak kaydırılabilir
- ✅ **"Hemen Ara" Butonu**: Hero bölümünde sadece "Hemen Ara" yazan buton, numara gizli
- ✅ **Supabase CMS Sistemi**: Tam özellikli admin panel
- ✅ **Kullanıcı Yorum Sistemi**: Basit kullanıcı adı ile yorum yazma
- ✅ **Mock Yorumlar Kaldırıldı**: Gerçek kullanıcı yorumları sistemi aktif

## Kurulum Adımları

### 1. Supabase Projesi Oluşturma

1. [Supabase](https://supabase.com) sitesine gidin ve hesap oluşturun
2. Yeni proje oluşturun
3. Proje URL'si ve Anon Key'i alın

### 2. Veritabanı Kurulumu

1. Supabase dashboard'ında SQL Editor'a gidin
2. `config/database-schema.sql` dosyasındaki SQL kodunu çalıştırın
3. Bu işlem tablolar, indeksler ve güvenlik politikalarını oluşturacak

### 3. Supabase Konfigürasyonu

`config/supabase.js` dosyasını açın ve aşağıdaki değerleri güncelleyin:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Supabase proje URL'nizi girin
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Supabase Anon Key'inizi girin
```

### 4. Admin Panel Güvenliği

**ÖNEMLİ**: `admin/js/admin-auth.js` dosyasındaki admin şifresini değiştirin:

```javascript
this.adminCredentials = {
    username: 'admin',
    password: 'GÜÇLÜ_ŞİFRE_BURAYA' // Bu şifreyi mutlaka değiştirin!
};
```

### 5. Dosya Yükleme

Tüm dosyaları web hosting servisinize yükleyin. Dosya yapısı:

```
/
├── admin/
│   ├── css/
│   ├── js/
│   └── index.html
├── assets/
├── blog/
├── config/
├── css/
├── js/
├── vendor/
├── index.html
└── diğer dosyalar...
```

## Kullanım

### Normal Kullanıcılar

1. Ana sayfada "Yorumlar" bölümüne gidin
2. Kullanıcı adı oluşturun (en az 3 karakter)
3. Yorum yazın (en az 10 karakter)
4. Yorum admin onayından sonra görünür

### Admin Panel

1. `yoursite.com/admin/` adresine gidin
2. Kullanıcı adı: `admin`
3. Şifre: Yukarıda belirlediğiniz şifre

#### Admin Panel Özellikleri:

- **Ana Panel**: Genel istatistikler
- **Yorumlar**: Yorum onaylama/reddetme
- **Kullanıcılar**: Kullanıcı yönetimi
- **İletişim Mesajları**: Form mesajları (gelecekte eklenebilir)
- **Ayarlar**: Site ayarları

## Güvenlik Notları

1. **Admin Şifresini Değiştirin**: Varsayılan şifre güvenli değil
2. **HTTPS Kullanın**: Üretimde mutlaka SSL sertifikası kullanın
3. **Supabase RLS**: Row Level Security aktif, ek güvenlik sağlıyor
4. **Admin Klasörü**: Gerekirse `.htaccess` ile koruyun

## Özelleştirme

### Telefon Numarası Değiştirme

1. `index.html` dosyasında `tel:+905432109949` kısımlarını değiştirin
2. `config/database-schema.sql` dosyasındaki phone_number ayarını güncelleyin

### Renk Teması

CSS dosyalarındaki `:root` değişkenlerini değiştirerek siteyi özelleştirin:

```css
:root {
    --primary-color: #dc2626; /* Ana renk */
    --secondary-color: #6b7280; /* İkincil renk */
    /* ... diğer renkler */
}
```

### Logo ve Görsel Değiştirme

`assets/` klasöründeki görselleri kendi görsellerinizle değiştirin.

## Sorun Giderme

### Yorumlar Görünmüyor
- Supabase URL ve Key'lerin doğru olduğunu kontrol edin
- Browser console'da hata mesajlarını kontrol edin
- Supabase dashboard'ında veritabanı bağlantısını test edin

### Admin Panel'e Giriş Yapamıyorum
- Şifreyi doğru girdiğinizden emin olun
- Browser console'da JavaScript hatalarını kontrol edin
- Cache'i temizleyip sayfayı yenileyin

### Mobil Kaydırma Çalışmıyor
- JavaScript dosyalarının yüklendiğini kontrol edin
- Mobil tarayıcıda touch event'lerin desteklendiğini kontrol edin

## Teknik Destek

Herhangi bir sorunla karşılaştığınızda:

1. Browser console'da hata mesajlarını kontrol edin
2. Supabase dashboard'ında log'ları inceleyin
3. Dosya yollarının doğru olduğunu kontrol edin

## Lisans

Bu proje Elazığ Çilingir & Anahtarcı işletmesi için özel olarak geliştirilmiştir.
