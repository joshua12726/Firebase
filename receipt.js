// Receipt System JavaScript
let currentOrder = null;

// Initialize receipt page
document.addEventListener('DOMContentLoaded', function() {
    loadReceiptData();
});

// Load receipt data
function loadReceiptData() {
    // Get order ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    
    if (orderId) {
        // Load specific order by ID
        loadOrderById(orderId);
    } else {
        // Load the most recent order
        loadMostRecentOrder();
    }
}

// Load order by ID
function loadOrderById(orderId) {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    const order = orders.find(o => o.orderNumber === orderId);
    
    if (order) {
        currentOrder = order;
        displayReceipt(order);
    } else {
        showNoReceiptFound();
    }
}

// Load most recent order
function loadMostRecentOrder() {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    
    if (orders.length > 0) {
        currentOrder = orders[0]; // Most recent order
        displayReceipt(currentOrder);
    } else {
        showNoReceiptFound();
    }
}

// Display receipt
function displayReceipt(order) {
    displayOrderInfo(order);
    displayOrderItems(order);
    displayOrderTotals(order);
    displayDeliveryInfo(order);
    
    // Show receipt content and hide no-receipt message
    document.getElementById('receipt-content').style.display = 'block';
    document.getElementById('no-receipt').style.display = 'none';
    
    // Update page title
    document.title = `Receipt ${order.orderNumber} - QuickOrder`;
}

