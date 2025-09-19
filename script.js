// Enhanced QuickOrder Website - Professional Features
// Shopping Cart State
let cart = [];
let cartTotal = 0;
let isLoading = false;
// Global products array for related products functionality
let allProducts = [];

// Configuration
const CONFIG = {
    minOrderAmount: 10.00,
    deliveryFee: 2.99,
    taxRate: 0.08,
    maxQuantityPerItem: 10,
    searchMinLength: 2,
    notificationDuration: 3000
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeOrderingSystem();
    setupEventListeners();
    loadCartFromStorage();
    initializeSearchAndProfile();
    setupFormValidation();
    showWelcomeMessage();

    // Removed call to undefined loadUserProfile to prevent errors
    // loadUserProfile();
});



// Initialize Search and Profile functionality
function initializeSearchAndProfile() {
    setupSearchFunctionality();
    setupProfileFunctionality();
}



// Remove duplicate definitions of updateUIForLoggedInUser and updateUIForGuestUser
// These functions are already defined above and should not be duplicated.

// Expose functions globally
window.updateUIForLoggedInUser = updateUIForLoggedInUser;
window.updateUIForGuestUser = updateUIForGuestUser;

// Welcome Message
function showWelcomeMessage() {
    const savedUser = localStorage.getItem('firebaseUser');
    const isFirstVisit = !localStorage.getItem('hasVisited');
    
    if (isFirstVisit && !savedUser) {
        localStorage.setItem('hasVisited', 'true');
        setTimeout(() => {
            showModal('welcome-modal', {
                title: 'Welcome to QuickOrder! 🍕',
                message: 'Discover delicious food delivered fast to your doorstep. Browse our menu and create an account to place your first order!',
                primaryButton: 'Browse Menu',
                secondaryButton: 'Create Account',
                onPrimary: () => scrollToSection('menu'),
                onSecondary: () => window.location.href = 'login.html?mode=signup'
            });
        }, 2000);
    } else if (savedUser) {
        const user = JSON.parse(savedUser);
        const displayName = user.displayName || user.email.split('@')[0];
        showNotification(`Welcome back, ${displayName}! 👋`, 'success');
    }
}

// Initialize ordering system with validation
function initializeOrderingSystem() {
    // Listen for authentication state changes
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('User is signed in:', user.email);
                const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
                const email = user.email;

                // Persist to localStorage
                const storedUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: displayName
                };
                localStorage.setItem('firebaseUser', JSON.stringify(storedUser));

                // Update UI
                updateUIForLoggedInUser(storedUser);

                // Show welcome message
                setTimeout(() => {
                    const hour = new Date().getHours();
                    let greeting = 'Hello';
                    if (hour < 12) greeting = 'Good morning';
                    else if (hour < 18) greeting = 'Good afternoon';
                    else greeting = 'Good evening';

                    showNotification(`${greeting}, ${displayName}! Ready to order? 🍕`, 'info');
                }, 2000);
            } else {
                console.log('User is signed out');
                updateUIForGuestUser();
                localStorage.removeItem('firebaseUser');

                // Show guest message
                setTimeout(() => {
                    showNotification('Welcome! Browse our menu and create an account to place orders. 🍕', 'info');
                }, 1000);
            }
        });
    } else {
        // Fallback to localStorage if Firebase not available
        const savedUser = localStorage.getItem('firebaseUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                updateUIForLoggedInUser(user);
            } catch (error) {
                localStorage.removeItem('firebaseUser');
                updateUIForGuestUser();
            }
        } else {
            updateUIForGuestUser();
        }
    }



    // Setup real-time features
    setupRealTimeFeatures();

    // Initialize service worker for offline support (only on secure origins)
    if ('serviceWorker' in navigator) {
        const isSecureOrigin = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isSecureOrigin) {
            navigator.serviceWorker.register('sw.js').catch(console.error);
        }
    }
}

// Enhanced Event Listeners
function setupEventListeners() {
    try {
        // Smooth scrolling for navigation links
        setupSmoothScrolling();
        
        // Navbar scroll effect with throttling
        setupNavbarScrollEffect();
        
        // Enhanced cart functionality
        setupCartEventListeners();
        
        // Intersection Observer for animations
        setupScrollAnimations();
        
        // Keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Window resize handler
        setupResponsiveHandlers();
        
        // Error handling for images
        setupImageErrorHandling();
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Smooth Scrolling Setup
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update URL without triggering scroll
                history.pushState(null, null, targetId);
            }
        });
    });
}

// Enhanced Navbar Scroll Effect
function setupNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    let ticking = false;
    
    function updateNavbar() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            navbar.classList.add('scrolled');
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
            navbar.classList.remove('scrolled');
        }
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    });
}

// Enhanced Cart Event Listeners
function setupCartEventListeners() {
    // Close cart when clicking outside
    document.addEventListener('click', function(e) {
        const cartModal = document.getElementById('cart-modal');
        if (e.target === cartModal) {
            toggleCart();
        }
    });
    
    // Escape key to close cart
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const cartModal = document.getElementById('cart-modal');
            if (cartModal && cartModal.style.display === 'block') {
                toggleCart();
            }
        }
    });
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl/Cmd + Shift + C for cart
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleCart();
        }
    });
}

// Responsive Handlers
function setupResponsiveHandlers() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recalculate layouts if needed
            updateCartUI();
        }, 250);
    });
}

// Image Error Handling
function setupImageErrorHandling() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
            this.alt = 'Image not found';
        });
    });
}

