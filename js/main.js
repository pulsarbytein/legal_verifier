// Production Grade Main JS - LegalVerifier

document.addEventListener('DOMContentLoaded', function () {
    // Automatically load includes if element placeholders exist
    loadInclude('header-placeholder', 'includes/header.html');
    loadInclude('footer-placeholder', 'includes/footer.html');
    loadInclude('modal-placeholder', 'includes/lead-modal.html');
});

// Helper function to dynamically load static includes if viewing offline/locally
function loadInclude(elementId, filepath) {
    const element = document.getElementById(elementId);
    if (element) {
        fetch(filepath)
            .then(response => {
                if (response.ok) return response.text();
                throw new Error('Include file not found');
            })
            .then(html => {
                element.innerHTML = html;
            })
            .catch(err => {
                // If local file fetch is blocked by CORS in browser, silence error (PHP will handle server-side include)
                console.log('Static include fetch note:', err.message);
            });
    }
}

// Global Form Submission Handler
function handleFormSubmit(event) {
    event.preventDefault();

    // Hide modal if active
    const modalElement = document.getElementById('consultationModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }

    // Show success alert
    alert('Thank you! Your request has been received. A LegalVerifier expert will contact you shortly.');
}
