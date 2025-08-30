// Supabase Configuration for Comment System
const SUPABASE_URL = 'https://zgpxnpkkfbsdnkitjhlb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncHhucGtrZmJzZG5raXRqaGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODkyMTMsImV4cCI6MjA3MTQ2NTIxM30.Tu-Xe0plnNvsz5QF7ZWTjf07p9ZXvsu9yo50iMyXBoo';

// Initialize Supabase client
let supabase;

// Wait for Supabase to be loaded
function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('Supabase client initialized with RLS disabled config');
        // Make it globally available after initialization
        window.supabaseClient = supabase;
    } else {
        console.error('Supabase client not available');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}

// Ensure Supabase client is ready
async function ensureSupabaseReady() {
    if (!supabase) {
        // Wait a bit and try to initialize again
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!supabase && typeof window !== 'undefined' && window.supabase) {
            initSupabase();
        }
        if (!supabase) {
            throw new Error('Supabase client not available');
        }
    }
    return supabase;
}

// Comment system functions
const CommentSystem = {
    // Submit a new comment
    async submitComment(pageId, nickname, content, rating = 5) {
        try {
            const client = await ensureSupabaseReady();
            
            // Validate input
            if (!pageId || !nickname || !content) {
                throw new Error('Missing required fields');
            }
            
            const commentData = {
                page_id: pageId,
                nickname: nickname.trim(),
                content: content.trim(),
                rating: parseInt(rating) || 5,
                status: 'pending'
            };
            
            console.log('Submitting comment:', commentData);
            
            const { data, error } = await client
                .from('comments')
                .insert(commentData)
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Comment submitted successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Error submitting comment:', error);
            return { 
                success: false, 
                error: error.message || 'Unknown error occurred' 
            };
        }
    },

    // Get approved comments for a page
    async getComments(pageId) {
        try {
            const client = await ensureSupabaseReady();
            
            if (!pageId) {
                throw new Error('Page ID is required');
            }
            
            console.log('Fetching comments for page:', pageId);
            
            const { data, error } = await client
                .from('comments')
                .select('*')
                .eq('page_id', pageId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Comments fetched successfully:', data?.length || 0, 'comments');
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return { 
                success: false, 
                error: error.message || 'Unknown error occurred' 
            };
        }
    },

    // Get all comments for admin panel
    async getAllComments() {
        try {
            const client = await ensureSupabaseReady();
            const { data, error } = await client
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching all comments:', error);
            return { success: false, error: error.message };
        }
    },

    // Update comment status (approve/reject)
    async updateCommentStatus(commentId, status) {
        try {
            const client = await ensureSupabaseReady();
            const { data, error } = await client
                .from('comments')
                .update({ 
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', commentId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating comment status:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete a comment
    async deleteComment(commentId) {
        try {
            const client = await ensureSupabaseReady();
            const { error } = await client
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting comment:', error);
            return { success: false, error: error.message };
        }
    },

    // Get comment statistics
    async getCommentStats() {
        try {
            const client = await ensureSupabaseReady();
            const { data, error } = await client
                .from('comments')
                .select('status');

            if (error) throw error;

            const stats = {
                total: data.length,
                pending: data.filter(c => c.status === 'pending').length,
                approved: data.filter(c => c.status === 'approved').length,
                rejected: data.filter(c => c.status === 'rejected').length
            };

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching comment stats:', error);
            return { success: false, error: error.message };
        }
    }
};

// Make CommentSystem globally available
window.CommentSystem = CommentSystem;