// Enhanced Menu Filtering with Animation
function filterMenu(category) {
    const menuItems = document.querySelectorAll('.menu-item');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    // Update active button
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback for programmatic calls - set burgers button as active
        const burgersBtn = document.querySelector('.category-btn[onclick*="burgers"]');
        if (burgersBtn) burgersBtn.classList.add('active');
    }
    
    // Animate out items first
    menuItems.forEach((item, index) => {
        const itemCategory = item.getAttribute('data-category');
        
        if (category === 'all' || itemCategory === category) {
            setTimeout(() => {
                item.style.display = 'block';
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 50);
            }, index * 50);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('category', category);
    history.replaceState(null, '', url);
}

// Enhanced Shopping Cart Functions with Validation
function addToCart(name, price, image, button = null) {
    try {
        console.log('addToCart called with:', { name, price, image });
        // Validation
        if (!name || !price || price <= 0) {
            throw new Error('Invalid product data');
        }

        if (isLoading) {
            showNotification('Please wait...', 'warning');
            return;
        }

        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
            if (existingItem.quantity >= CONFIG.maxQuantityPerItem) {
                showNotification(`Maximum ${CONFIG.maxQuantityPerItem} items allowed per product`, 'warning');
                return;
            }
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: generateId(),
                name,
                price,
                image,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        updateCartUI();
        saveCartToStorage();
        showNotification(`${name} added to cart! 🛒`, 'success');

        // ✅ Use passed button instead of event.target
        if (button) addButtonFeedback(button);

        trackEvent('add_to_cart', { item_name: name, price });
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart', 'error');
    }
}

function addButtonFeedback(button) {
    if (!button) return;
    
    const originalText = button.textContent;
    const originalBg = button.style.backgroundColor || button.style.background;
    
    button.textContent = '✓ Added!';
    button.style.backgroundColor = '#10b981';
    button.style.transform = 'scale(0.95)';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = originalBg;
        button.style.transform = 'scale(1)';
        button.disabled = false;
    }, 1500);
}

function removeFromCart(name) {
    try {
        const itemIndex = cart.findIndex(item => item.name === name);
        if (itemIndex === -1) {
            throw new Error('Item not found in cart');
        }
        
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        
        updateCartUI();
        saveCartToStorage();
        showNotification(`${name} removed from cart`, 'info');
        
        // Show undo option
        showUndoNotification(() => {
            cart.splice(itemIndex, 0, removedItem);
            updateCartUI();
            saveCartToStorage();
            showNotification(`${name} restored to cart`, 'success');
        });
        
        trackEvent('remove_from_cart', { item_name: name });
        
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Failed to remove item from cart', 'error');
    }
}

function updateQuantity(name, change) {
    try {
        const item = cart.find(item => item.name === name);
        
        if (!item) {
            throw new Error('Item not found in cart');
        }
        
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            removeFromCart(name);
            return;
        }
        
        if (newQuantity > CONFIG.maxQuantityPerItem) {
            showNotification(`Maximum ${CONFIG.maxQuantityPerItem} items allowed`, 'warning');
            return;
        }
        
        item.quantity = newQuantity;
        updateCartUI();
        saveCartToStorage();
        
        trackEvent('update_quantity', { item_name: name, quantity: newQuantity });
        
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('Failed to update quantity', 'error');
    }
}

// Enhanced Cart UI with Better Validation and Checkout Enhancements
function updateCartUI() {
    try {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const checkoutBtn = document.querySelector('.checkout-btn');
        
        // Update cart count with animation
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCount) {
            if (cartCount.textContent !== totalItems.toString()) {
                cartCount.style.transform = 'scale(1.3)';
                cartCount.textContent = totalItems;
                setTimeout(() => {
                    cartCount.style.transform = 'scale(1)';
                }, 200);
            }
        }
        
        // Update cart items display
        if (!cartItems) return;
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <p>Your cart is empty</p>
                    <button class="btn-primary" onclick="scrollToSection('menu'); toggleCart();">
                        Browse Menu
                    </button>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = '0.00';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }
        
        let cartHTML = '';
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            cartHTML += `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="cart-item-info">
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTlBM0FGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tk88L3RleHQ+Cjwvc3ZnPg=='">
                        </div>
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>₱${item.price.toFixed(2)} each</p>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn" onclick="updateQuantity('${item.name}', -1)" ${item.quantity <= 1 ? 'title="Remove item"' : ''}>
                            ${item.quantity <= 1 ? '🗑️' : '-'}
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.name}', 1)" ${item.quantity >= CONFIG.maxQuantityPerItem ? 'disabled' : ''}>+</button>
                        <button class="remove-btn" onclick="removeFromCart('${item.name}')">Remove</button>
                    </div>
                </div>
            `;
        });
        
        // Calculate totals
        const deliveryFee = subtotal >= 25 ? 0 : CONFIG.deliveryFee;
        const tax = subtotal * CONFIG.taxRate;
        const total = subtotal + deliveryFee + tax;
        
        // Add totals section with enhanced styling and checkout summary
        cartHTML += `
            <div class="cart-summary">
                <div class="cart-summary-row">
                    <span>Subtotal:</span>
                    <span>₱${subtotal.toFixed(2)}</span>
                </div>
                <div class="cart-summary-row">
                    <span>Delivery Fee:</span>
                    <span>${deliveryFee === 0 ? 'FREE' : '₱' + deliveryFee.toFixed(2)}</span>
                </div>
                <div class="cart-summary-row">
                    <span>Tax:</span>
                    <span>₱${tax.toFixed(2)}</span>
                </div>
                <div class="cart-summary-row total-row">
                    <span>Total:</span>
                    <span>₱${total.toFixed(2)}</span>
                </div>
                ${subtotal < 25 ? '<div class="free-delivery-notice">💡 Add ₱' + (25 - subtotal).toFixed(2) + ' more for free delivery!</div>' : ''}
            </div>
            <div class="checkout-summary">
                <button class="btn-primary checkout-btn" onclick="checkout()" ${total < CONFIG.minOrderAmount ? 'disabled' : ''}>
                    ${total < CONFIG.minOrderAmount ? `Minimum Order ₱${CONFIG.minOrderAmount}` : `Checkout - ₱${total.toFixed(2)}`}
                </button>
            </div>
        `;
        
        cartItems.innerHTML = cartHTML;
        if (cartTotal) cartTotal.textContent = total.toFixed(2);
        
    } catch (error) {
        console.error('Error updating cart UI:', error);
        showNotification('Error updating cart display', 'error');
    }
}

