# Priority Legal Form & WhatsApp Lead Integration

Quick reference on how the consultation popup form works, how to configure it, and how to hook it up to your backend.

---

## Overview

When a user clicks any **"Talk to a Legal Expert"** button:
1. The **Priority Legal Assistance** popup opens.
2. The user enters their Name, Email, Mobile number, and selects a service.
3. On submit, the form does two things:
   - Posts the lead data asynchronously to your PHP backend endpoint (so it gets logged in your admin panel).
   - Immediately redirects the user to WhatsApp with the message already typed out. The user only needs to hit the send button.

Even if your PHP server is slow or momentarily down, the customer still lands in WhatsApp with their details intact.

---

## Configuration

All configuration lives in [`js/main.js`](file:///c:/Users/vmdev/Desktop/nanoGroup/legal_verifier/js/main.js#L106-L128) under `window.LEGAL_CONFIG`:

```javascript
window.LEGAL_CONFIG = {
    // 1. Your PHP backend endpoint where leads are posted
    phpEndpoint: 'api/submit-lead.php',

    // 2. Your WhatsApp business phone number (digits only with country code, e.g. 919876543210 for India)
    whatsappNumber: '919876543210',

    // 3. Message template that appears pre-filled in the user's WhatsApp input
    formatWhatsAppMessage: function (data) {
        return `*Priority Legal Assistance Request*\n` +
               `-----------------------------------\n` +
               `👤 *Name:* ${data.name}\n` +
               `📱 *Mobile:* ${data.phone}\n` +
               `✉️ *Email:* ${data.email}\n` +
               `⚖️ *Requirement:* ${data.service}\n` +
               `🌐 *Page:* Creator Protection\n` +
               `-----------------------------------\n` +
               `Please connect me with a legal expert.`;
    }
};
```

To update:
- Change `whatsappNumber` to your real business WhatsApp number.
- Update `phpEndpoint` to point to wherever your admin script lives.

---

## Sample PHP Backend (`api/submit-lead.php`)

Here is a straightforward script you can drop into your PHP server to receive the form POST and insert the record into your database:

```php
<?php
header('Content-Type: application/json');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Read inputs
$name        = trim($_POST['name'] ?? '');
$email       = trim($_POST['email'] ?? '');
$phone       = trim($_POST['phone'] ?? '');
$service     = trim($_POST['service'] ?? '');
$page_source = trim($_POST['page_source'] ?? 'creator-protection');
$ip_address  = $_SERVER['REMOTE_ADDR'] ?? '';

// Basic validation
if (empty($name) || empty($phone) || empty($service)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, phone, and service are required']);
    exit;
}

// Database connection
try {
    $db = new PDO('mysql:host=localhost;dbname=your_database;charset=utf8mb4', 'db_user', 'db_password', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $stmt = $db->prepare('
        INSERT INTO leads (name, email, phone, service, page_source, ip_address, created_at)
        VALUES (:name, :email, :phone, :service, :page_source, :ip_address, NOW())
    ');

    $stmt->execute([
        ':name'        => $name,
        ':email'       => $email,
        ':phone'       => $phone,
        ':service'     => $service,
        ':page_source' => $page_source,
        ':ip_address'  => $ip_address,
    ]);

    echo json_encode(['ok' => true, 'id' => $db->lastInsertId()]);
} catch (Exception $e) {
    error_log('Lead submission error: ' . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Database error']);
}
```

---

## Opening the Modal from Other Pages / Buttons

The popup uses standard Bootstrap modal attributes. To open it from any button or link, just add:

```html
<button type="button" class="btn btn-gold" data-bs-toggle="modal" data-bs-target="#priorityLegalModal">
    Talk to a Legal Expert
</button>
```

Make sure the modal markup (`#priorityLegalModal`) is included on that page (or included via `<?php include 'includes/lead-modal.html'; ?>`).

---

## File Reference

- [`creator-protection-form.html`](file:///c:/Users/vmdev/Desktop/nanoGroup/legal_verifier/creator-protection-form.html) — Standalone preview of the form card with background and submission script.
- [`includes/lead-modal.html`](file:///c:/Users/vmdev/Desktop/nanoGroup/legal_verifier/includes/lead-modal.html) — Reusable modal markup for PHP server-side includes.
- [`creator-protection.html`](file:///c:/Users/vmdev/Desktop/nanoGroup/legal_verifier/creator-protection.html) — Main landing page where hero and CTA buttons trigger the modal.
- [`js/main.js`](file:///c:/Users/vmdev/Desktop/nanoGroup/legal_verifier/js/main.js) — Contains `window.LEGAL_CONFIG` and the submission handler.
- [`css/style.css`](file:///c:/Users/vmdev/Desktop/nanoGroup/legal_verifier/css/style.css) — Contains the modal and input card styling.
- [`assets/images/creator-protection/lady-justice-bg.webp`](file:///c:/Users/vmdev/Desktop/nanoGroup/legal_verifier/assets/images/creator-protection/lady-justice-bg.webp) — WebP background of the Lady Justice statue.
