// Manage the customer shopping cart and checkout flow
let cart = JSON.parse(localStorage.getItem('jainCafeCart')) || [];

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

// Event Handlers
cartToggleBtn.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);
checkoutBtn.addEventListener('click', processCheckout);

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
            alert('Your order has been placed successfully! We will contact you shortly.');
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
            // Bounded translation ensures the image moves but never exposes white edges or spills over
            const translation = Math.max(-25, Math.min(25, scrollY * 0.08));
            heroImg.style.transform = `scale(1.1) translateY(${translation}px)`;
        }
    }, { passive: true });
});