// Enhanced Cart Toggle with Animation
function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    const isVisible = cartModal.style.display === 'block';
    
    if (isVisible) {
        cartModal.classList.add('closing');
        setTimeout(() => {
            cartModal.style.display = 'none';
            cartModal.classList.remove('closing');
            document.body.style.overflow = 'auto';
        }, 300);
    } else {
        cartModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        updateCartUI();
        
        // Focus management for accessibility
        const closeBtn = cartModal.querySelector('.close-cart');
        if (closeBtn) closeBtn.focus();
    }
}

// Enhanced Checkout with Account Requirement
function checkout() {
    try {
        if (cart.length === 0) {
            showNotification('Your cart is empty! 🛒', 'error');
            return;
        }
        
        const total = calculateCartTotal();
        
        if (total < CONFIG.minOrderAmount) {
            showNotification(`Minimum order amount is ₱${CONFIG.minOrderAmount}`, 'warning');
            return;
        }
        
        const savedUser = localStorage.getItem('firebaseUser');
        
        if (!savedUser) {
            showModal('account-required-modal', {
                title: 'Create Account to Order 🔐',
                message: 'To place an order and enjoy our full service, please create an account or sign in. This helps us track your orders and provide better service.',
                primaryButton: 'Create Account',
                secondaryButton: 'Sign In',
                onPrimary: () => {
                    window.location.href = 'login.html?mode=signup';
                },
                onSecondary: () => {
                    window.location.href = 'login.html';
                }
            });
            return;
        }
        
        // Save full cart before proceeding to payment
        localStorage.setItem('checkoutCart', JSON.stringify(cart));
        localStorage.setItem('checkoutTotal', total);
        localStorage.setItem('checkoutStarted', new Date().toISOString());
        
        proceedToPayment();
        
    } catch (error) {
        console.error('Error during checkout:', error);
        showNotification('Checkout failed. Please try again.', 'error');
    }
}

function proceedToPayment() {
    showNotification('Redirecting to payment... 💳', 'info');

    // Save full cart before redirect
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', calculateCartTotal());

    // Save checkout timestamp
    localStorage.setItem('checkoutStarted', new Date().toISOString());

    setTimeout(() => {
        window.location.href = 'payment.html';
    }, 1000);
}

function calculateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal >= 25 ? 0 : CONFIG.deliveryFee;
    const tax = subtotal * CONFIG.taxRate;
    return subtotal + deliveryFee + tax;
}

// Enhanced Search Functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    let searchTimeout;
    
    if (searchInput) {
        // Add search suggestions
        setupSearchSuggestions(searchInput);
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        
        // Real-time search with debouncing
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length >= CONFIG.searchMinLength) {
                searchTimeout = setTimeout(() => {
                    performSearch();
                }, 300);
            } else if (query.length === 0) {
                showAllMenuItems();
                hideSearchSuggestions();
            }
        });
        
        // Focus and blur events
        searchInput.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            setTimeout(() => hideSearchSuggestions(), 200);
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

function setupSearchSuggestions(searchInput) {
    const suggestions = [
        'burger', 'pizza', 'coffee', 'lemonade', 'classic', 'veggie',
        'margherita', 'pepperoni', 'hawaiian', 'fresh', 'iced'
    ];
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    searchInput.parentElement.appendChild(suggestionsContainer);
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length >= 2) {
            const matches = suggestions.filter(s => s.includes(query));
            showSearchSuggestions(matches, suggestionsContainer, searchInput);
        } else {
            hideSearchSuggestions();
        }
    });
}

function showSearchSuggestions(matches, container, input) {
    if (matches.length === 0) {
        hideSearchSuggestions();
        return;
    }
    
    const suggestionsHTML = matches.slice(0, 5).map(match => 
        `<div class="suggestion-item" onclick="selectSuggestion('${match}')">${match}</div>`
    ).join('');
    
    container.innerHTML = suggestionsHTML;
    container.style.display = 'block';
}

function hideSearchSuggestions() {
    const container = document.querySelector('.search-suggestions');
    if (container) {
        container.style.display = 'none';
    }
}

function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = suggestion;
        performSearch();
        hideSearchSuggestions();
    }
}

// Enhanced Search Performance
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        showAllMenuItems();
        return;
    }
    
    if (searchTerm.length < CONFIG.searchMinLength) {
        showNotification(`Please enter at least ${CONFIG.searchMinLength} characters`, 'warning');
        return;
    }
    
    const menuItems = document.querySelectorAll('.menu-item');
    const categoryBtns = document.querySelectorAll('.category-btn');
    let foundItems = 0;
    const results = [];
    
    // Reset category buttons
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    
    menuItems.forEach(item => {
        const itemName = item.querySelector('h3').textContent.toLowerCase();
        const itemDescription = item.querySelector('p').textContent.toLowerCase();
        const itemCategory = item.getAttribute('data-category');
        
        const nameMatch = itemName.includes(searchTerm);
        const descMatch = itemDescription.includes(searchTerm);
        const categoryMatch = itemCategory.includes(searchTerm);
        
        if (nameMatch || descMatch || categoryMatch) {
            item.style.display = 'block';
            item.style.animation = 'fadeIn 0.5s ease';
            foundItems++;
            
            // Highlight search terms
            highlightSearchTerm(item, searchTerm);
            results.push({
                name: itemName,
                element: item,
                relevance: nameMatch ? 3 : (descMatch ? 2 : 1)
            });
        } else {
            item.style.display = 'none';
            removeHighlight(item);
        }
    });
    
    // Sort results by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    // Show results
    if (foundItems === 0) {
        showNotification(`No results found for "${searchTerm}" 😔`, 'info');
        showSearchSuggestions(['burger', 'pizza', 'coffee'], document.querySelector('.search-suggestions'), searchInput);
    } else {
        showNotification(`Found ${foundItems} item${foundItems > 1 ? 's' : ''} for "${searchTerm}" ✨`, 'success');
        scrollToSection('menu');
    }
    
    // Track search
    trackEvent('search', { query: searchTerm, results: foundItems });
}

