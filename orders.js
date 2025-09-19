// Orders Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadOrderHistory();
    document.getElementById('clear-history-btn').addEventListener('click', openClearHistoryModal);
});

// Load order history from localStorage
function loadOrderHistory() {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    const ordersContent = document.getElementById('orders-content');

    if (orders.length === 0) {
        ordersContent.innerHTML = `
            <div class="empty-orders">
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet. Start by browsing our delicious menu!</p>
                <a href="Homepage.html" class="btn-primary">Browse Menu</a>
            </div>
        `;
        return;
    }

    // Sort orders by timestamp (newest first)
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Check for newly cancelled orders and show notification
    checkForCancelledOrders(orders);

    let ordersHTML = '<div class="orders-list">';

    orders.forEach(order => {
        ordersHTML += generateOrderCardHTML(order);
    });

    ordersHTML += '</div>';
    ordersContent.innerHTML = ordersHTML;
}

// Generate HTML for order card
function generateOrderCardHTML(order) {
    const orderDate = new Date(order.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const paymentMethodNames = {
        'gcash': 'GCash',
        'card': 'Credit/Debit Card',
        'cod': 'Cash on Delivery'
    };
    
    // Use actual order status if available, fallback to age-based status for demo purposes
    let status = order.status || 'pending';
    let statusText = '';

    switch (status) {
        case 'pending':
            statusText = 'Pending';
            break;
        case 'confirmed':
            statusText = 'Accepted order';
            break;
        case 'preparing':
            statusText = 'Preparing';
            break;
        case 'delivered':
            statusText = 'Delivered';
            break;
        case 'cancelled':
            statusText = 'Cancelled';
            break;
        default:
            // fallback to age-based status
            const orderAge = Date.now() - new Date(order.timestamp).getTime();
            const hoursOld = orderAge / (1000 * 60 * 60);
            if (hoursOld > 2) {
                status = 'delivered';
                statusText = 'Delivered';
            } else if (hoursOld > 0.5) {
                status = 'preparing';
                statusText = 'Preparing';
            } else {
                status = 'pending';
                statusText = 'Pending';
            }
            break;
    }
    
    let itemsHTML = '';
    order.items.forEach(item => {
        const mediaHTML = item.image
            ? `<div class="item-thumb"><img src="${item.image}" alt="${item.name}" style="width:40px;height:40px;border-radius:8px;object-fit:cover" onerror="this.style.display='none'"></div>`
            : `<div class="item-emoji">${item.emoji || '🍽️'}</div>`;

        itemsHTML += `
            <div class="order-item">
                <div class="item-info">
                    ${mediaHTML}
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p>Qty: ${item.quantity} × ₱${item.price.toFixed(2)}</p>
                    </div>
                </div>
                <div class="item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.orderNumber}</h3>
                    <p>${orderDate} • ${paymentMethodNames[order.paymentMethod]}</p>
                </div>
                <div class="order-status status-${status}">
                    ${statusText}
                </div>
            </div>
            
            <div class="order-items">
                ${itemsHTML}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    Total: ₱${order.total.toFixed(2)}
                </div>
                <div class="order-actions">
                    <button class="btn-small btn-view-receipt" onclick="viewReceipt('${order.orderNumber}')">
                        View Receipt
                    </button>
                    <button class="btn-small btn-reorder" onclick="reorderItems('${order.orderNumber}')">
                        Reorder
                    </button>
                </div>
            </div>
        </div>
    `;
}

// View receipt for specific order
function viewReceipt(orderNumber) {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (!order) {
        showNotification('Order not found', 'error');
        return;
    }
    
    showReceipt(order);
}

// Show receipt modal
function showReceipt(order) {
    const receiptBody = document.getElementById('receipt-body');
    const receiptHTML = generateReceiptHTML(order);
    
    receiptBody.innerHTML = receiptHTML;
    document.getElementById('receipt-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Generate receipt HTML (same as payment.js)
function generateReceiptHTML(order) {
    const paymentMethodNames = {
        'gcash': 'GCash',
        'card': 'Credit/Debit Card',
        'cod': 'Cash on Delivery'
    };
    
    const orderDate = new Date(order.timestamp).toLocaleString();
    
    // Use actual order status if available
    let statusText = 'Pending';
    let statusColor = '#10b981';

    const orderStatus = order.status || 'pending';
    switch (orderStatus) {
        case 'pending':
            statusText = 'Pending';
            statusColor = '#10b981';
            break;
        case 'confirmed':
            statusText = 'Accepted order';
            statusColor = '#10b981';
            break;
        case 'preparing':
            statusText = 'Preparing';
            statusColor = '#f59e0b';
            break;
        case 'delivered':
            statusText = 'Delivered';
            statusColor = '#3b82f6';
            break;
        case 'cancelled':
            statusText = 'Cancelled';
            statusColor = '#ef4444';
            break;
        default:
            statusText = 'Pending';
            statusColor = '#10b981';
            break;
    }
    
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
                    <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
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
                <div class="receipt-row" style="margin-top: 12px;">
                    <strong>Contact:</strong>
                    <span>${order.contactNumber}</span>
                </div>
                ${order.specialInstructions ? `
                <div class="receipt-row" style="margin-top: 12px;">
                    <strong>Special Instructions:</strong>
                </div>
                <div style="margin-top: 8px; color: #4a5568;">
                    ${order.specialInstructions}
                </div>
                ` : ''}
            </div>
            
            <div class="receipt-footer">
                <p><strong>Thank you for choosing QuickOrder!</strong></p>
                <p>We hope you enjoyed your meal.</p>
                ${statusText === 'Delivered' ? 
                    '<p>Rate your experience in your account dashboard.</p>' : 
                    '<p>Track your order status in real-time.</p>'
                }
            </div>
        </div>
    `;
}

// Reorder items from previous order
function reorderItems(orderNumber) {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (!order) {
        showNotification('Order not found', 'error');
        return;
    }
    
    // Add items to current cart
    let currentCart = JSON.parse(localStorage.getItem('quickOrderCart') || '[]');

    const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

    order.items.forEach(orderItem => {
        const existingItem = currentCart.find(cartItem => cartItem.name === orderItem.name);

        if (existingItem) {
            existingItem.quantity += orderItem.quantity;
        } else {
            currentCart.push({
                id: orderItem.id || genId(),
                name: orderItem.name,
                price: orderItem.price,
                image: orderItem.image || `product/${orderItem.name}.png`,
                quantity: orderItem.quantity,
                addedAt: orderItem.addedAt || new Date().toISOString()
            });
        }
    });

    // Save updated cart
    localStorage.setItem('quickOrderCart', JSON.stringify(currentCart));

    showNotification(`${order.items.length} items added to cart!`, 'success');

    // Redirect to homepage after a short delay
    setTimeout(() => {
        window.location.href = 'Homepage.html';
    }, 1500);
}

// Close receipt modal
function closeReceipt() {
    document.getElementById('receipt-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Download receipt (same as payment.js)
function downloadReceipt() {
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

// Notification system (same as other files)
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
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
    
    const colors = {
        success: '#10b981',
        info: '#3b82f6',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Check for newly cancelled orders and show notifications
function checkForCancelledOrders(orders) {
    const cancelledOrders = orders.filter(order => order.status === 'cancelled');

    if (cancelledOrders.length > 0) {
        // Get previously notified orders to avoid duplicate notifications
        const notifiedOrders = JSON.parse(localStorage.getItem('notifiedCancelledOrders') || '[]');

        cancelledOrders.forEach(order => {
            if (!notifiedOrders.includes(order.orderNumber)) {
                // Show notification for newly cancelled order
                showNotification(`Order #${order.orderNumber} has been cancelled by admin.`, 'warning');

                // Mark this order as notified
                notifiedOrders.push(order.orderNumber);
            }
        });

        // Save notified orders list
        localStorage.setItem('notifiedCancelledOrders', JSON.stringify(notifiedOrders));
    }
}

// Clear order history modal controls
function openClearHistoryModal() {
    document.getElementById('clear-history-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeClearHistoryModal() {
    document.getElementById('clear-history-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function confirmClearHistory() {
    localStorage.removeItem('quickOrderOrders');
    localStorage.removeItem('notifiedCancelledOrders');
    loadOrderHistory();
    showNotification('Order history cleared successfully!', 'success');
    closeClearHistoryModal();
}

window.viewReceipt = viewReceipt;
window.reorderItems = reorderItems;
window.closeReceipt = closeReceipt;
window.downloadReceipt = downloadReceipt;
window.clearOrderHistory = clearOrderHistory;
window.openClearHistoryModal = openClearHistoryModal;
window.closeClearHistoryModal = closeClearHistoryModal;
window.confirmClearHistory = confirmClearHistory;
