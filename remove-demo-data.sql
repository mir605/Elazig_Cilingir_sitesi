-- Mock verileri temizle
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Demo yorumları sil
DELETE FROM public.comments WHERE name IN ('Ahmet K.', 'Elif M.', 'Mehmet S.');

-- Demo kullanıcıları sil
DELETE FROM public.users WHERE username IN ('ahmet_k', 'elif_m', 'mehmet_s');

-- Başarı mesajı
SELECT 'Mock data removed successfully! Now you have a clean database. 🧹' as message;