function highlightSearchTerm(item, term) {
    const title = item.querySelector('h3');
    const description = item.querySelector('p');
    
    [title, description].forEach(element => {
        if (element && element.textContent.toLowerCase().includes(term)) {
            const regex = new RegExp(`(${term})`, 'gi');
            element.innerHTML = element.textContent.replace(regex, '<mark>$1</mark>');
        }
    });
}

function removeHighlight(item) {
    const marks = item.querySelectorAll('mark');
    marks.forEach(mark => {
        mark.outerHTML = mark.innerHTML;
    });
}

// Modal System
function showModal(modalId, options = {}) {
    const modalHTML = `
        <div id="${modalId}" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${options.title || 'Notification'}</h3>
                    <button class="modal-close" onclick="closeModal('${modalId}')">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${options.message || ''}</p>
                </div>
                <div class="modal-footer">
                    ${options.secondaryButton ? `<button class="btn-secondary" id="${modalId}-secondary">${options.secondaryButton}</button>` : ''}
                    <button class="btn-primary" id="${modalId}-primary">${options.primaryButton || 'OK'}</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Add event listeners for buttons
    const modal = document.getElementById(modalId);
    const primaryBtn = modal.querySelector(`#${modalId}-primary`);
    const secondaryBtn = modal.querySelector(`#${modalId}-secondary`);
    
    if (primaryBtn) {
        primaryBtn.addEventListener('click', () => {
            closeModal(modalId);
            if (options.onPrimary) {
                options.onPrimary();
            }
        });
        primaryBtn.focus();
    }
    
    if (secondaryBtn) {
        secondaryBtn.addEventListener('click', () => {
            closeModal(modalId);
            if (options.onSecondary) {
                options.onSecondary();
            }
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Enhanced Notification System
function showNotification(message, type = 'info', duration = CONFIG.notificationDuration) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Enhanced styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '90px',
        right: '20px',
        padding: '0',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10001',
        transform: 'translateX(400px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '350px',
        minWidth: '300px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)'
    });
    
    // Set background color based on type
    const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
    
    return notification;
}

function showUndoNotification(undoCallback) {
    const notification = showNotification(
        'Item removed. <button class="undo-btn" onclick="undoAction()">Undo</button>',
        'info',
        5000
    );
    
    window.undoAction = () => {
        undoCallback();
        notification.remove();
        delete window.undoAction;
    };
}

// Form Validation System
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        });
    });
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    
    clearFieldError(field);
    
    if (required && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (value) {
        switch (type) {
            case 'email':
                if (!isValidEmail(value)) {
                    showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
            case 'tel':
                if (!isValidPhone(value)) {
                    showFieldError(field, 'Please enter a valid phone number');
                    return false;
                }
                break;
            case 'password':
                if (value.length < 6) {
                    showFieldError(field, 'Password must be at least 6 characters');
                    return false;
                }
                break;
        }
    }
    
    return true;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    let errorElement = field.parentElement.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Analytics and Tracking (Mock)
function trackEvent(eventName, properties = {}) {
    console.log('Analytics Event:', eventName, properties);
    
    // In a real application, you would send this to your analytics service
    // Example: gtag('event', eventName, properties);
}

// Real-time Features
function setupRealTimeFeatures() {
    // Update online status
    window.addEventListener('online', () => {
        showNotification('Connection restored! 🌐', 'success');
    });
    
    window.addEventListener('offline', () => {
        showNotification('You are offline. Some features may be limited. 📱', 'warning');
    });
}

// Storage Functions with Error Handling
function saveCartToStorage() {
    try {
        localStorage.setItem('quickOrderCart', JSON.stringify(cart));
        localStorage.setItem('cartLastUpdated', new Date().toISOString());
    } catch (error) {
        console.error('Error saving cart to storage:', error);
        showNotification('Failed to save cart. Please try again.', 'error');
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('quickOrderCart');
        const lastUpdated = localStorage.getItem('cartLastUpdated');
        
        if (savedCart) {
            // Check if cart is not too old (24 hours)
            const cartAge = Date.now() - new Date(lastUpdated).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cartAge < maxAge) {
                cart = JSON.parse(savedCart);
                updateCartUI();
                
                if (cart.length > 0) {
                    showNotification(`Welcome back! You have ${cart.length} item${cart.length > 1 ? 's' : ''} in your cart.`, 'info');
                }
            } else {
                // Clear old cart
                localStorage.removeItem('quickOrderCart');
                localStorage.removeItem('cartLastUpdated');
            }
        }
    } catch (error) {
        console.error('Error loading cart from storage:', error);
        // Clear corrupted data
        localStorage.removeItem('quickOrderCart');
        localStorage.removeItem('cartLastUpdated');
    }
}

// Enhanced Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Observe elements with staggered animation
    const animatedElements = document.querySelectorAll('.menu-item, .about-text, .delivery-preview, .stat');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Counter animation for stats
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => {
        statsObserver.observe(stat);
    });
}

// Enhanced Counter Animation
function animateCounter(element) {
    const target = element.textContent;
    const isTime = target.includes('min');
    const isRating = target.includes('★');
    const isNumber = target.includes('K') || target.includes('+');
    
    let numericValue;
    if (isTime) {
        numericValue = parseInt(target);
    } else if (isRating) {
        numericValue = parseFloat(target);
    } else if (isNumber) {
        numericValue = parseInt(target.replace(/[^\d]/g, ''));
    } else {
        return;
    }
    
    let current = 0;
    const increment = numericValue / 60; // Slower animation
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            current = numericValue;
            clearInterval(timer);
        }
        
        let displayValue;
        if (isTime) {
            displayValue = Math.floor(current) + 'min';
        } else if (isRating) {
            displayValue = current.toFixed(1) + '★';
        } else if (target.includes('K')) {
            displayValue = Math.floor(current / 1000) + 'K+';
        } else {
            displayValue = Math.floor(current) + '+';
        }
        
        element.textContent = displayValue;
    }, 30);
}

