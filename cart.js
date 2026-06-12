let cart = [];

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
    updateCartCount();
    
    // Quick open cart for feedback
    if (!cartSidebar.classList.contains('active')) {
        toggleCart();
    } else {
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
    updateCartCount();
    renderCart();
}

// Update Cart Badge
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (totalItems > 0) {
        checkoutFormContainer.style.display = 'block';
        checkoutBtn.disabled = false;
    } else {
        checkoutFormContainer.style.display = 'none';
        checkoutBtn.disabled = true;
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
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity('${item.name}', -1)">-</button>
                    <span class="item-qty">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.name}', 1)">+</button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = html;
    cartTotalPrice.textContent = `₹${total}`;
    
    // Re-initialize feather icons if any new ones were added
    if(typeof feather !== 'undefined') feather.replace();
}

// Process Checkout
function processCheckout() {
    const name = custName.value.trim();
    const address = custAddress.value.trim();
    
    if (!name || !address) {
        alert('Please enter your name and delivery address.');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    let orderDetails = `*New Order from Jain Cafe*%0A%0A`;
    orderDetails += `*Name:* ${name}%0A`;
    orderDetails += `*Address:* ${address}%0A`;
    orderDetails += `*Payment Method:* ${paymentMethod}%0A%0A`;
    orderDetails += `*Order Items:*%0A`;
    
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        orderDetails += `- ${item.quantity}x ${item.name} (₹${itemTotal})%0A`;
    });
    
    orderDetails += `%0A*Grand Total: ₹${total}*`;

    // Add dummy phone number as requested
    const phone = "919876543210"; 
    
    // Redirect to WhatsApp
    const whatsappUrl = `https://wa.me/${phone}?text=${orderDetails}`;
    window.open(whatsappUrl, '_blank');
    
    // Clear cart after redirect
    cart = [];
    updateCartCount();
    toggleCart();
    custName.value = '';
    custAddress.value = '';
}
