class TestimonialsManager {
    constructor(api) {
        this.api = api;
        this.testimonialList = document.getElementById('testimonial-list');
        this.loadTestimonials();
    }

    async loadTestimonials() {
        const testimonials = await this.api.getTestimonials();
        this.renderTestimonialList(testimonials);
    }

    renderTestimonialList(testimonials) {
        this.testimonialList.innerHTML = '';
        testimonials.forEach(testimonial => {
            const testimonialItem = document.createElement('div');
            testimonialItem.innerHTML = `
                <h3>${testimonial.customer_name}</h3>
                <p>${testimonial.content}</p>
                <p>Rating: ${testimonial.rating}</p>
                <p>Status: ${testimonial.is_active ? 'Approved' : 'Pending'}</p>
                <button onclick="testimonialsManager.approveTestimonial('${testimonial.id}')" ${testimonial.is_active ? 'disabled' : ''}>Approve</button>
                <button onclick="testimonialsManager.deleteTestimonial('${testimonial.id}')">Delete</button>
            `;
            this.testimonialList.appendChild(testimonialItem);
        });
    }

    async approveTestimonial(id) {
        await this.api.updateTestimonial(id, { is_active: true });
        this.loadTestimonials();
    }

    async deleteTestimonial(id) {
        if (confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
            await this.api.deleteTestimonial(id);
            this.loadTestimonials();
        }
    }
}

const testimonialsManager = new TestimonialsManager(ElazigCilingirAPIClient);