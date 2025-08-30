const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, '..', 'database', 'site.db');

// Veritabanı bağlantısı
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('SQLite veritabanına bağlandı');
        initDatabase();
    }
});

// Veritabanı tablolarını oluştur
function initDatabase() {
    const tables = [
        // Blog yazıları tablosu
        `CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            excerpt TEXT,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'genel',
            author TEXT DEFAULT 'Admin',
            status TEXT DEFAULT 'published',
            featured_image TEXT,
            meta_title TEXT,
            meta_description TEXT,
            meta_keywords TEXT,
            view_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Hizmetler tablosu
        `CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            icon TEXT,
            category TEXT DEFAULT 'genel',
            price_range TEXT,
            status TEXT DEFAULT 'active',
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Yorumlar tablosu
        `CREATE TABLE IF NOT EXISTS testimonials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            rating INTEGER DEFAULT 5,
            comment TEXT NOT NULL,
            service_type TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // İletişim mesajları tablosu
        `CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'unread',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Site ayarları tablosu
        `CREATE TABLE IF NOT EXISTS site_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT,
            setting_type TEXT DEFAULT 'text',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    tables.forEach(table => {
        db.run(table, (err) => {
            if (err) {
                console.error('Tablo oluşturma hatası:', err.message);
            }
        });
    });

    // Varsayılan ayarları ekle
    insertDefaultSettings();
}

// Varsayılan site ayarlarını ekle
function insertDefaultSettings() {
    const defaultSettings = [
        ['site_title', 'Elazığ Çilingir ve Anahtarcı', 'text', 'Site başlığı'],
        ['site_description', 'Elazığ çilingir, elazığ anahtarcı, acil kapı açma hizmetleri', 'text', 'Site açıklaması'],
        ['contact_phone', '+905432109949', 'text', 'İletişim telefonu'],
        ['contact_email', 'info@elazigcilingir.net', 'text', 'İletişim e-postası'],
        ['contact_address', 'Olgunlar mahallesi Şehit feyzi gürsu caddesi no 1 A, Elazığ', 'text', 'Adres'],
        ['working_hours', '7/24', 'text', 'Çalışma saatleri'],
        ['whatsapp_number', '+905432109949', 'text', 'WhatsApp numarası'],
        ['google_maps_url', 'https://maps.google.com/?q=38.6695,39.2058', 'text', 'Google Maps URL'],
        ['social_instagram', 'https://www.instagram.com/muratotoanahtar23', 'text', 'Instagram URL'],
        ['social_facebook', '', 'text', 'Facebook URL'],
        ['social_twitter', '', 'text', 'Twitter URL']
    ];

    defaultSettings.forEach(([key, value, type, description]) => {
        db.run(
            'INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
            [key, value, type, description]
        );
    });
}

// Blog CRUD işlemleri
const blogOperations = {
    // Tüm blog yazılarını getir
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM blog_posts ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // ID'ye göre blog yazısı getir
    getById: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM blog_posts WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Slug'a göre blog yazısı getir
    getBySlug: (slug) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM blog_posts WHERE slug = ? AND status = "published"', [slug], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Blog yazısı oluştur
    create: (data) => {
        return new Promise((resolve, reject) => {
            const { slug, title, excerpt, content, category, author, featured_image, meta_title, meta_description, meta_keywords } = data;
            db.run(
                'INSERT INTO blog_posts (slug, title, excerpt, content, category, author, featured_image, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [slug, title, excerpt, content, category, author, featured_image, meta_title, meta_description, meta_keywords],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },

    // Blog yazısı güncelle
    update: (id, data) => {
        return new Promise((resolve, reject) => {
            const { slug, title, excerpt, content, category, author, featured_image, meta_title, meta_description, meta_keywords, status } = data;
            db.run(
                'UPDATE blog_posts SET slug = ?, title = ?, excerpt = ?, content = ?, category = ?, author = ?, featured_image = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [slug, title, excerpt, content, category, author, featured_image, meta_title, meta_description, meta_keywords, status, id],
                function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    },

    // Blog yazısı sil
    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM blog_posts WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Görüntülenme sayısını artır
    incrementViewCount: (id) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

// Hizmetler CRUD işlemleri
const serviceOperations = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM services ORDER BY sort_order ASC, created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getById: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM services WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    create: (data) => {
        return new Promise((resolve, reject) => {
            const { title, description, image_url, icon, category, price_range, sort_order } = data;
            db.run(
                'INSERT INTO services (title, description, image_url, icon, category, price_range, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, description, image_url, icon, category, price_range, sort_order],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },

    update: (id, data) => {
        return new Promise((resolve, reject) => {
            const { title, description, image_url, icon, category, price_range, sort_order, status } = data;
            db.run(
                'UPDATE services SET title = ?, description = ?, image_url = ?, icon = ?, category = ?, price_range = ?, sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [title, description, image_url, icon, category, price_range, sort_order, status, id],
                function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    },

    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM services WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

// Yorumlar CRUD işlemleri
const testimonialOperations = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM testimonials ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getApproved: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM testimonials WHERE status = "approved" ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    create: (data) => {
        return new Promise((resolve, reject) => {
            const { name, email, phone, rating, comment, service_type } = data;
            db.run(
                'INSERT INTO testimonials (name, email, phone, rating, comment, service_type) VALUES (?, ?, ?, ?, ?, ?)',
                [name, email, phone, rating, comment, service_type],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },

    updateStatus: (id, status) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE testimonials SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM testimonials WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

// İletişim mesajları CRUD işlemleri
const contactOperations = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM contact_messages ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    create: (data) => {
        return new Promise((resolve, reject) => {
            const { name, email, phone, subject, message } = data;
            db.run(
                'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
                [name, email, phone, subject, message],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },

    updateStatus: (id, status) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE contact_messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM contact_messages WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

// Site ayarları işlemleri
const settingOperations = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM site_settings ORDER BY setting_key', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    get: (key) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT setting_value FROM site_settings WHERE setting_key = ?', [key], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.setting_value : null);
            });
        });
    },

    set: (key, value) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [key, value],
                function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    }
};

module.exports = {
    db,
    blogOperations,
    serviceOperations,
    testimonialOperations,
    contactOperations,
    settingOperations
};
