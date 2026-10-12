// Production Grade Main JS - LegalVerifier

document.addEventListener('DOMContentLoaded', function () {
    // Automatically load includes if element placeholders exist
    loadInclude('header-placeholder', 'includes/header.html');
    loadInclude('footer-placeholder', 'includes/footer.html');
    loadInclude('modal-placeholder', 'includes/lead-modal.html');

    // Initialize iOS-Style Stacked Notification Carousel
    initIosNotificationStack();
});

// iOS-Style Stacked Notification Carousel (Bottom-Peeking Swipe-Up)
function initIosNotificationStack() {
    const stack = document.querySelector('.ios-notify-stack');
    if (!stack) return;

    const cards = Array.from(stack.querySelectorAll('.ios-notify-card'));
    if (cards.length === 0) return;

    let activeIndex = 0;
    let timer = null;
    let isTransitioning = false;

    function applyPositions() {
        cards.forEach((card, i) => {
            const pos = (i - activeIndex + cards.length) % cards.length;
            card.setAttribute('data-pos', pos);
        });
    }

    function swipeUp(targetIndex) {
        if (isTransitioning) return;
        isTransitioning = true;

        const currentActive = cards[activeIndex];
        const nextIndex = typeof targetIndex === 'number' ? targetIndex : (activeIndex + 1) % cards.length;

        // 1. Swipe current active card up and out
        currentActive.setAttribute('data-pos', 'exiting');

        // 2. Advance all other cards forward and upward
        cards.forEach((card, i) => {
            if (i === activeIndex) return;
            const newPos = (i - nextIndex + cards.length) % cards.length;
            card.setAttribute('data-pos', newPos);
        });

        // 3. After exit transition finishes, reset the exited card to the bottom buffer
        setTimeout(() => {
            currentActive.style.transition = 'none';
            currentActive.setAttribute('data-pos', '3');
            void currentActive.offsetWidth; // Force reflow
            currentActive.style.transition = '';
            activeIndex = nextIndex;
            isTransitioning = false;
        }, 650);
    }

    function startTimer() {
        stopTimer();
        timer = setInterval(() => swipeUp(), 3800);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    stack.addEventListener('mouseenter', stopTimer);
    stack.addEventListener('mouseleave', startTimer);

    // Clicking any peek card brings it forward immediately with swipe-up motion
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (index === activeIndex || isTransitioning) return;
            swipeUp(index);
        });
    });

    applyPositions();
    startTimer();
}

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
