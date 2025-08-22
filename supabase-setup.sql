-- Elazığ Çilingir CMS Database Schema
-- Bu SQL kodunu Supabase SQL Editor'da çalıştırın

-- UUID extension'ı etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLOSU (Yorumcular)
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. COMMENTS TABLOSU (Yorumlar)
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 20 AND LENGTH(content) <= 1000),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    blog_url VARCHAR(500), -- Blog sayfası URL'si (opsiyonel)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADMIN USERS TABLOSU
CREATE TABLE public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 4. SITE SETTINGS TABLOSU
CREATE TABLE public.site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CONTACT MESSAGES TABLOSU (İletişim formu mesajları)
CREATE TABLE public.contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Users tablosu RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Comments tablosu RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of approved comments" ON public.comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow insert for all users" ON public.comments
    FOR INSERT WITH CHECK (true);

-- Admin users tablosu RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users policy" ON public.admin_users
    FOR ALL USING (false); -- Sadece RPC fonksiyonlarıyla erişim

-- Site settings tablosu RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of settings" ON public.site_settings
    FOR SELECT USING (true);

-- Contact messages tablosu RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- INDEXES (Performans için)
CREATE INDEX idx_comments_status ON public.comments(status);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX idx_comments_rating ON public.comments(rating);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- VARSAYILAN AYARLAR EKLE
INSERT INTO public.site_settings (setting_key, setting_value, description) VALUES
('site_name', 'Elazığ Çilingir', 'Site başlığı'),
('contact_email', 'info@elazigcilingir.net', 'İletişim e-posta adresi'),
('contact_phone', '0543 210 99 49', 'İletişim telefon numarası'),
('comments_auto_approve', 'false', 'Yorumları otomatik onayla'),
('maintenance_mode', 'false', 'Bakım modu');

-- VARSAYILAN ADMIN KULLANICI EKLE (ŞİFRE: admin123)
INSERT INTO public.admin_users (username, password_hash, email) VALUES
('admin', '$2b$10$rN9aHDhR7xOGxr2JvKQzoeKq1GGMd8sU4mxnKFYhI3wqKCKCK3L3i', 'admin@elazigcilingir.net');

-- DEMO YORUMLAR EKLE
INSERT INTO public.users (username, display_name) VALUES
('ahmet_k', 'Ahmet K.'),
('elif_m', 'Elif M.'),
('mehmet_s', 'Mehmet S.');

INSERT INTO public.comments (user_id, name, rating, content, status, created_at) VALUES
((SELECT id FROM public.users WHERE username = 'ahmet_k'), 'Ahmet K.', 5, 'Gece yarısı kapıda kaldığımda hemen gelip yardımcı oldular. Çok hızlı ve profesyonel hizmet. Kesinlikle tavsiye ederim.', 'approved', NOW() - INTERVAL '7 days'),
((SELECT id FROM public.users WHERE username = 'elif_m'), 'Elif M.', 5, 'Arabamın anahtarını kopyalattım. Hem uygun fiyat hem de kaliteli iş. Çok memnun kaldım.', 'approved', NOW() - INTERVAL '3 days'),
((SELECT id FROM public.users WHERE username = 'mehmet_s'), 'Mehmet S.', 4, 'İş yerimin kilidini değiştirdiler. Titiz ve güvenilir çalışma. Teşekkürler.', 'approved', NOW() - INTERVAL '1 day');

-- BAŞARI MESAJI
SELECT 'Database schema created successfully! 🎉' as message;
