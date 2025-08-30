const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Database setup
const dbPath = path.join(__dirname, '..', 'database', 'site.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initDatabase() {
    return new Promise((resolve, reject) => {
        // Create comments table
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id TEXT NOT NULL,
            nickname TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating comments table:', err);
                reject(err);
            } else {
                console.log('Comments table created/verified');
                resolve();
            }
        });
    });
}

// Comment operations
const commentOperations = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM comments ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    
    getByPage: (pageId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM comments WHERE page_id = ? AND status = "approved" ORDER BY created_at DESC', [pageId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    
    create: (data) => {
        return new Promise((resolve, reject) => {
            const { pageId, nickname, content, ipAddress, userAgent } = data;
            db.run(
                'INSERT INTO comments (page_id, nickname, content, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
                [pageId, nickname, content, ipAddress, userAgent],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },
    
    updateStatus: (id, status) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id],
                function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    },
    
    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },
    
    getPendingCount: () => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM comments WHERE status = "pending"', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }
};

// Initialize database on startup
initDatabase().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer for file uploads
const upload = multer();

// Test endpoint
app.get('/admin/test-connection', (req, res) => {
    res.json({
        success: true,
        message: 'Node.js sunucusu çalışıyor',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        server_info: 'Express.js',
        current_dir: process.cwd(),
        script_dir: __dirname
    });
});

// Comment API endpoints
app.post('/api/comments', async (req, res) => {
    try {
        const { pageId, nickname, content } = req.body;
        
        if (!pageId || !nickname || !content) {
            return res.status(400).json({
                success: false,
                error: 'Sayfa ID, kullanıcı adı ve yorum içeriği gereklidir'
            });
        }
        
        if (nickname.length < 2 || nickname.length > 50) {
            return res.status(400).json({
                success: false,
                error: 'Kullanıcı adı 2-50 karakter arasında olmalıdır'
            });
        }
        
        if (content.length < 10 || content.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Yorum 10-1000 karakter arasında olmalıdır'
            });
        }
        
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        const result = await commentOperations.create({
            pageId,
            nickname,
            content,
            ipAddress,
            userAgent
        });
        
        res.json({
            success: true,
            message: 'Yorum başarıyla gönderildi ve onay bekliyor',
            commentId: result.id
        });
        
    } catch (error) {
        console.error('Comment creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Yorum gönderilirken hata oluştu'
        });
    }
});

app.get('/api/comments/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const comments = await commentOperations.getByPage(pageId);
        
        res.json({
            success: true,
            comments
        });
        
    } catch (error) {
        console.error('Comment fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Yorumlar yüklenirken hata oluştu'
        });
    }
});

// Admin comment management endpoints
app.get('/admin/comments', async (req, res) => {
    try {
        const comments = await commentOperations.getAll();
        const pendingCount = await commentOperations.getPendingCount();
        
        res.json({
            success: true,
            comments,
            pendingCount
        });
        
    } catch (error) {
        console.error('Admin comments fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Yorumlar yüklenirken hata oluştu'
        });
    }
});

app.put('/admin/comments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Geçersiz durum'
            });
        }
        
        const result = await commentOperations.updateStatus(id, status);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Yorum bulunamadı'
            });
        }
        
        res.json({
            success: true,
            message: 'Yorum durumu güncellendi'
        });
        
    } catch (error) {
        console.error('Comment status update error:', error);
        res.status(500).json({
            success: false,
            error: 'Yorum durumu güncellenirken hata oluştu'
        });
    }
});

app.delete('/admin/comments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await commentOperations.delete(id);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Yorum bulunamadı'
            });
        }
        
        res.json({
            success: true,
            message: 'Yorum silindi'
        });
        
    } catch (error) {
        console.error('Comment deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Yorum silinirken hata oluştu'
        });
    }
});

