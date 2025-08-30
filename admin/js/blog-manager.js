
class EnhancedBlogManager {
    constructor(api) {
        this.api = api;
        this.blogList = document.getElementById('blog-list');
        this.blogForm = document.getElementById('blog-form');
        this.blogId = document.getElementById('blog-id');
        this.blogTitle = document.getElementById('blog-title');
        this.blogSlug = document.getElementById('blog-slug');
        this.blogExcerpt = document.getElementById('blog-excerpt');
        this.blogContent = document.getElementById('blog-content');
        this.blogCategory = document.getElementById('blog-category');
        this.blogFeaturedImageUrl = document.getElementById('blog-featured-image-url');

        this.blogForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.loadBlogs();
    }

    async loadBlogs() {
        const blogs = await this.api.getBlogPosts();
        this.renderBlogList(blogs);
    }

    renderBlogList(blogs) {
        this.blogList.innerHTML = '';
        blogs.forEach(blog => {
            const blogItem = document.createElement('div');
            blogItem.innerHTML = `
                <h3>${blog.title}</h3>
                <p>${blog.excerpt}</p>
                <button onclick="blogManager.editBlog('${blog.id}')">Düzenle</button>
                <button onclick="blogManager.deleteBlog('${blog.id}')">Sil</button>
            `;
            this.blogList.appendChild(blogItem);
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const id = this.blogId.value;
        const post = {
            title: this.blogTitle.value,
            slug: this.blogSlug.value,
            excerpt: this.blogExcerpt.value,
            content: this.blogContent.value,
            category: this.blogCategory.value,
            featured_image_url: this.blogFeaturedImageUrl.value
        };

        if (id) {
            await this.api.updateBlogPost(id, post);
        } else {
            await this.api.createBlogPost(post);
        }

        this.blogForm.reset();
        this.loadBlogs();
    }

    async editBlog(id) {
        const blog = await this.api.getBlogPost(id);
        this.blogId.value = blog.id;
        this.blogTitle.value = blog.title;
        this.blogSlug.value = blog.slug;
        this.blogExcerpt.value = blog.excerpt;
        this.blogContent.value = blog.content;
        this.blogCategory.value = blog.category;
        this.blogFeaturedImageUrl.value = blog.featured_image_url;
    }

    async deleteBlog(id) {
        if (confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
            await this.api.deleteBlogPost(id);
            this.loadBlogs();
        }
    }
}

const blogManager = new EnhancedBlogManager(ElazigCilingirAPIClient);