// Display order information
function displayOrderInfo(order) {
    const template = document.getElementById('receipt-info-template');
    const clone = template.content.cloneNode(true);
    
    // Payment method names
    const paymentMethodNames = {
        'gcash': 'GCash',
        'card': 'Credit/Debit Card',
        'cod': 'Cash on Delivery'
    };
    
    // Order status styles
    const statusStyles = {
        'pending': { bg: '#dcfce7', color: '#166534', text: 'Pending' },
        'preparing': { bg: '#fef3c7', color: '#92400e', text: 'Preparing' },
        'ready': { bg: '#dbeafe', color: '#1e40af', text: 'Ready for Pickup' },
        'delivered': { bg: '#dcfce7', color: '#166534', text: 'Delivered' },
        'cancelled': { bg: '#fee2e2', color: '#dc2626', text: 'Cancelled' }
    };
    
    const orderDate = new Date(order.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const status = statusStyles[order.status] || statusStyles['Pending'];
    
    // Populate template
    clone.querySelector('.order-number').textContent = order.orderNumber;
    clone.querySelector('.order-date').textContent = orderDate;
    clone.querySelector('.payment-method').textContent = paymentMethodNames[order.paymentMethod] || order.paymentMethod;
    
    const statusElement = clone.querySelector('.order-status');
    statusElement.textContent = status.text;
    statusElement.style.backgroundColor = status.bg;
    statusElement.style.color = status.color;
    
    // Replace content
    const receiptInfo = document.getElementById('receipt-info');
    receiptInfo.innerHTML = '';
    receiptInfo.appendChild(clone);
}

// Display order items
function displayOrderItems(order) {
    const container = document.getElementById('receipt-items');
    const template = document.getElementById('receipt-item-template');
    
    // Create header
    const header = document.createElement('h4');
    header.textContent = 'Order Items';
    container.innerHTML = '';
    container.appendChild(header);
    
    // Add each item
    order.items.forEach(item => {
        const clone = template.content.cloneNode(true);
        const itemTotal = item.price * item.quantity;
        
        clone.querySelector('.item-name').textContent = item.name;
        clone.querySelector('.item-qty').textContent = `Qty: ${item.quantity} × ₱${item.price.toFixed(2)}`;
        clone.querySelector('.item-price').textContent = `₱${itemTotal.toFixed(2)}`;
        
        container.appendChild(clone);
    });
}

// Display order totals
function displayOrderTotals(order) {
    const template = document.getElementById('receipt-totals-template');
    const clone = template.content.cloneNode(true);
    
    // Populate totals
    clone.querySelector('.subtotal-amount').textContent = `₱${order.subtotal.toFixed(2)}`;
    clone.querySelector('.delivery-amount').textContent = `₱${order.deliveryFee.toFixed(2)}`;
    clone.querySelector('.tax-amount').textContent = `₱${order.tax.toFixed(2)}`;
    clone.querySelector('.total-amount').textContent = `₱${order.total.toFixed(2)}`;
    
    // Replace content
    const receiptTotals = document.getElementById('receipt-totals');
    receiptTotals.innerHTML = '';
    receiptTotals.appendChild(clone);
}

// Display delivery information
function displayDeliveryInfo(order) {
    const template = document.getElementById('receipt-delivery-template');
    const clone = template.content.cloneNode(true);
    
    // Populate delivery info
    clone.querySelector('.delivery-address').textContent = order.deliveryAddress;
    clone.querySelector('.contact-number').textContent = order.contactNumber;
    
    // Handle special instructions
    if (order.specialInstructions && order.specialInstructions.trim()) {
        clone.querySelector('.special-instructions').style.display = 'block';
        clone.querySelector('.special-instructions-text').textContent = order.specialInstructions;
    }
    
    // Calculate estimated delivery time
    const orderTime = new Date(order.timestamp);
    const estimatedDelivery = new Date(orderTime.getTime() + (30 * 60 * 1000)); // Add 30 minutes
    const deliveryTimeString = estimatedDelivery.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    clone.querySelector('.delivery-time').textContent = `${deliveryTimeString} (25-30 minutes)`;
    
    // Replace content
    const receiptDelivery = document.getElementById('receipt-delivery');
    receiptDelivery.innerHTML = '';
    receiptDelivery.appendChild(clone);
}

// Show no receipt found message
function showNoReceiptFound() {
    document.getElementById('receipt-content').style.display = 'none';
    document.getElementById('no-receipt').style.display = 'block';
    document.title = 'Receipt Not Found - QuickOrder';
}

// Print receipt
function printReceipt() {
    if (!currentOrder) {
        showNotification('No receipt to print', 'error');
        return;
    }
    
    // Create print window with receipt content
    const printWindow = window.open('', '_blank');
    const receiptContent = document.getElementById('receipt-content').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt ${currentOrder.orderNumber} - QuickOrder</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 20px;
                    color: #333;
                    line-height: 1.4;
                }
                .receipt {
                    max-width: 500px;
                    margin: 0 auto;
                }
                .receipt-company {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #ddd;
                }
                .receipt-company h2 {
                    color: #333;
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .receipt-company p {
                    margin: 5px 0;
                    color: #666;
                    font-size: 0.9rem;
                }
                .receipt-info, .receipt-totals, .delivery-info {
                    background: #f9f9f9;
                    padding: 15px;
                    margin: 20px 0;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                .receipt-row, .receipt-total-row, .delivery-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }
                .receipt-row:last-child, .receipt-total-row:last-child, .delivery-row:last-child {
                    margin-bottom: 0;
                }
                .receipt-items h4, .receipt-delivery h4 {
                    margin: 20px 0 15px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #ddd;
                    font-size: 1.1rem;
                }
                .receipt-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }
                .receipt-item:last-child {
                    border-bottom: none;
                }
                .item-name {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .item-qty {
                    color: #666;
                    font-size: 0.85rem;
                }
                .item-price {
                    font-weight: 600;
                    color: #333;
                }
                .receipt-total-row.final-total {
                    font-weight: bold;
                    font-size: 1.1rem;
                    border-top: 2px solid #ddd;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                .delivery-address, .special-instructions-text {
                    color: #666;
                    margin: 8px 0;
                    padding-left: 10px;
                    border-left: 2px solid #ddd;
                }
                .order-status {
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    background: #f0f0f0;
                    color: #333;
                }
                .receipt-footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #ddd;
                    text-align: center;
                }
                .receipt-thanks p {
                    margin: 8px 0;
                    color: #666;
                }
                .receipt-thanks p:first-child {
                    color: #333;
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                .receipt-policy {
                    margin-top: 15px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                }
                .receipt-policy small {
                    color: #888;
                    font-size: 0.8rem;
                }
                .qr-code {
                    display: none;
                }
            </style>
        </head>
        <body>
            ${receiptContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
    
    showNotification('Receipt sent to printer', 'success');
}

// Download receipt as PDF
function downloadReceipt() {
    if (!currentOrder) {
        showNotification('No receipt to download', 'error');
        return;
    }
    
    // For now, show a notification that PDF download is coming soon
    // In a real application, you would use a library like jsPDF or html2pdf
    showNotification('PDF download feature coming soon! Use print instead.', 'info');
    
    // Alternative: trigger print dialog
    setTimeout(() => {
        printReceipt();
    }, 1000);
}

// Generate shareable receipt link
function generateReceiptLink(orderNumber) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?order=${orderNumber}`;
}

// Share receipt
function shareReceipt() {
    if (!currentOrder) {
        showNotification('No receipt to share', 'error');
        return;
    }
    
    const receiptLink = generateReceiptLink(currentOrder.orderNumber);
    
    if (navigator.share) {
        // Use native sharing if available
        navigator.share({
            title: `QuickOrder Receipt ${currentOrder.orderNumber}`,
            text: 'View my QuickOrder receipt',
            url: receiptLink
        }).then(() => {
            showNotification('Receipt shared successfully', 'success');
        }).catch(() => {
            copyToClipboard(receiptLink);
        });
    } else {
        // Fallback to clipboard
        copyToClipboard(receiptLink);
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Receipt link copied to clipboard', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy to clipboard
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Receipt link copied to clipboard', 'success');
    } catch (err) {
        showNotification('Could not copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Notification system
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

// Utility functions for order management
function updateOrderStatus(orderNumber, newStatus) {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    const orderIndex = orders.findIndex(o => o.orderNumber === orderNumber);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        orders[orderIndex].lastUpdated = new Date().toISOString();
        localStorage.setItem('quickOrderOrders', JSON.stringify(orders));
        
        // Refresh display if this is the current order
        if (currentOrder && currentOrder.orderNumber === orderNumber) {
            currentOrder.status = newStatus;
            displayOrderInfo(currentOrder);
        }
        
        return true;
    }
    
    return false;
}

// Make functions globally available
window.printReceipt = printReceipt;
window.downloadReceipt = downloadReceipt;
window.shareReceipt = shareReceipt;
window.updateOrderStatus = updateOrderStatus;