let cart = JSON.parse(localStorage.getItem('jainCafeCart')) || [];

// Function to Save Cart
function saveCart() {
    localStorage.setItem('jainCafeCart', JSON.stringify(cart));
}

// Toast Function
function showToast(message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-feather="check-circle" style="color: var(--muted-green); width: 18px; height: 18px;"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    if(typeof feather !== 'undefined') feather.replace();

    // Show animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// DOM Elements
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
const custAddress = document.getElementById('cust-address');

// Event Listeners
cartToggleBtn.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);
checkoutBtn.addEventListener('click', processCheckout);

// Function to Toggle Cart
function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
    if (cartSidebar.classList.contains('active')) {
        renderCart();
    }
}

// Function to Add to Cart
window.addToCart = function(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    
    // UI Feedback: Bounce and Toast
    cartToggleBtn.classList.add('bounce');
    setTimeout(() => cartToggleBtn.classList.remove('bounce'), 300);
    showToast(`${name} added to cart!`);
    
    // Update cart UI if it is open
    if (cartSidebar.classList.contains('active')) {
        renderCart();
    }
}

// Function to Remove or Decrease Quantity
window.updateQuantity = function(name, change) {
    const itemIndex = cart.findIndex(item => item.name === name);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    saveCart();
    updateCartCount();
    renderCart();
}

// Update Cart Badge
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if(cartCount) cartCount.textContent = totalItems;
    
    // Update Mobile Cart Bar
    const mcb = document.getElementById('mobile-cart-bar');
    const mcbCount = document.getElementById('mcb-count');
    const mcbTotal = document.getElementById('mcb-total');
    const toggleHidden = document.querySelector('.cart-toggle');
    
    if (mcb && mcbCount && mcbTotal) {
        mcbCount.textContent = totalItems === 1 ? '1 Item' : totalItems + ' Items';
        let totalVal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        mcbTotal.textContent = '₹' + totalVal;
        
        if (totalItems > 0) {
            mcb.classList.add('visible');
            if(toggleHidden) toggleHidden.classList.add('hidden-by-mobile-bar');
            if(checkoutFormContainer) checkoutFormContainer.style.display = 'block';
            if(checkoutBtn) checkoutBtn.disabled = false;
        } else {
            mcb.classList.remove('visible');
            if(toggleHidden) toggleHidden.classList.remove('hidden-by-mobile-bar');
            if(checkoutFormContainer) checkoutFormContainer.style.display = 'none';
            if(checkoutBtn) checkoutBtn.disabled = true;
        }
    } else {
        if (totalItems > 0) {
            if(checkoutFormContainer) checkoutFormContainer.style.display = 'block';
            if(checkoutBtn) checkoutBtn.disabled = false;
        } else {
            if(checkoutFormContainer) checkoutFormContainer.style.display = 'none';
            if(checkoutBtn) checkoutBtn.disabled = true;
        }
    }
    
    if(typeof renderInlineCartControls === 'function') {
        renderInlineCartControls();
    }
}

// Render Cart Items UI
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

// Process Checkout
async function processCheckout() {
    const name = custName.value.trim();
    const address = custAddress.value.trim();
    
    if (!name || !address) {
        alert('Please enter your name and delivery address.');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    let orderItemsText = "";
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        orderItemsText += `${item.quantity}x ${item.name} (₹${itemTotal})\n`;
    });
    
    const formData = new FormData();
    formData.append('_subject', `New Order from ${name}`);
    formData.append('Customer Name', name);
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
            // Clear cart
            cart = [];
            saveCart();
            updateCartCount();
            toggleCart();
            custName.value = '';
            custAddress.value = '';
        } else {
            alert('Oops! There was a problem placing your order.');
        }
    } catch (error) {
        alert('Oops! There was a problem connecting to the server.');
    } finally {
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
    }
}

// Initialize on page load
updateCartCount();


// --- PREMIUM UI EFFECTS & INLINE CART ---
window.renderInlineCartControls = function() {
    const containers = document.querySelectorAll('.add-to-cart-container');
    containers.forEach(container => {
        const name = container.getAttribute('data-item-name');
        const price = parseInt(container.getAttribute('data-item-price'));
        const item = cart.find(i => i.name === name);
        
        if (item) {
            container.innerHTML = `
                <div class="inline-qty-controls">
                    <button class="inline-qty-btn" onclick="updateQuantity('${name}', -1)">-</button>
                    <span class="inline-qty-val">${item.quantity}</span>
                    <button class="inline-qty-btn" onclick="updateQuantity('${name}', 1)">+</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button class="add-cart-btn" style="margin-top:0.75rem;" onclick="addToCart('${name}', ${price})">Add to Cart</button>
            `;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Progress & Parallax Hero
    const progressBar = document.getElementById('scroll-progress');
    const heroImg = document.getElementById('hero-img');
    
    window.addEventListener('scroll', () => {
        // Scroll Progress
        if (progressBar) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + "%";
        }
        
        // Parallax Hero
        if (heroImg) {
            const scrollY = window.scrollY;
            heroImg.style.transform = `translateY(${scrollY * 0.4}px)`;
        }
    }, { passive: true });
    
    // 2. Sticky Menu Tabs Highlighting
    const menuCats = document.querySelectorAll('.menu-cat');
    const menuTabs = document.querySelectorAll('.menu-tab');
    
    if (menuCats.length > 0 && menuTabs.length > 0) {
        const catObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    menuTabs.forEach(tab => {
                        tab.classList.remove('active');
                        if (tab.getAttribute('href') === `#${id}`) {
                            tab.classList.add('active');
                            const tabsContainer = document.getElementById('menu-tabs');
                            if (tabsContainer) {
                                tabsContainer.scrollTo({
                                    left: tab.offsetLeft - tabsContainer.offsetWidth / 2 + tab.offsetWidth / 2,
                                    behavior: 'smooth'
                                });
                            }
                        }
                    });
                }
            });
        }, { threshold: 0.1, rootMargin: '-150px 0px -50% 0px' });
        
        menuCats.forEach(cat => catObserver.observe(cat));
    }
    
    // Initial render
    renderInlineCartControls();
});
