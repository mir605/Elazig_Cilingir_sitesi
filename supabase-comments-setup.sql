-- Supabase Comments Table Setup - RLS Disabled Fix
-- Run this in your Supabase SQL editor to fix 401 errors

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    page_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add rating column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE comments ADD COLUMN rating INTEGER DEFAULT 5;
        ALTER TABLE comments ADD CONSTRAINT comments_rating_check 
        CHECK (rating >= 1 AND rating <= 5);
        RAISE NOTICE 'Rating column added successfully';
    ELSE
        RAISE NOTICE 'Rating column already exists';
    END IF;
END $$;

-- Step 3: Add parent_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE comments ADD COLUMN parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE;
        RAISE NOTICE 'Parent ID column added successfully';
    ELSE
        RAISE NOTICE 'Parent ID column already exists';
    END IF;
END $$;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_page_id ON comments(page_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_rating ON comments(rating);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Step 5: Update existing comments
UPDATE comments SET rating = 5 WHERE rating IS NULL;

-- Step 6: COMPLETELY DISABLE RLS - This fixes the 401 error
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Step 7: Drop all policies (not needed when RLS is disabled)
DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
DROP POLICY IF EXISTS "Anyone can update comments" ON comments;
DROP POLICY IF EXISTS "Anyone can delete comments" ON comments;
DROP POLICY IF EXISTS "Public insert access" ON comments;
DROP POLICY IF EXISTS "Public select approved comments" ON comments;
DROP POLICY IF EXISTS "Public update access" ON comments;
DROP POLICY IF EXISTS "Public delete access" ON comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON comments;
DROP POLICY IF EXISTS "Enable read access for all users" ON comments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON comments;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON comments;

-- Step 8: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create trigger
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Test insert (should work now)
INSERT INTO comments (page_id, nickname, content, rating, status) 
VALUES ('test-rls-fix', 'Test User', 'Test comment after RLS disable', 5, 'pending')
ON CONFLICT DO NOTHING;

-- Step 11: Verify test insert
SELECT COUNT(*) as test_comment_count FROM comments WHERE page_id = 'test-rls-fix';

-- Step 12: Clean up test data
DELETE FROM comments WHERE page_id = 'test-rls-fix';

-- Step 13: Show final status
SELECT 
    'RLS Status: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'comments' 
            AND rowsecurity = false
        ) THEN 'DISABLED (Good)'
        ELSE 'ENABLED (Problem)'
    END as rls_status;

-- Step 14: Show table structure
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Comments table setup completed! RLS disabled to fix 401 errors.' as status;
