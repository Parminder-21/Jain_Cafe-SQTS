// Manage the customer shopping cart and checkout flow
let cart = JSON.parse(localStorage.getItem('jainCafeCart')) || [];
let orderHistory = JSON.parse(localStorage.getItem('jainCafeOrderHistory')) || [];

// Save current cart state to local storage
function saveCart() {
    localStorage.setItem('jainCafeCart', JSON.stringify(cart));
}

// Display popup notifications for UI feedback
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-feather="check-circle" style="color: var(--muted-green); width: 18px; height: 18px;"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Smooth entry
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// DOM Elements cache
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutFormContainer = document.getElementById('checkout-form-container');
const checkoutBtn = document.getElementById('checkout-btn');
const custName = document.getElementById('cust-name');
const custPhone = document.getElementById('cust-phone');
const custAddress = document.getElementById('cust-address');

// Order History elements
const historyToggleBtn = document.getElementById('history-toggle-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const historySidebar = document.getElementById('history-sidebar');
const historyOverlay = document.getElementById('history-overlay');
const historyItemsContainer = document.getElementById('history-items-container');

// Event Handlers
cartToggleBtn.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);
checkoutBtn.addEventListener('click', processCheckout);

if (historyToggleBtn) historyToggleBtn.addEventListener('click', toggleHistory);
if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', toggleHistory);
if (historyOverlay) historyOverlay.addEventListener('click', toggleHistory);

function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
    if (cartSidebar.classList.contains('active')) {
        renderCart();
    }
}

// Add a item to the cart or increase its quantity
window.addToCart = function(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    
    // Animate cart icon and show notification
    cartToggleBtn.classList.add('bounce');
    setTimeout(() => cartToggleBtn.classList.remove('bounce'), 300);
    showToast(`${name} added to cart!`);
    
    if (cartSidebar.classList.contains('active')) {
        renderCart();
    }
};

// Increment/decrement quantity or remove item if it drops below 1
window.updateQuantity = function(name, change) {
    const idx = cart.findIndex(item => item.name === name);
    if (idx > -1) {
        cart[idx].quantity += change;
        if (cart[idx].quantity <= 0) {
            cart.splice(idx, 1);
        }
    }
    saveCart();
    updateCartCount();
    renderCart();
};

// Update cart counter badges and sync the mobile bottom bar
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    const mcb = document.getElementById('mobile-cart-bar');
    const mcbCount = document.getElementById('mcb-count');
    const mcbTotal = document.getElementById('mcb-total');
    const toggleHidden = document.querySelector('.cart-toggle');
    
    if (mcb && mcbCount && mcbTotal) {
        mcbCount.textContent = totalItems === 1 ? '1 Item' : `${totalItems} Items`;
        let totalVal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        mcbTotal.textContent = `₹${totalVal}`;
        
        if (totalItems > 0) {
            mcb.classList.add('visible');
            if (toggleHidden) toggleHidden.classList.add('hidden-by-mobile-bar');
            if (checkoutFormContainer) checkoutFormContainer.style.display = 'block';
            if (checkoutBtn) checkoutBtn.disabled = false;
        } else {
            mcb.classList.remove('visible');
            if (toggleHidden) toggleHidden.classList.remove('hidden-by-mobile-bar');
            if (checkoutFormContainer) checkoutFormContainer.style.display = 'none';
            if (checkoutBtn) checkoutBtn.disabled = true;
        }
    } else {
        if (totalItems > 0) {
            if (checkoutFormContainer) checkoutFormContainer.style.display = 'block';
            if (checkoutBtn) checkoutBtn.disabled = false;
        } else {
            if (checkoutFormContainer) checkoutFormContainer.style.display = 'none';
            if (checkoutBtn) checkoutBtn.disabled = true;
        }
    }
    
    // Refresh the dynamic menu cards if they are loaded
    if (typeof window._mcRefreshPanel === 'function') {
        window._mcRefreshPanel();
    }
}