// Save blog endpoint
app.post('/admin/save-blog', upload.none(), async (req, res) => {
    try {
        console.log('Blog kaydetme işlemi başlatıldı:', new Date().toISOString());
        
        const { slug, title, excerpt, category, content, isUpdate } = req.body;
        
        if (!slug || !content) {
            return res.status(400).json({
                success: false,
                error: 'Slug ve içerik gereklidir'
            });
        }
        
        // Slug temizleme
        const cleanSlug = slug.replace(/[^a-z0-9\-]/g, '');
        if (!cleanSlug) {
            return res.status(400).json({
                success: false,
                error: 'Geçersiz slug'
            });
        }
        
        console.log('Slug:', cleanSlug);
        console.log('HTML içerik uzunluğu:', content.length);
        
        // Blog dizinini kontrol et ve oluştur
        const blogDir = path.join(__dirname, '..', 'blog');
        console.log('Blog dizini:', blogDir);
        
        try {
            await fs.access(blogDir);
        } catch {
            await fs.mkdir(blogDir, { recursive: true });
            console.log('Blog dizini oluşturuldu:', blogDir);
        }
        
        // Dosya yolu
        const filePath = path.join(blogDir, `${cleanSlug}.html`);
        console.log('Dosya yolu:', filePath);
        
        // HTML template
        const htmlTemplate = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Blog Başlığı'} - Elazığ Çilingir</title>
    <meta name="description" content="${excerpt || 'Blog açıklaması'}">
    <meta name="keywords" content="elazığ çilingir, anahtarcı, ${category || 'cilingir'}">
    
    <!-- CSS -->
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Preload fonts -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"></noscript>
</head>
<body>
    <!-- Header -->
    <header>
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <i class="fas fa-key"></i>
                    <span>ELAZIĞ ÇİLİNGİR & ANAHTARCI</span>
                </div>
                <nav>
                    <a href="../index.html">Ana Sayfa</a>
                    <a href="../index.html#services">Hizmetlerimiz</a>
                    <a href="../index.html#about">Hakkımızda</a>
                    <a href="../index.html#comments">Yorumlar</a>
                    <a href="../index.html#contact">İletişim</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main style="margin-top: 80px; padding: 2rem 0;">
        <div class="container">
            <article class="blog-container">
                <div class="blog-header">
                    <div class="blog-meta-info">
                        <span>${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>5 dk okuma</span>
                    </div>
                    <h1 class="blog-title">${title || 'Blog Başlığı'}</h1>
                    <p class="blog-lead">${excerpt || 'Blog açıklaması'}</p>
                </div>
                
                <div class="blog-content">
                    ${content}
                </div>
                
                <div class="blog-cta">
                    <h3>Güvenilir ve Profesyonel Anahtarcı Hizmeti</h3>
                    <p>7/24 hızlı ve güvenilir çilingir hizmeti için hemen arayın!</p>
                    <a href="tel:05432109949" class="blog-cta-btn">
                        <i class="fas fa-phone"></i>
                        0543 210 99 49
                    </a>
                </div>
                
                <div class="blog-navigation">
                    <a href="../index.html" class="blog-back-btn">
                        <i class="fas fa-arrow-left"></i>
                        Ana Sayfaya Dön
                    </a>
                    <a href="../blog.html" class="blog-back-btn">
                        <i class="fas fa-list"></i>
                        Blog Listesine Dön
                    </a>
                </div>
            </article>
        </div>
    </main>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Elazığ Çilingir</h3>
                    <p>7/24 güvenilir anahtarcı hizmeti</p>
                    <p>📞 0543 210 99 49</p>
                </div>
                <div class="footer-section">
                    <h3>Hizmetlerimiz</h3>
                    <ul>
                        <li>Ev anahtarı kopyalama</li>
                        <li>Araç anahtarı programlama</li>
                        <li>Kasa açma</li>
                        <li>Kilit değiştirme</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Elazığ Çilingir. Tüm hakları saklıdır.</p>
            </div>
        </div>
    </footer>

    <!-- WhatsApp Button -->
    <a href="https://wa.me/905432109949" class="whatsapp-btn">
        <svg class="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687z"/>
        </svg>
    </a>

    <!-- Scroll to Top Button -->
    <div class="scroll-up-btn">
        <span class="arrow-up-icon">↑</span>
    </div>

    <!-- Scripts -->
    <script src="../js/script.js"></script>
    
    <!-- Supabase -->
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    
    <!-- Universal Comment System -->
    <script src="../config/supabase.js"></script>
    <script src="../js/universal-comments.js"></script>
</body>
</html>`;
        
        // HTML dosyasını kaydet
        await fs.writeFile(filePath, htmlTemplate, 'utf8');
        console.log('Dosya başarıyla kaydedildi:', filePath);
        
        // blog.json dosyasını güncelle
        const blogJsonPath = path.join(blogDir, 'blog.json');
        let blogJsonData = { blogs: [] };
        
        try {
            const blogJsonContent = await fs.readFile(blogJsonPath, 'utf8');
            const existingData = JSON.parse(blogJsonContent);
            if (existingData && existingData.blogs) {
                blogJsonData = existingData;
            }
        } catch (error) {
            console.log('blog.json dosyası bulunamadı, yeni oluşturuluyor');
        }
        
        // Yeni blog verisi
        const newBlog = {
            id: Date.now(),
            title: title || 'Blog Başlığı',
            slug: cleanSlug,
            excerpt: excerpt || 'Blog açıklaması',
            description: excerpt || 'Blog açıklaması',
            date: new Date().toISOString().split('T')[0],
            created: new Date().toISOString(),
            category: category || 'cilingir',
            filename: `${cleanSlug}.html`
        };
        
        // Mevcut blogu güncelle veya yeni ekle
        let found = false;
        for (let i = 0; i < blogJsonData.blogs.length; i++) {
            if (blogJsonData.blogs[i].slug === cleanSlug) {
                blogJsonData.blogs[i] = { ...blogJsonData.blogs[i], ...newBlog };
                found = true;
                console.log('Mevcut blog güncellendi:', cleanSlug);
                break;
            }
        }
        
        if (!found) {
            blogJsonData.blogs.push(newBlog);
            console.log('Yeni blog eklendi:', cleanSlug);
        }
        
        // blog.json dosyasını kaydet
        await fs.writeFile(blogJsonPath, JSON.stringify(blogJsonData, null, 2), 'utf8');
        console.log('blog.json güncellendi:', blogJsonPath);
        
        // Başarılı yanıt
        const response = {
            success: true,
            message: 'Blog başarıyla kaydedildi ve blog.json güncellendi',
            filename: `${cleanSlug}.html`,
            size: content.length,
            blog_count: blogJsonData.blogs.length,
            file_path: filePath
        };
        
        console.log('Başarılı yanıt:', response);
        res.json(response);
        
    } catch (error) {
        console.error('Hata oluştu:', error.message);
        console.error('Hata detayı:', error.stack);
        
        res.status(500).json({
            success: false,
            error: error.message,
            debug_info: {
                post_data: req.body,
                current_dir: process.cwd(),
                script_dir: __dirname,
                blog_dir_exists: await fs.access(path.join(__dirname, '..', 'blog')).then(() => true).catch(() => false)
            }
        });
    }
});

// Static files
app.use(express.static(path.join(__dirname, '..')));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Node.js sunucusu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📁 Admin panel: http://localhost:${PORT}/admin/modern-admin.html`);
});
