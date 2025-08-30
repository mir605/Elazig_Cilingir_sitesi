
class CommentsManager {
    constructor(api) {
        this.api = api;
        this.commentList = document.getElementById('comment-list');
        this.loadComments();
    }

    async loadComments() {
        const comments = await this.api.getComments();
        this.renderCommentList(comments);
    }

    renderCommentList(comments) {
        this.commentList.innerHTML = '';
        comments.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.innerHTML = `
                <h3>${comment.name}</h3>
                <p>${comment.content}</p>
                <p>Status: ${comment.status}</p>
                <button onclick="commentsManager.approveComment('${comment.id}')" ${comment.status === 'approved' ? 'disabled' : ''}>Approve</button>
                <button onclick="commentsManager.deleteComment('${comment.id}')">Delete</button>
            `;
            this.commentList.appendChild(commentItem);
        });
    }

    async approveComment(id) {
        await this.api.updateComment(id, { status: 'approved' });
        this.loadComments();
    }

    async deleteComment(id) {
        if (confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
            await this.api.deleteComment(id);
            this.loadComments();
        }
    }
}

const commentsManager = new CommentsManager(ElazigCilingirAPIClient);
