-- Elazığ Çilingir Sitesi Veritabanı Şeması
-- Bu dosyayı Supabase Dashboard SQL Editor'da çalıştırın

-- 1. Users tablosu (Kullanıcı yorumları için)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Comments tablosu (Site yorumları)
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    page_url VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID
);

-- 3. Admin Settings tablosu
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Contact Messages tablosu (İletişim formu mesajları)
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes oluştur
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_username ON comments(username);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Row Level Security (RLS) politikaları
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Users tablosu politikaları
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Comments tablosu politikaları
CREATE POLICY "Anyone can view approved comments" ON comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own comments" ON comments FOR SELECT USING (true);

-- Admin settings sadece admin tarafından görülebilir (şimdilik herkese açık)
CREATE POLICY "Admin settings public read" ON admin_settings FOR SELECT USING (true);

-- Contact messages sadece admin tarafından görülebilir
CREATE POLICY "Contact messages insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- Trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger'ları
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Başlangıç admin ayarları
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('site_title', 'Elazığ Çilingir & Anahtarcı', 'Site başlığı'),
('admin_email', 'admin@elazigcilingir.net', 'Admin e-posta adresi'),
('comments_auto_approve', 'false', 'Yorumların otomatik onaylanması'),
('phone_number', '+905432109949', 'İşletme telefon numarası'),
('business_address', 'Olgunlar mahallesi Şehit feyzi gürsu caddesi no 1 A, Elazığ', 'İşletme adresi')
ON CONFLICT (setting_key) DO NOTHING;

-- Test kullanıcısı (isteğe bağlı)
INSERT INTO users (username, display_name, email) VALUES
('test_kullanici', 'Test Kullanıcı', 'test@example.com')
ON CONFLICT (username) DO NOTHING;

-- Test yorumu (isteğe bağlı)
INSERT INTO comments (user_id, username, content, status) VALUES
((SELECT id FROM users WHERE username = 'test_kullanici'), 'test_kullanici', 'Bu bir test yorumudur. Hizmetiniz çok memnun kaldım!', 'approved')
ON CONFLICT DO NOTHING;
