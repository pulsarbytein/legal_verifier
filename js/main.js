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

// Update these with your backend endpoint and WhatsApp business number
window.LEGAL_CONFIG = {
    // PHP endpoint that receives lead data
    phpEndpoint: 'api/submit-lead.php',

    // WhatsApp business number (country code + number, digits only)
    whatsappNumber: '919876543210',

    // Prefilled WhatsApp message template
    formatWhatsAppMessage: function (data) {
        return `*Priority Legal Assistance Request*\n` +
               `-----------------------------------\n` +
               `👤 *Name:* ${data.name}\n` +
               `📱 *Mobile:* ${data.phone}\n` +
               `✉️ *Email:* ${data.email}\n` +
               `⚖️ *Requirement:* ${data.service}\n` +
               `🌐 *Page:* Creator Protection\n` +
               `-----------------------------------\n` +
               `Please connect me with a verified legal expert.`;
    }
};

// Handles form submit: sends lead to backend, then redirects to WhatsApp
async function handlePriorityFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector('[id*="Feedback"]') || form.querySelector('.lead-feedback');

    const nameInput = form.querySelector('[name="full_name"]');
    const emailInput = form.querySelector('[name="email"]');
    const phoneInput = form.querySelector('[name="mobile_number"]');
    const serviceInput = form.querySelector('[name="requirement"]');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const service = serviceInput ? serviceInput.value : '';

    if (!name || !email || !phone || !service) {
        alert('Please fill out all required fields.');
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
    }

    const leadData = {
        name: name,
        email: email,
        phone: phone,
        service: service,
        page_source: window.location.pathname || 'creator-protection',
        submitted_at: new Date().toISOString()
    };

    // UI Loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Connecting...';
    }

    // 1. Asynchronously send lead to PHP Admin Portal
    try {
        const formData = new FormData();
        for (const key in leadData) {
            formData.append(key, leadData[key]);
        }

        fetch(window.LEGAL_CONFIG.phpEndpoint, {
            method: 'POST',
            body: formData
        }).catch(err => {
            console.log('PHP Admin API log note:', err.message);
        });
    } catch (err) {
        console.log('Lead dispatch error:', err);
    }

    // 2. Build WhatsApp URL with prefilled encoded message
    const messageText = window.LEGAL_CONFIG.formatWhatsAppMessage(leadData);
    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${window.LEGAL_CONFIG.whatsappNumber}?text=${encodedText}`;

    // Display confirmation in UI
    if (feedback) {
        feedback.className = 'mt-2 p-2 rounded-3 text-center bg-success text-white d-block';
        feedback.innerHTML = `✓ Request received! Redirecting to WhatsApp...<br>
            <a href="${whatsappUrl}" target="_blank" class="text-white text-decoration-underline fw-bold mt-1 d-inline-block">Click here if WhatsApp didn't open</a>`;
    }

    // 3. WhatsApp Redirect: open in app on mobile, new tab on desktop
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = whatsappUrl;
    } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
}
