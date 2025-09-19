// Payment System JavaScript
let selectedPaymentMethod = null;
let orderData = null;

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    loadOrderData();
    setupPaymentEventListeners();
    formatInputFields();
});

// Load order data from localStorage
function loadOrderData() {
    const cart = JSON.parse(localStorage.getItem('quickOrderCart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty. Redirecting to menu...');
        window.location.href = 'Homepage.html';
        return;
    }
    
    displayOrderSummary(cart);
}

// Display order summary
function displayOrderSummary(cart) {
    const orderItemsContainer = document.getElementById('order-items');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const finalTotalElement = document.getElementById('final-total');
    const btnTotalElement = document.getElementById('btn-total');
    
    let subtotal = 0;
    let orderItemsHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const mediaHTML = item.image
            ? `<div class="item-thumb"><img src="${item.image}" alt="${item.name}" style="width:40px;height:40px;border-radius:8px;object-fit:cover" onerror="this.style.display='none'"></div>`
            : `<div class="item-emoji">${item.emoji || '🍽️'}</div>`;
        
        orderItemsHTML += `
            <div class="order-item">
                <div class="item-info">
                    ${mediaHTML}
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p>₱${item.price.toFixed(2)} × ${item.quantity}</p>
                    </div>
                </div>
                <div class="item-price">₱${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    const deliveryFee = 2.99;
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const finalTotal = subtotal + deliveryFee + tax;
    
    orderItemsContainer.innerHTML = orderItemsHTML;
    subtotalElement.textContent = `₱${subtotal.toFixed(2)}`;
    taxElement.textContent = `₱${tax.toFixed(2)}`;
    finalTotalElement.textContent = `₱${finalTotal.toFixed(2)}`;
    btnTotalElement.textContent = `₱${finalTotal.toFixed(2)}`;
    
    // Store order data for processing
    orderData = {
        items: cart,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        tax: tax,
        total: finalTotal
    };
}

// Setup payment event listeners
function setupPaymentEventListeners() {
    // Auto-select first payment method
    selectPaymentMethod('gcash');

    // Setup file upload event listeners
    setupFileUploadListeners();
    setupGCashFileUploadListeners();
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    // Update UI
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.classList.remove('selected');
    });

    const selectedOption = document.querySelector(`input[value="${method}"]`).closest('.payment-option');
    selectedOption.classList.add('selected');

    // Check the radio button
    document.getElementById(method).checked = true;

    // Show/hide payment forms
    const paymentForms = document.querySelectorAll('.payment-form');
    paymentForms.forEach(form => {
        form.style.display = 'none';
    });

    if (method === 'gcash') {
        document.getElementById('gcash-form').style.display = 'block';
    } else if (method === 'file-upload') {
        document.getElementById('file-upload-form').style.display = 'block';
    }
}

// Format input fields
function formatInputFields() {
    // This function can be expanded for additional formatting
}





// Validate form data
function validateFormData() {
    const deliveryAddress = document.getElementById('delivery-address').value.trim();

    if (!deliveryAddress) {
        showNotification('Please enter your delivery address', 'error');
        return false;
    }

    // For both GCash and file upload payment methods, check if payment proof is uploaded
    if (selectedPaymentMethod === 'gcash') {
        const fileInput = document.getElementById('gcash-payment-proof');
        if (!fileInput.files || fileInput.files.length === 0) {
            showNotification('Please upload your GCash payment proof image', 'error');
            return false;
        }
    } else if (selectedPaymentMethod === 'file-upload') {
        const fileInput = document.getElementById('payment-proof');
        if (!fileInput.files || fileInput.files.length === 0) {
            showNotification('Please upload your payment proof image', 'error');
            return false;
        }
    }

    return true;
}

// Process payment
async function processPayment() {
    if (!validateFormData()) {
        return;
    }
    
    // Show payment processing modal
    showPaymentModal();
    
    try {
        // Simulate payment processing
        await simulatePaymentProcessing();
        
        // Generate order number
        const orderNumber = generateOrderNumber();
        
        // Create order object
        const order = {
            orderNumber: orderNumber,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryFee: orderData.deliveryFee,
            tax: orderData.tax,
            total: orderData.total,
            paymentMethod: selectedPaymentMethod,
            deliveryAddress: document.getElementById('delivery-address').value,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        // Save order to localStorage
        saveOrder(order);

        // Optionally persist to Firestore if signed in
        try {
            if (typeof window.firebaseAuth !== 'undefined' && window.firebaseAuth.currentUser && typeof window.firebaseDB !== 'undefined') {
                const minimalOrder = {
                    items: order.items.map(it => ({ name: it.name, price: it.price, quantity: it.quantity, image: it.image })),
                    total: order.total
                };
                if (typeof window.saveOrderToFirebase === 'function') {
                    window.saveOrderToFirebase(minimalOrder);
                } else {
                    // Fallback direct write
                    window.firebaseDB.collection('orders').add({
                        userId: window.firebaseAuth.currentUser.uid,
                        userEmail: window.firebaseAuth.currentUser.email,
                        items: minimalOrder.items,
                        total: minimalOrder.total,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending'
                    }).catch(err => console.warn('Direct Firestore save failed:', err));
                }
            }
        } catch (e) {
            console.warn('Optional Firestore save failed:', e);
        }
        
        // Hide payment modal and show receipt
        hidePaymentModal();
        showReceipt(order);
        
        // Clear cart
        localStorage.removeItem('quickOrderCart');
        
    } catch (error) {
        hidePaymentModal();
        showNotification('Payment failed. Please try again.', 'error');
        console.error('Payment error:', error);
    }
}

// Simulate payment processing
function simulatePaymentProcessing() {
    return new Promise((resolve, reject) => {
        let step = 0;
        const steps = [
            { message: 'Validating payment information...', duration: 1500 },
            { message: 'Processing payment...', duration: 2000 },
            { message: 'Confirming order...', duration: 1000 }
        ];

        function processStep() {
            if (step < steps.length) {
                updatePaymentStatus(steps[step].message);
                setTimeout(() => {
                    step++;
                    processStep();
                }, steps[step - 1]?.duration || 1000);
            } else {
                // Always succeed for testing purposes
                resolve();
            }
        }

        processStep();
    });
}

// Generate order number
function generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QO${timestamp}${random}`;
}

