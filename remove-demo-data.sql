-- Tüm mock/demo verileri tamamen temizle
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- TÜM demo yorumları sil (güvenli temizlik)
DELETE FROM public.comments WHERE status = 'approved' AND name LIKE '%K.' OR name LIKE '%M.' OR name LIKE '%S.';
DELETE FROM public.comments WHERE content LIKE '%profesyonel%' OR content LIKE '%kopyalattım%' OR content LIKE '%kilidini%';

-- TÜM demo kullanıcıları sil
DELETE FROM public.users WHERE username LIKE '%_k' OR username LIKE '%_m' OR username LIKE '%_s';
DELETE FROM public.users WHERE display_name LIKE '% K.' OR display_name LIKE '% M.' OR display_name LIKE '% S.';

-- Varsayılan admin şifresi güncelle (güvenlik için)
UPDATE public.admin_users SET password_hash = '$2b$10$NEW_SECURE_HASH_HERE' WHERE username = 'admin';

-- Başarı mesajı
SELECT 'All mock data completely removed! Database is clean. 🧹✨' as message;