// Profile Functions (Enhanced)
function setupProfileFunctionality() {
    console.log('Setting up profile functionality');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');

    if (profileDropdown) {
        profileDropdown.addEventListener('click', toggleProfileMenu);
        console.log('Profile dropdown click event attached');
    } else {
        console.error('Profile dropdown element not found');
    }

    // Close profile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.profile-section')) {
            closeProfileMenu();
        }
    });

    // Keyboard navigation for profile menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileMenu && profileMenu.classList.contains('show')) {
            closeProfileMenu();
        }
    });

    console.log('Profile functionality setup complete');
}

function updateUIForLoggedInUser(user) {
    const displayName = user.displayName || user.email.split('@')[0];
    const email = user.email;
    
    // Update profile elements
    const profileName = document.getElementById('profile-name');
    const profileMenuName = document.getElementById('profile-menu-name');
    const profileMenuEmail = document.getElementById('profile-menu-email');
    
    if (profileName) profileName.textContent = displayName;
    if (profileMenuName) profileMenuName.textContent = displayName;
    if (profileMenuEmail) profileMenuEmail.textContent = email;
    
    // Show personalized content
    setTimeout(() => {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        showNotification(`${greeting}, ${displayName}! Ready to order? 🍕`, 'info');
    }, 2000);
}

// Update UI for Guest User
function updateUIForGuestUser() {
    // Update profile elements for guest
    const profileName = document.getElementById('profile-name');
    const profileMenuName = document.getElementById('profile-menu-name');
    const profileMenuEmail = document.getElementById('profile-menu-email');
    
    if (profileName) profileName.textContent = 'Guest';
    if (profileMenuName) profileMenuName.textContent = 'Guest User';
    if (profileMenuEmail) profileMenuEmail.textContent = 'Create account for better experience';
    
    // Show guest welcome message
    setTimeout(() => {
        showNotification('Welcome! Browse our menu and create an account to place orders. 🍕', 'info');
    }, 1000);
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 70;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function showAllMenuItems() {
    const menuItems = document.querySelectorAll('.menu-item');
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    // Show all items with staggered animation
    menuItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.display = 'block';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            removeHighlight(item);
        }, index * 50);
    });
    
    // Reset to "All Items" category
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    if (categoryBtns[0]) categoryBtns[0].classList.add('active');
}

// Profile Menu Actions (Enhanced)
function toggleProfileMenu() {
    console.log('toggleProfileMenu called');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');

    if (!profileDropdown || !profileMenu) {
        console.error('Profile dropdown or menu element not found');
        return;
    }

    if (profileMenu.classList.contains('show')) {
        closeProfileMenu();
    } else {
        openProfileMenu();
    }
}

function openProfileMenu() {
    console.log('openProfileMenu called');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');

    if (!profileDropdown || !profileMenu) {
        console.error('Profile dropdown or menu element not found');
        return;
    }

    profileDropdown.classList.add('active');
    profileMenu.classList.add('show');

    // Focus first menu item for accessibility
    const firstMenuItem = profileMenu.querySelector('.profile-menu-item');
    if (firstMenuItem) firstMenuItem.focus();

    console.log('Profile menu opened');
}

function closeProfileMenu() {
    console.log('closeProfileMenu called');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');

    if (profileDropdown) profileDropdown.classList.remove('active');
    if (profileMenu) profileMenu.classList.remove('show');

    console.log('Profile menu closed');
}





function viewFavorites() {
    const savedUser = localStorage.getItem('firebaseUser');
    
    if (!savedUser) {
        showModal('login-required-modal', {
            title: 'Sign In Required 🔐',
            message: 'Please create an account or sign in to save your favorite items.',
            primaryButton: 'Create Account',
            secondaryButton: 'Sign In',
            onPrimary: () => window.location.href = 'login.html?mode=signup',
            onSecondary: () => window.location.href = 'login.html'
        });
    } else {
        showModal('favorites-modal', {
            title: 'My Favorites ❤️',
            message: 'Save your favorite dishes for quick reordering! This feature will be available soon.',
            primaryButton: 'Sounds great',
            onPrimary: () => closeModal('favorites-modal')
        });
    }
    closeProfileMenu();
}

function viewSettings() {
    const savedUser = localStorage.getItem('firebaseUser');
    
    if (!savedUser) {
        showModal('login-required-modal', {
            title: 'Sign In Required 🔐',
            message: 'Please create an account or sign in to access settings.',
            primaryButton: 'Create Account',
            secondaryButton: 'Sign In',
            onPrimary: () => window.location.href = 'login.html?mode=signup',
            onSecondary: () => window.location.href = 'login.html'
        });
    } else {
        showModal('settings-modal', {
            title: 'Settings ⚙️',
            message: 'Customize your QuickOrder experience with notification preferences, delivery settings, and more. Coming soon!',
            primaryButton: 'OK',
            onPrimary: () => closeModal('settings-modal')
        });
    }
    closeProfileMenu();
}

