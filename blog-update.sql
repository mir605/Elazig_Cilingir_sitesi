-- Blog yorumları için comments tablosuna blog_url kolonu ekleyin
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS blog_url VARCHAR(500);

-- Blog URL'si için index oluştur
CREATE INDEX IF NOT EXISTS idx_comments_blog_url ON public.comments(blog_url);

-- Comments tablosu için yeni RLS policy (blog yorumları dahil)
DROP POLICY IF EXISTS "Allow public read of approved comments" ON public.comments;

CREATE POLICY "Allow public read of approved comments" ON public.comments
    FOR SELECT USING (status = 'approved');

-- Başarı mesajı
SELECT 'Blog comments support added successfully! 🎉' as message;