// Generate the items list within the slide-out cart sidebar
function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty</div>';
        cartTotalPrice.textContent = '₹0';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="cart-item-new">
                <div class="cart-item-new-left">
                    <h4 class="cart-item-new-title">${item.name}</h4>
                    <div class="cart-item-new-price">₹${item.price} x ${item.quantity}</div>
                </div>
                <div class="cart-item-new-right">
                    <div class="cart-item-new-controls">
                        <button class="cart-item-new-btn" onclick="updateQuantity('${item.name}', -1)">-</button>
                        <span class="cart-item-new-qty">${item.quantity}</span>
                        <button class="cart-item-new-btn" onclick="updateQuantity('${item.name}', 1)">+</button>
                    </div>
                    <div class="cart-item-new-subtotal">₹${itemTotal}</div>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = html;
    cartTotalPrice.textContent = `₹${total}`;
}

// Submit the order data to Formspree API
async function processCheckout() {
    const name = custName.value.trim();
    const phone = custPhone.value.trim();
    const address = custAddress.value.trim();
    
    if (!name || !phone || !address) {
        alert('Please fill out all delivery details.');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    let orderItemsText = '';
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        orderItemsText += `${item.quantity}x ${item.name} (₹${itemTotal})\n`;
    });
    
    const formData = new FormData();
    formData.append('_subject', `New Order from ${name}`);
    formData.append('Customer Name', name);
    formData.append('Phone Number', phone);
    formData.append('Delivery Address', address);
    formData.append('Payment Method', paymentMethod);
    formData.append('Order Items', orderItemsText);
    formData.append('Grand Total', `₹${total}`);
    
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = 'Placing Order...';
    checkoutBtn.disabled = true;

    try {
        const response = await fetch('https://formspree.io/f/mqeovral', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            // Log to Order History
            const orderId = `JC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
            const newOrder = {
                id: orderId,
                timestamp: Date.now(),
                items: orderItemsText,
                total: total,
                name: name,
                address: address,
                paymentMethod: paymentMethod,
                cartItems: JSON.parse(JSON.stringify(cart))
            };
            orderHistory.unshift(newOrder);
            localStorage.setItem('jainCafeOrderHistory', JSON.stringify(orderHistory));

            alert(`Your order has been placed successfully! Order ID: ${orderId}. We will contact you shortly.`);
            cart = [];
            saveCart();
            updateCartCount();
            toggleCart();
            custName.value = '';
            custPhone.value = '';
            custAddress.value = '';
        } else {
            alert('Could not place order. Please try again.');
        }
    } catch (err) {
        alert('Connection error. Please check your network.');
    } finally {
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
    }
}

// Order History Toggling and Tracking Logic
let historyRefreshInterval = null;

function toggleHistory() {
    if (historySidebar) {
        historySidebar.classList.toggle('active');
        historyOverlay.classList.toggle('active');
        if (historySidebar.classList.contains('active')) {
            renderHistory();
            clearInterval(historyRefreshInterval);
            historyRefreshInterval = setInterval(renderHistory, 10000);
        } else {
            clearInterval(historyRefreshInterval);
        }
    }
}

function getOrderStatus(timestamp) {
    const elapsed = Date.now() - timestamp;
    const mins = elapsed / 60000;
    
    if (mins < 2) {
        return { status: 'Placed', text: 'Order Placed', class: 'placed', progress: '10%' };
    } else if (mins < 5) {
        return { status: 'Accepted', text: 'Order Accepted', class: 'accepted', progress: '30%' };
    } else if (mins < 15) {
        return { status: 'Preparing', text: 'Preparing Food', class: 'preparing', progress: '52%' };
    } else if (mins < 30) {
        return { status: 'Delivery', text: 'Out for Delivery', class: 'delivery', progress: '76%' };
    } else {
        return { status: 'Delivered', text: 'Delivered', class: 'delivered', progress: '100%' };
    }
}

function stepClass(stepName, currentStatus) {
    const statuses = ['Placed', 'Accepted', 'Preparing', 'Delivery', 'Delivered'];
    const currentIdx = statuses.indexOf(currentStatus);
    const stepIdx = statuses.indexOf(stepName);
    
    if (currentIdx === stepIdx) {
        return 'active';
    } else if (stepIdx < currentIdx) {
        return 'completed';
    } else {
        return '';
    }
}

function renderHistory() {
    if (!historyItemsContainer) return;
    
    if (orderHistory.length === 0) {
        historyItemsContainer.innerHTML = '<div class="empty-cart-msg">You haven\'t placed any orders yet.</div>';
        return;
    }
    
    let html = '';
    orderHistory.forEach(order => {
        const statusInfo = getOrderStatus(order.timestamp);
        const dateStr = new Date(order.timestamp).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        
        let statusBadgeIcon = '';
        if (statusInfo.status !== 'Delivered') {
            statusBadgeIcon = '<span class="spinner-icon" style="display:inline-block; animation: spin 2s linear infinite;">⏳</span> ';
        } else {
            statusBadgeIcon = '✅ ';
        }
        
        html += `
            <div class="history-card" id="order-${order.id}">
                <div class="history-card-header">
                    <div>
                        <div class="history-card-id">${order.id}</div>
                        <div class="history-card-date">${dateStr}</div>
                    </div>
                    <div class="tracking-status-badge ${statusInfo.class}">
                        ${statusBadgeIcon}<span>${statusInfo.text}</span>
                    </div>
                </div>
                
                <div class="history-card-items">${order.items}</div>
                
                <div class="history-card-summary">
                    <div>Total: <span class="history-card-total">₹${order.total}</span></div>
                    <button class="reorder-btn" onclick="reorder('${order.id}')">
                        Re-order
                    </button>
                </div>
                
                <!-- Tracking Timeline -->
                <div class="tracking-timeline">
                    <div class="tracking-timeline-progress" style="width: ${statusInfo.progress}"></div>
                    
                    <div class="tracking-step ${stepClass('Placed', statusInfo.status)}">
                        <div class="tracking-dot"></div>
                        <div class="tracking-label">Placed</div>
                    </div>
                    <div class="tracking-step ${stepClass('Accepted', statusInfo.status)}">
                        <div class="tracking-dot"></div>
                        <div class="tracking-label">Accepted</div>
                    </div>
                    <div class="tracking-step ${stepClass('Preparing', statusInfo.status)}">
                        <div class="tracking-dot"></div>
                        <div class="tracking-label">Preparing</div>
                    </div>
                    <div class="tracking-step ${stepClass('Delivery', statusInfo.status)}">
                        <div class="tracking-dot"></div>
                        <div class="tracking-label">Out</div>
                    </div>
                    <div class="tracking-step ${stepClass('Delivered', statusInfo.status)}">
                        <div class="tracking-dot"></div>
                        <div class="tracking-label">Delivered</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    historyItemsContainer.innerHTML = html;
}

window.reorder = function(orderId) {
    const order = orderHistory.find(o => o.id === orderId);
    if (!order) return;
    
    order.cartItems.forEach(item => {
        const existing = cart.find(ci => ci.name === item.name);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            cart.push({ name: item.name, price: item.price, quantity: item.quantity });
        }
    });
    
    saveCart();
    updateCartCount();
    showToast('Items added to cart! 🛒');
    
    if (historySidebar && historySidebar.classList.contains('active')) {
        toggleHistory();
    }
    setTimeout(() => {
        if (cartSidebar && !cartSidebar.classList.contains('active')) {
            toggleCart();
        }
    }, 300);
};

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Scroll progress line tracker
    const progressBar = document.getElementById('scroll-progress');
    const heroImg = document.getElementById('hero-img');
    
    window.addEventListener('scroll', () => {
        if (progressBar) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = `${scrolled}%`;
        }
        
        if (heroImg) {
            const scrollY = window.scrollY;
            heroImg.style.transform = `translateY(${scrollY * 0.4}px)`;
        }
    }, { passive: true });
});