function signOut() {
    const savedUser = localStorage.getItem('firebaseUser');
    
    if (savedUser) {
        showModal('signout-modal', {
            title: 'Sign Out 👋',
            message: 'Are you sure you want to sign out? Your cart will be saved for your next visit.',
            primaryButton: 'Sign Out',
            secondaryButton: 'Cancel',
            onPrimary: () => {
                // Use Firebase sign out if available, otherwise just clear localStorage
                if (typeof window.firebaseAuth !== 'undefined') {
                    window.firebaseAuth.signOut().then(() => {
                        localStorage.removeItem('firebaseUser');
                        showNotification('Signed out successfully! See you soon! 👋', 'success');
                        
                        setTimeout(() => {
                            window.location.href = 'Homepage.html'; // Redirect to homepage
                        }, 1500);
                    }).catch((error) => {
                        console.error('Error signing out from Firebase:', error);
                        // Fallback: clear localStorage and redirect
                        localStorage.removeItem('firebaseUser');
                        showNotification('Signed out successfully! See you soon! 👋', 'success');
                        
                        setTimeout(() => {
                            window.location.href = 'Homepage.html'; // Redirect to homepage
                        }, 1500);
                    });
                } else {
                    // Fallback for when Firebase is not available
                    localStorage.removeItem('firebaseUser');
                    showNotification('Signed out successfully! See you soon! 👋', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'Homepage.html'; // Redirect to homepage
                    }, 1500);
                }
            },
            onSecondary: () => closeModal('signout-modal')
        });
    } else {
        // Redirect to login page if not signed in
        window.location.href = 'login.html';
    }
    
    closeProfileMenu();
}



