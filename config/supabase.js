// Supabase Configuration
// Bu dosyayı production'da environment variables ile değiştirin

const SUPABASE_URL = 'https://zgpxnpkkfbsdnkitjhlb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncHhucGtrZmJzZG5raXRqaGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODkyMTMsImV4cCI6MjA3MTQ2NTIxM30.Tu-Xe0plnNvsz5QF7ZWTjf07p9ZXvsu9yo50iMyXBoo';

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