// Save order to localStorage
function saveOrder(order) {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    orders.unshift(order);
    localStorage.setItem('quickOrderOrders', JSON.stringify(orders));
}

// Show payment modal
function showPaymentModal() {
    document.getElementById('payment-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Hide payment modal
function hidePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Update payment status
function updatePaymentStatus(message) {
    document.getElementById('payment-message').textContent = message;
}

// Show receipt
function showReceipt(order) {
    const receiptBody = document.getElementById('receipt-body');
    const receiptHTML = generateReceiptHTML(order);
    
    receiptBody.innerHTML = receiptHTML;
    document.getElementById('receipt-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Generate receipt HTML
function generateReceiptHTML(order) {
    const paymentMethodNames = {
        'gcash': 'GCash (Payment Proof)',
        'file-upload': 'File Upload (Payment Proof)'
    };
    
    const orderDate = new Date(order.timestamp).toLocaleString();
    
    let itemsHTML = '';
    order.items.forEach(item => {
        itemsHTML += `
            <div class="receipt-item">
                <div>
                    <div class="receipt-item-name">${item.name}</div>
                    <div class="receipt-item-qty">Qty: ${item.quantity} × ₱${item.price.toFixed(2)}</div>
                </div>
                <div class="receipt-item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    return `
        <div class="receipt">
            <div class="receipt-company">
                <h2>🍕 QuickOrder</h2>
                <p>Delicious food delivered fast</p>
                <p>📞 (555) 123-4567 | 📧 hello@quickorder.com</p>
            </div>
            
            <div class="receipt-info">
                <div class="receipt-row">
                    <strong>Order #:</strong>
                    <span>${order.orderNumber}</span>
                </div>
                <div class="receipt-row">
                    <strong>Date:</strong>
                    <span>${orderDate}</span>
                </div>
                <div class="receipt-row">
                    <strong>Payment Method:</strong>
                    <span>${paymentMethodNames[order.paymentMethod]}</span>
                </div>
                <div class="receipt-row">
                    <strong>Status:</strong>
                    <span style="color: #10b981; font-weight: 600;">${order.status === 'cancelled' ? 'Cancelled' : 'Pending'}</span>
                </div>
            </div>
            
            <div class="receipt-items">
                <h4>Order Items</h4>
                ${itemsHTML}
            </div>
            
            <div class="receipt-totals">
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>₱${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>Delivery Fee:</span>
                    <span>₱${order.deliveryFee.toFixed(2)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>Tax:</span>
                    <span>₱${order.tax.toFixed(2)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>Total:</span>
                    <span>₱${order.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="receipt-info">
                <div class="receipt-row">
                    <strong>Delivery Address:</strong>
                </div>
                <div style="margin-top: 8px; color: #4a5568;">
                    ${order.deliveryAddress}
                </div>
            </div>
            
            <div class="receipt-footer">
                <p><strong>Estimated Delivery Time: 25-30 minutes</strong></p>
                <p>Thank you for choosing QuickOrder!</p>
                <p>Track your order status in your account dashboard.</p>
            </div>
        </div>
    `;
}

// Close receipt
function closeReceipt() {
    document.getElementById('receipt-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Show success message and redirect
    showNotification('Order placed successfully! Redirecting to homepage...', 'success');
    
    setTimeout(() => {
        window.location.href = 'Homepage.html';
    }, 2000);
}

// Download receipt as PDF (simplified version)
function downloadReceipt() {
    // In a real application, you would use a library like jsPDF
    // For now, we'll just show a notification
    showNotification('Receipt download feature coming soon!', 'info');
    
    // Alternative: Print the receipt
    const receiptContent = document.getElementById('receipt-body').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - QuickOrder</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt { max-width: 400px; margin: 0 auto; }
                .receipt-company { text-align: center; margin-bottom: 30px; }
                .receipt-company h2 { color: #ff6b35; margin: 0; }
                .receipt-info, .receipt-totals { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; }
                .receipt-row, .receipt-total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .receipt-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                .receipt-total-row:last-child { font-weight: bold; color: #ff6b35; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; }
                .receipt-footer { text-align: center; margin-top: 20px; color: #666; }
            </style>
        </head>
        <body>
            ${receiptContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Notification system (reuse from main script)
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles for notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '90px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10001',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        info: '#3b82f6',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// File Upload Functions

// Setup file upload event listeners
function setupFileUploadListeners() {
    const fileInput = document.getElementById('payment-proof');
    const fileLabel = document.querySelector('.file-upload-label');

    if (fileInput && fileLabel) {
        fileLabel.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileSelection);
    }
}

// Handle file selection
function handleFileSelection(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('file-preview');
    const previewImage = document.getElementById('preview-image');
    const fileInfo = document.getElementById('file-info');
    const fileNameSpan = document.getElementById('file-name');
    const fileSizeSpan = document.getElementById('file-size');

    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File size must be less than 10MB', 'error');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
            fileInfo.style.display = 'block';
            fileNameSpan.textContent = file.name;
            fileSizeSpan.textContent = formatFileSize(file.size);
        };
        reader.readAsDataURL(file);

       
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove uploaded file
function removeUploadedFile() {
    const fileInput = document.getElementById('payment-proof');
    const previewContainer = document.getElementById('file-preview');
    const fileInfo = document.getElementById('file-info');

    fileInput.value = '';
    previewContainer.style.display = 'none';
    fileInfo.style.display = 'none';

    showNotification('Payment proof removed', 'info');
}

// GCash File Upload Functions

// Setup GCash file upload event listeners
function setupGCashFileUploadListeners() {
    const fileInput = document.getElementById('gcash-payment-proof');
    const fileLabel = document.querySelector('#gcash-form .file-upload-label');

    if (fileInput && fileLabel) {
        fileLabel.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleGCashFileSelection);
    }
}

// Handle GCash file selection
function handleGCashFileSelection(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('gcash-file-preview');
    const previewImage = document.getElementById('gcash-preview-image');
    const fileInfo = document.getElementById('gcash-file-info');
    const fileNameSpan = document.getElementById('gcash-file-name');
    const fileSizeSpan = document.getElementById('gcash-file-size');

    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File size must be less than 10MB', 'error');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
            fileInfo.style.display = 'block';
            fileNameSpan.textContent = file.name;
            fileSizeSpan.textContent = formatFileSize(file.size);
        };
        reader.readAsDataURL(file);

        showNotification('GCash payment proof uploaded successfully', 'success');
    }
}

// Remove GCash uploaded file
function removeGCashFile() {
    const fileInput = document.getElementById('gcash-payment-proof');
    const previewContainer = document.getElementById('gcash-file-preview');
    const fileInfo = document.getElementById('gcash-file-info');

    fileInput.value = '';
    previewContainer.style.display = 'none';
    fileInfo.style.display = 'none';

    showNotification('GCash payment proof removed', 'info');
}

// Make functions globally available
window.selectPaymentMethod = selectPaymentMethod;
window.processPayment = processPayment;
window.closeReceipt = closeReceipt;
window.downloadReceipt = downloadReceipt;
window.removeUploadedFile = removeUploadedFile;
window.removeGCashFile = removeGCashFile;