// Add Enhanced CSS Styles
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    /* Enhanced Notifications */
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
    }
    
    .notification-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    
    .notification-message {
        flex: 1;
        line-height: 1.4;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    .undo-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-left: 8px;
    }
    
    .undo-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    /* Modal System */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        backdrop-filter: blur(5px);
        animation: modalFadeIn 0.3s ease;
    }
    
    .modal-content {
        background: white;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        animation: modalSlideIn 0.3s ease;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    
    .modal-close:hover {
        background: #e2e8f0;
        color: #1e293b;
    }
    
    .modal-body {
        padding: 24px;
    }
    
    .modal-body p {
        margin: 0;
        line-height: 1.6;
        color: #475569;
    }
    
    .modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 24px;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
    }
    
    @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes modalSlideIn {
        from { transform: translateY(-50px) scale(0.95); }
        to { transform: translateY(0) scale(1); }
    }
    
    /* Enhanced Cart */
    .cart-summary {
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
        margin-top: 1rem;
    }
    
    .cart-summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.95rem;
    }
    
    .cart-summary-row.total-row {
        font-weight: 700;
        font-size: 1.1rem;
        color: #ff6b35;
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        margin-top: 8px;
    }
    
    .free-delivery-notice {
        background: #f0f9ff;
        color: #0369a1;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        margin-top: 8px;
        text-align: center;
    }
    
    .empty-cart {
        text-align: center;
        padding: 2rem 1rem;
    }
    
    .empty-cart-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    /* Search Enhancements */
    .search-container.focused {
        transform: scale(1.02);
    }
    
    .search-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-top: none;
        border-radius: 0 0 12px 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: none;
    }
    
    .suggestion-item {
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.2s;
        border-bottom: 1px solid #f1f5f9;
    }
    
    .suggestion-item:hover {
        background: #f8fafc;
    }
    
    .suggestion-item:last-child {
        border-bottom: none;
    }
    
    /* Form Validation */
    .field-error {
        color: #ef4444;
        font-size: 0.85rem;
        margin-top: 4px;
    }
    
    input.error, textarea.error, select.error {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    /* Highlight Search Terms */
    mark {
        background: #fef3c7;
        color: #92400e;
        padding: 2px 4px;
        border-radius: 3px;
    }
    
    /* Animation Enhancements */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animated {
        animation: fadeIn 0.6s ease forwards;
    }
    
    /* Cart Animation */
    .cart-modal.closing .cart-content {
        animation: slideOut 0.3s ease forwards;
    }
    
    @keyframes slideOut {
        to {
            transform: translate(-50%, -60%);
            opacity: 0;
        }
    }
    
    /* Product Details Modal Gallery */
    .gallery-container {
        position: relative;
        width: 100%;
        height: 300px;
        overflow: hidden;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .gallery-slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.5s ease;
    }
`;

document.head.appendChild(enhancedStyles);

function showProductDetails(productElement) {
    const name = productElement.querySelector('h3').textContent;
    const description = productElement.querySelector('p').textContent;
    const price = productElement.querySelector('.price').textContent;
    // Get images array from data attribute or fallback to single image
    let images = productElement.getAttribute('data-images');
    console.log('Raw data-images attribute:', images);
    if (images) {
        try {
            images = JSON.parse(images);
            console.log('Parsed images array:', images);
        } catch (error) {
            console.error('Error parsing images JSON:', error);
            images = [productElement.querySelector('.menu-item-image img').src];
        }
    } else {
        images = [productElement.querySelector('.menu-item-image img').src];
    }

    // Limit to 3 images
    images = images.slice(0, 3);

    // Create current product's images HTML
    const currentImagesHTML = images.map(img => `<img src="${img}" alt="${name}" style="width:100px; height:100px; object-fit:cover; border-radius:6px;" />`).join('');

    // Create image gallery HTML
    const galleryImagesHTML = images.map((imgSrc, index) => `
        <div class="gallery-slide${index === 0 ? ' active' : ''}">
            <img src="${imgSrc}" alt="${name} image ${index + 1}" class="product-detail-image">
        </div>
    `).join('');

    const modalContent = `
        <div class="modal-overlay" id="product-details-modal">
            <div class="modal-content product-details-modal" role="dialog" aria-modal="true" aria-labelledby="product-title" tabindex="-1">
                <div class="modal-header">
                    <h3 id="product-title">${name}</h3>
                    <button class="modal-close" aria-label="Close product details" onclick="closeProductDetails()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="product-details-layout" style="display:flex; gap:20px; flex-wrap:wrap;">
                        <div class="product-image-section" style="flex:1; min-width:300px;">
                            <div class="gallery-container">
                                ${galleryImagesHTML}
                                <button class="gallery-btn prev" aria-label="Previous image">&#10094;</button>
                                <button class="gallery-btn next" aria-label="Next image">&#10095;</button>
                            </div>
                        </div>
                        <div class="product-info-section" style="flex:1; min-width:300px;">
                            <div class="product-description-card">
                                <h4>📝 Description</h4>
                                <p>${description}</p>
                            </div>

                            <div class="product-details-grid">
                                <div class="detail-card">
                                    <div class="detail-icon">💰</div>
                                    <div class="detail-content">
                                        <h5>Price</h5>
                                        <p class="price-highlight">${price}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="related-products-section" style="margin-top:20px;">
                                <h4>Product Image From firebase</h4>
                                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                                    ${currentImagesHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" onclick="closeProductDetails()">Close</button>
                    <button class="btn-primary" onclick="addToCart('${name.replace(/'/g, "\\'")}', ${price.replace('₱', '')}, '${images[0].replace(/'/g, "\\'")}'); closeProductDetails();">Add to Cart</button>
                </div>
            </div>
        </div>
    `;

    // Append modal to body
    const existingModal = document.getElementById('product-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalContent);

    // Focus modal for accessibility
    const modal = document.getElementById('product-details-modal');
    if (modal) {
        modal.querySelector('.modal-content').focus();

        // Setup gallery navigation
        const slides = modal.querySelectorAll('.gallery-slide');
        let currentSlide = 0;

        const showSlide = (index) => {
            console.log('Showing slide:', index);
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        };

        const prevBtn = modal.querySelector('.gallery-btn.prev');
        const nextBtn = modal.querySelector('.gallery-btn.next');

        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            console.log('Prev button clicked, currentSlide:', currentSlide);
            showSlide(currentSlide);
        });

        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            console.log('Next button clicked, currentSlide:', currentSlide);
            showSlide(currentSlide);
        });

        // Show first slide on modal open
        showSlide(currentSlide);
    }

    // Prevent background scroll
    document.body.style.overflow = 'hidden';
}

function closeProductDetails() {
    const modal = document.getElementById('product-details-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Function to attach modal click listeners to menu items
function attachModalClickListeners() {
    const menuItems = document.querySelectorAll('.menu-item .menu-item-image, .menu-item h3');
    menuItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            // Find the closest menu-item container
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                showProductDetails(menuItem);
            }
        });
    });
}

// Add click event listeners to menu items for showing details (for initial load if any)
document.addEventListener('DOMContentLoaded', () => {
    attachModalClickListeners();
});

async function loadProducts() {
    try {
        console.log("Loading products from Firestore...");
        const menuGrid = document.getElementById("menu-grid");
        if (!menuGrid) {
            console.error('Menu grid element not found');
            return;
        }

        menuGrid.innerHTML = '<div class="menu-loading"><div class="loading-spinner"></div><p>Loading delicious food...</p></div>';

        // Use the existing Firebase DB instance
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        // Fetch products from Firestore
        const querySnapshot = await getDocs(collection(window.firebaseDB, "products"));
        menuGrid.innerHTML = ""; // clear loading message

        let productsLoaded = 0;

        if (querySnapshot.empty) {
            console.log("No products in Firestore, loading fallback products");
            loadFallbackProducts(menuGrid);
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const name = data.name || "Unnamed Product";
            const description = data.description || "";
            const price = data.price || 0;

            // ✅ Use array instead of string
            const images = data.images || (data.image ? (Array.isArray(data.image) ? data.image : [data.image]) : []);
            const mainImage = images.length > 0 ? images[0] : "fallback.png";

            // Use consistent field names with defaults
            const category = data.category || "other";

            // Store product in global array
            const product = {
                id: doc.id,
                name,
                description,
                price,
                images,
                category,
                mainImage
            };
            allProducts.push(product);

            // Render product card with data-images (for gallery modal)
            const itemHTML = `
                <div class="menu-item" data-category="${category}" data-product-id="${doc.id}" data-images='${JSON.stringify(images)}'>
                    <div class="menu-item-image">
                        <img src="${mainImage}" alt="${name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                    </div>
                    <div class="menu-item-content">
                        <h3>${name}</h3>
                        <p>${description}</p>
                        <div class="price">₱${price}</div>
                        <button class="btn-primary add-to-cart-btn"
                            data-name="${name.replace(/"/g, '"')}"
                            data-price="${price}"
                            data-image="${mainImage.replace(/"/g, '"')}">
                            <span class="btn-text">Add to Cart</span>
                            <span class="btn-icon">🛒</span>
                        </button>
                    </div>
                </div>
            `;

            menuGrid.insertAdjacentHTML("beforeend", itemHTML);
            productsLoaded++;
        });

        console.log(`Loaded ${productsLoaded} products from Firestore`);

        // Attach event listeners to all add to cart buttons
        attachAddToCartListeners();

        // Attach modal click listeners to menu items
        attachModalClickListeners();

    } catch (error) {
        console.error("Error loading products:", error);
        const menuGrid = document.getElementById("menu-grid");
        if (menuGrid) {
            menuGrid.innerHTML = '<div class="no-products"><h3>Unable to load menu</h3><p>Please check your connection and try again.</p><button class="btn-primary" onclick="loadProducts()">Retry</button></div>';
            // Load fallback products as backup
            setTimeout(() => loadFallbackProducts(menuGrid), 2000);
        }
    }
}

// Fallback products for when Firestore fails
function loadFallbackProducts(menuGrid) {
    console.log("Loading fallback products");
    const fallbackProducts = [
        {
            id: "fallback-1",
            name: "Classic Burger",
            description: "Juicy beef patty with fresh lettuce, tomato, and our special sauce.",
            price: 8.99,
            image: "product/Classic Burger.png",
            category: "burgers"
        },
        {
            id: "fallback-2",
            name: "Margherita Pizza",
            description: "Fresh mozzarella, tomato sauce, and basil on a crispy crust.",
            price: 12.99,
            image: "product/Margherita Pizza.png",
            category: "pizza"
        },
        {
            id: "fallback-3",
            name: "Fresh Lemonade",
            description: "Refreshing lemonade made with real lemons and a hint of mint.",
            price: 3.99,
            image: "product/Fresh Lemonade.png",
            category: "drinks"
        },
        {
            id: "fallback-4",
            name: "Iced Coffee",
            description: "Smooth cold brew coffee served over ice with your choice of milk.",
            price: 4.49,
            image: "product/Iced Coffee.png",
            category: "drinks"
        }
    ];

    menuGrid.innerHTML = ""; // Clear any existing content

    // Store fallback products in global array
    allProducts = fallbackProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: [product.image],
        category: product.category,
        mainImage: product.image
    }));

    fallbackProducts.forEach(product => {
        const itemHTML = `
            <div class="menu-item" data-category="${product.category}" data-product-id="${product.id}" data-images='["${product.image}"]'>
                <div class="menu-item-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                </div>
                <div class="menu-item-content">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="price">₱${product.price.toFixed(2)}</div>
                    <button class="btn-primary add-to-cart-btn"
                        data-name="${product.name.replace(/"/g, '"')}"
                        data-price="${product.price}"
                        data-image="${product.image.replace(/"/g, '"')}">
                        <span class="btn-text">Add to Cart</span>
                        <span class="btn-icon">🛒</span>
                    </button>
                </div>
            </div>
        `;
        menuGrid.insertAdjacentHTML("beforeend", itemHTML);
    });

    // Attach event listeners to fallback buttons
    attachAddToCartListeners();

    // Attach modal click listeners to menu items
    attachModalClickListeners();

    console.log("Fallback products loaded");
}

// Attach event listeners to add to cart buttons
function attachAddToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    console.log(`Attaching listeners to ${addToCartButtons.length} add to cart buttons`);

    addToCartButtons.forEach(button => {
        // Remove any existing listeners to avoid duplicates
        button.removeEventListener('click', handleAddToCartClick);

        // Add the listener
        button.addEventListener('click', handleAddToCartClick);
    });
}

// Handle add to cart button clicks
function handleAddToCartClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const name = button.getAttribute('data-name');
    const price = parseFloat(button.getAttribute('data-price'));
    const image = button.getAttribute('data-image');

    console.log('Add to cart clicked:', { name, price, image });

    if (name && !isNaN(price) && image) {
        addToCart(name, price, image, button);
    } else {
        console.error('Invalid product data:', { name, price, image });
        showNotification('Error: Invalid product data', 'error');
    }
}

// Call it on page load
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded, checking Firebase...');
    // Wait for Firebase to be ready
    const checkFirebase = () => {
        console.log('Checking Firebase:', { ready: window.firebaseReady, db: !!window.firebaseDB });
        if (window.firebaseReady && window.firebaseDB) {
            console.log('Firebase ready, loading products...');
            loadProducts();
        } else {
            console.log('Firebase not ready, checking again...');
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
});




// Make functions globally available
window.filterMenu = filterMenu;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.scrollToSection = scrollToSection;
window.performSearch = performSearch;
window.selectSuggestion = selectSuggestion;
window.toggleProfileMenu = toggleProfileMenu;

window.viewFavorites = viewFavorites;
window.viewSettings = viewSettings;
window.signOut = signOut;
window.showModal = showModal;
// Enhanced Carousel functionality for homepage hero section
document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const indicators = document.querySelectorAll('.carousel-indicator');

    let currentIndex = 0;
    let autoPlayInterval;
    let isPaused = false;
    const autoPlayDelay = 4000; // 4 seconds

    // Initialize carousel
    function initCarousel() {
        updateSlides();
        updateIndicators();
        startAutoPlay();
        setupEventListeners();
    }

    // Update slide visibility with smooth transitions
    function updateSlides() {
        slides.forEach((slide, index) => {
            if (index === currentIndex) {
                slide.classList.add('active');
                // Update ARIA attributes for accessibility
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.classList.remove('active');
                slide.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Update indicator states
    function updateIndicators() {
        indicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-selected', 'true');
                indicator.setAttribute('tabindex', '0');
            } else {
                indicator.classList.remove('active');
                indicator.setAttribute('aria-selected', 'false');
                indicator.setAttribute('tabindex', '-1');
            }
        });
    }

    // Navigate to specific slide
    function goToSlide(index) {
        if (index === currentIndex) return;

        currentIndex = index;
        updateSlides();
        updateIndicators();

        // Reset auto-play timer
        resetAutoPlay();
    }

    // Navigate to next slide
    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlides();
        updateIndicators();
        resetAutoPlay();
    }

    // Navigate to previous slide
    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlides();
        updateIndicators();
        resetAutoPlay();
    }

    // Start auto-play
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (!isPaused) {
                nextSlide();
            }
        }, autoPlayDelay);
    }

    // Reset auto-play timer
    function resetAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }
    }

    // Pause auto-play
    function pauseAutoPlay() {
        isPaused = true;
    }

    // Resume auto-play
    function resumeAutoPlay() {
        isPaused = false;
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Button navigation
        if (prevBtn) {
            prevBtn.addEventListener('click', prevSlide);
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
        }

        // Indicator navigation
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => goToSlide(index));
            indicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToSlide(index);
                }
            });
        });

        // Keyboard navigation
        if (carousel) {
            carousel.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        prevSlide();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        nextSlide();
                        break;
                    case 'Home':
                        e.preventDefault();
                        goToSlide(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        goToSlide(slides.length - 1);
                        break;
                }
            });
        }

        // Pause on hover
        if (carousel) {
            carousel.addEventListener('mouseenter', pauseAutoPlay);
            carousel.addEventListener('mouseleave', resumeAutoPlay);
        }

        // Touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        if (carousel) {
            carousel.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                pauseAutoPlay();
            });

            carousel.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
                resumeAutoPlay();
            });
        }

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide(); // Swipe left
                } else {
                    prevSlide(); // Swipe right
                }
            }
        }

        // Focus management for accessibility
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('focus', () => {
                // Optional: could add focus ring or other visual feedback
            });
        });
    }

    // Initialize if carousel exists
    if (carousel && slides.length > 0) {
        initCarousel();
    }
});

window.closeModal = closeModal;
window.showProductDetails = showProductDetails;
window.closeProductDetails = closeProductDetails;

