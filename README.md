# Elazığ Çilingir - Modern Web Sitesi

Modern, performanslı ve mobil uyumlu Elazığ Çilingir web sitesi. Bu proje, son teknoloji web standartları kullanılarak optimize edilmiştir.

## 🚀 PageSpeed Insights Optimizasyonları

### Uygulandı ✅
- **LCP Optimizasyonu**: Kritik CSS inline, hero content optimized
- **Font Loading**: Preload + font-display: swap
- **Image Optimization**: WebP format, lazy loading, decoding="async"
- **Video Optimization**: preload="metadata", lazy autoplay
- **Render Blocking**: Non-critical CSS deferred
- **Critical Path**: CSS imports removed, inlined critical styles

### Önerilir 📋
1. **Video Sıkıştırma**: `intro-video.mp4` (6.3MB) → max 2MB'a düşürülmeli
2. **Image Resize**: `anahtar.webp` (61KB) → max 30KB'a optimize edilmeli
3. **Font Awesome**: Sadece kullanılan iconlar subset olarak yüklenmeli
4. **Service Worker**: Daha agresif caching stratejileri

## 📊 Hedef Performans Metrikleri

- **LCP**: < 2.5s (Şu an: 4.29s)
- **FID**: < 100ms
- **CLS**: < 0.1
- **FCP**: < 1.8s
- **SI**: < 3.4s
- **TBT**: < 200ms

## 🚀 Performans Özellikleri

- **Core Web Vitals Optimized**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Modern CSS**: CSS Grid, Flexbox, CSS Custom Properties (Variables)
- **Responsive Design**: Tüm cihazlarda mükemmel görünüm
- **Progressive Web App (PWA)**: Offline kullanım ve uygulama gibi deneyim
- **Service Worker**: Gelişmiş caching stratejileri
- **Modern JavaScript**: ES6+, async/await, performance optimizations

## 📱 Özellikler

- 7/24 Elazığ Çilingir Hizmeti
- Acil Elazığ Çilingir
- Elazığ Oto Çilingir
- Anahtar Kopyalama
- Elazığ Kilit Değiştirme
- WhatsApp İletişim
- Harita Entegrasyonu
- Müşteri Yorumları

## 🛠️ Teknik Detaylar

### HTML
- Semantik HTML5 etiketleri
- SEO optimizasyonu
- Open Graph ve Twitter Card meta etiketleri
- Structured Data (Schema.org)
- Accessibility (ARIA) desteği

### CSS
- Modern CSS Grid ve Flexbox layout
- CSS Custom Properties (Variables)
- Mobile-first responsive design
- `clamp()` fonksiyonu ile fluid typography
- Performance optimized animations
- Print styles

### JavaScript
- Modern ES6+ syntax
- Passive event listeners
- Intersection Observer API
- Throttle/Debounce optimizations
- Lazy loading
- Error handling

### PWA Özellikleri
- Web App Manifest
- Service Worker
- Offline functionality
- App shortcuts
- Push notifications ready

## 📊 Performans Optimizasyonları

### Görseller
- **WebP formatı** kullanılmalı (mevcut JPEG/PNG dosyaları convert edilmeli)
- `loading="lazy"` attribute'ları eklendi
- Responsive images için `srcset` kullanımı önerilir
- Maksimum dosya boyutu: 200-300KB

### Fontlar
- Modern font stack: Inter, System UI, Segoe UI
- Font-display: swap
- Preload critical fonts
- Fallback fonts

### JavaScript
- Deferred loading
- Code splitting
- Minification önerilir
- Tree shaking

### CSS
- Critical CSS inlined
- Non-critical CSS lazy loaded
- CSS minification önerilir
- Unused CSS removal

## 🖼️ Görsel Optimizasyon Talimatları

Mevcut görselleri WebP formatına çevirmek için:

```bash
# ImageMagick kullanarak
convert input.jpg -quality 80 output.webp

# cwebp kullanarak
cwebp -q 80 input.jpg -o output.webp
```

### ✅ WebP Dosyaları (Tamamlandı)
- ✅ `anahtar.webp`
- ✅ `kapi.webp`
- ✅ `yedek-anahtar.webp`
- ✅ `WhatsApp Image 2025-05-28 at 19.32.34.webp` (immobilizer anahtar)
- ✅ `WhatsApp Image 2025-05-28 at 19.32.35.webp` (kepenk kumandası)
- ✅ `WhatsApp Image 2025-05-28 at 19.32.34 (1).webp` (kilit değiştirme)
- ✅ `icon-192x192.png`
- ✅ `icon-512x512.png`
- ✅ `hero-bg.webp`
- ✅ `cilingir-ekipman.webp`

## 🎥 Video Optimizasyon

Video dosyasını optimize etmek için:

```bash
# FFmpeg kullanarak
ffmpeg -i intro-video.mp4 -c:v libx264 -crf 23 -maxrate 1M -bufsize 2M -vf scale=1280:720 -c:a aac -b:a 128k intro-video-optimized.mp4
```

## 🚀 Deployment

### Production Checklist
- [x] Görseller WebP formatına çevrildi
- [x] Video güncellendiwebP dosyaları entegre edildi
- [x] Anahtar kelimeler optimize edildi (elazığ çilingir, elazığ anahtarcı)
- [x] Brand highlighting eklendi
- [x] Mobile responsive düzenlemeler yapıldı
- [x] Service Worker eklendi
- [x] PWA manifest oluşturuldu
- [ ] CSS/JS minify edildi (production için)
- [ ] Gzip compression aktif
- [ ] CDN kullanımı
- [ ] SSL sertifikası kuruldu
- [ ] Sitemap Google'a gönderildi

### Performance Monitoring
- Google PageSpeed Insights
- GTmetrix
- WebPageTest
- Lighthouse CI

## 📱 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Chrome
- Mobile Safari

## 🔧 Geliştirme

### Yerel Geliştirme
```bash
# HTTP server başlat
python -m http.server 8000
# veya
npx serve .
```

### Test
- Mobile responsiveness test
- Performance test
- Accessibility test
- Cross-browser test

## 📞 İletişim

**Elazığ Çilingir**
- Telefon: 0543 210 99 49
- Adres: Olgunlar mahallesi Şehit feyzi gürsu caddesi no 1 A Elazığ Merkez
- Instagram: @muratotoanahtar23

## 📄 Lisans

Bu proje Elazığ Çilingir için özel olarak geliştirilmiştir.

---

*Modern web teknolojileri ile geliştirilmiş, performans odaklı web sitesi.* 