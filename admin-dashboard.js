// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    if (!isAdmin()) {
        window.location.href = 'admin-login.html';
        return;
    }

    loadAdminDashboard();
    setupAdminEventListeners();
    setupExportProductsListener();
});

function setupExportProductsListener() {
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportProductsToJSON);
    }
}

// Export products to JSON file
function exportProductsToJSON() {
    if (!window.fetchProductsFromFirebase) {
        alert('Product export function is not available.');
        return;
    }

    exportBtnDisabled(true);

    window.fetchProductsFromFirebase().then(products => {
        const jsonStr = JSON.stringify(products, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'products-export.json';
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
        alert('Products exported successfully!');
    }).catch(error => {
        console.error('Error exporting products:', error);
        alert('Failed to export products. Please try again.');
    }).finally(() => {
        exportBtnDisabled(false);
    });
}

function exportBtnDisabled(disabled) {
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.disabled = disabled;
        exportBtn.textContent = disabled ? 'Exporting...' : 'Export Products to JSON';
    }
}

// Check if user is admin
function isAdmin() {
    const adminUser = localStorage.getItem('adminUser');
    return adminUser !== null;
}

// Load admin dashboard
function loadAdminDashboard() {
    loadOrders();
    updateStats();
}

// Setup event listeners
function setupAdminEventListeners() {
    // Add any additional event listeners here if needed
}

// Load orders from localStorage
function loadOrders(filter = 'all') {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    const ordersContainer = document.getElementById('orders-container');

    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-orders">
                <h3>No Orders Yet</h3>
                <p>Orders will appear here once customers place them.</p>
            </div>
        `;
        return;
    }

    // Filter orders based on status
    let filteredOrders = orders;
    if (filter !== 'all') {
        filteredOrders = orders.filter(order => order.status === filter);
    }

    // Sort orders by timestamp (newest first)
    filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let ordersHTML = '<div class="orders-grid">';

    filteredOrders.forEach(order => {
        ordersHTML += generateAdminOrderCardHTML(order);
    });

    ordersHTML += '</div>';
    ordersContainer.innerHTML = ordersHTML;
}

// Generate HTML for admin order card
function generateAdminOrderCardHTML(order) {
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

    // Get current status or default to confirmed
    const currentStatus = order.status || 'confirmed';
    const statusClass = `status-${currentStatus}`;

    // Status display text mapping
    const statusDisplayText = {
        'pending': 'Pending',
        'confirmed': 'Accepted order',
        'preparing': 'Preparing',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };

    const statusText = statusDisplayText[currentStatus] || currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

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

    // Generate action buttons based on current status
    let actionButtons = '';

    if (currentStatus === 'pending') {
        actionButtons = `
            <button class="admin-btn btn-confirm" onclick="updateOrderStatus('${order.orderNumber}', 'confirmed')">Accept Order</button>
            <button class="admin-btn btn-cancel" onclick="updateOrderStatus('${order.orderNumber}', 'cancelled')">Cancel Order</button>
        `;
    } else if (currentStatus === 'confirmed') {
        actionButtons = `
            <button class="admin-btn btn-confirm" onclick="updateOrderStatus('${order.orderNumber}', 'preparing')">Start Preparing</button>
            <button class="admin-btn btn-cancel" onclick="updateOrderStatus('${order.orderNumber}', 'cancelled')">Cancel Order</button>
        `;
    } else if (currentStatus === 'preparing') {
        actionButtons = `
            <button class="admin-btn btn-deliver" onclick="updateOrderStatus('${order.orderNumber}', 'delivered')">Mark Delivered</button>
            <button class="admin-btn btn-cancel" onclick="updateOrderStatus('${order.orderNumber}', 'cancelled')">Cancel Order</button>
        `;
    } else if (currentStatus === 'delivered') {
        actionButtons = '<span style="color: #10b981; font-weight: 500;">Order Completed</span>';
    } else if (currentStatus === 'cancelled') {
        actionButtons = '<span style="color: #ef4444; font-weight: 500;">Order Cancelled</span>';
    }

    return `
        <div class="order-card" data-order-id="${order.orderNumber}">
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.orderNumber}</h3>
                    <p>${orderDate} • ${paymentMethodNames[order.paymentMethod]}</p>
                </div>
                <div class="order-status ${statusClass}">
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
                <div class="admin-actions">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
}

// Update order status
function updateOrderStatus(orderNumber, newStatus) {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');
    const orderIndex = orders.findIndex(order => order.orderNumber === orderNumber);

    if (orderIndex === -1) {
        showNotification('Order not found', 'error');
        return;
    }

    // Update order status
    orders[orderIndex].status = newStatus;
    orders[orderIndex].statusUpdatedAt = new Date().toISOString();

    // Save updated orders
    localStorage.setItem('quickOrderOrders', JSON.stringify(orders));

    // Reload orders display
    const activeFilter = document.querySelector('.filter-btn.active');
    let filterType = 'all';
    if (activeFilter) {
        const text = activeFilter.textContent;
        if (text === 'Accepted order') {
            filterType = 'confirmed';
        } else {
            filterType = text.toLowerCase().replace(' ', '-');
        }
    }
    loadOrders(filterType);

    // Update statistics
    updateStats();

    // Show success notification
    const statusMessages = {
        'confirmed': 'Order has been accepted',
        'preparing': 'Order is now being prepared',
        'delivered': 'Order marked as delivered',
        'cancelled': 'Order has been cancelled'
    };

    showNotification(statusMessages[newStatus] || 'Order status updated', 'success');
}

// Filter orders by status
function filterOrders(status) {
    // Update active filter button
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));

    // Find and activate the clicked button
    let clickedButton;
    if (status === 'all') {
        clickedButton = Array.from(filterButtons).find(btn => btn.textContent === 'All Orders');
    } else if (status === 'confirmed') {
        clickedButton = Array.from(filterButtons).find(btn => btn.textContent === 'Accepted order');
    } else {
        clickedButton = Array.from(filterButtons).find(btn =>
            btn.textContent.toLowerCase() === status
        );
    }

    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // Load orders with filter
    loadOrders(status);
}

// Update dashboard statistics
function updateStats() {
    const orders = JSON.parse(localStorage.getItem('quickOrderOrders') || '[]');

    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order =>
        (order.status === 'confirmed' || order.status === 'preparing') ||
        (!order.status && order.status !== 'cancelled')
    ).length;

    const totalRevenue = orders
        .filter(order => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0);

    // Update UI
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('total-revenue').textContent = `₱${totalRevenue.toFixed(2)}`;
}

// Admin logout
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminUser');
        window.location.href = 'admin-login.html';
    }
}

// Close order modal
function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
}

// Notification system
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

// Make functions globally available
window.filterOrders = filterOrders;
window.updateOrderStatus = updateOrderStatus;
window.adminLogout = adminLogout;
window.closeOrderModal = closeOrderModal;
window.exportProductsToJSON = exportProductsToJSON;
