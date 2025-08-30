class ContentManager {
    constructor(api) {
        this.api = api;
        this.contentList = document.getElementById('content-list');
        this.contentForm = document.getElementById('content-form');
        this.contentId = document.getElementById('content-id');
        this.contentSectionKey = document.getElementById('content-section-key');
        this.contentTitle = document.getElementById('content-title');
        this.contentContent = document.getElementById('content-content');

        this.contentForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.loadHomepageContent();
    }

    async loadHomepageContent() {
        const content = await this.api.getHomepageContent();
        this.renderContentList(content);
    }

    renderContentList(content) {
        this.contentList.innerHTML = '';
        content.forEach(item => {
            const contentItem = document.createElement('div');
            contentItem.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                <button onclick="contentManager.editContent('${item.id}')">Düzenle</button>
            `;
            this.contentList.appendChild(contentItem);
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const id = this.contentId.value;
        const content = {
            section_key: this.contentSectionKey.value,
            title: this.contentTitle.value,
            content: this.contentContent.value
        };

        if (id) {
            await this.api.updateHomepageContent(id, content);
        } else {
            await this.api.createHomepageContent(content);
        }

        this.contentForm.reset();
        this.loadHomepageContent();
    }

    async editContent(id) {
        const content = await this.api.getHomepageContentItem(id);
        this.contentId.value = content.id;
        this.contentSectionKey.value = content.section_key;
        this.contentTitle.value = content.title;
        this.contentContent.value = content.content;
    }
}

const contentManager = new ContentManager(ElazigCilingirAPIClient);