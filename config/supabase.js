// Supabase Configuration
// Bu dosyayı production'da environment variables ile değiştirin

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Buraya Supabase URL'nizi girin
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Buraya Supabase Anon Key'inizi girin

// Supabase Client'ı başlat
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export edilebilir istemci
window.supabaseClient = supabaseClient;

// Database Tables
const TABLES = {
    COMMENTS: 'comments',
    USERS: 'users',
    ADMIN_SETTINGS: 'admin_settings'
};

// Comments sistemi için kullanılacak
const COMMENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

window.TABLES = TABLES;
window.COMMENT_STATUS = COMMENT_STATUS;

console.log('Supabase client initialized');
