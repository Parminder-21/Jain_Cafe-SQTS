/**
 * Client-side script to dynamically fetch, search, and render menu items.
 * Layout is text-only (Swiggy-style) with no food images.
 */

const API_BASE = '/api';
let allCategories = [];

// Inject menu components styling dynamically
(function injectStyles() {
    const style = document.createElement('style');
    style.id = 'menu-renderer-styles';
    style.textContent = `
    /* Shimmering Skeleton Loader */
    @keyframes shimmer {
        0% { background-position: -600px 0; }
        100% { background-position: 600px 0; }
    }
    .skel {
        border-radius: 8px;
        background: linear-gradient(90deg,
            var(--surface-alt) 25%,
            var(--border) 50%,
            var(--surface-alt) 75%);
        background-size: 600px 100%;
        animation: shimmer 1.5s infinite linear;
    }
    .skel-name { height: 18px; width: 70%; margin-bottom: 8px; }
    .skel-price { height: 16px; width: 30%; }
    .skel-card { pointer-events: none; opacity: 0.7; }

    /* Category Search Box */
    .menu-search-wrap {
        margin-bottom: 1.75rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .menu-search-box {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex: 1;
        max-width: 380px;
        background: var(--surface);
        border: 1.5px solid var(--border);
        border-radius: 50px;
        padding: 0.6rem 1.1rem;
        transition: border-color 0.3s ease;
    }
    .menu-search-box:focus-within {
        border-color: var(--terracotta);
    }
    .menu-search-box svg {
        color: var(--text-muted);
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }
    .menu-search-box input {
        border: none;
        outline: none;
        background: none;
        font-family: 'Outfit';
        font-size: 0.95rem;
        color: var(--text);
        flex: 1;
        min-width: 0;
    }
    .menu-search-box input::placeholder {
        color: var(--text-muted);
    }
    .search-count {
        font-size: 0.82rem;
        color: var(--text-muted);
        font-weight: 500;
        white-space: nowrap;
    }

    /* Menu Panel Layout Grid */
    .menu-panel-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.1rem;
        animation: panelFadeIn 0.35s ease;
    }
    @media (max-width: 640px) {
        .menu-panel-grid { grid-template-columns: 1fr; }
    }

    /* Premium Text-Only Item Cards */
    .mc-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1.25rem;
        background: var(--surface);
        border: 1.5px solid var(--border);
        border-radius: 16px;
        padding: 1.25rem 1.25rem;
        transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        position: relative;
        overflow: hidden;
        min-height: 110px;
    }
    .mc-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--terracotta), var(--saffron));
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
    }
    .mc-card:hover {
        border-color: rgba(211,106,77,0.35);
        transform: translateY(-3px);
        box-shadow: 0 10px 32px rgba(211,106,77,0.12);
    }
    .mc-card:hover::before {
        transform: scaleX(1);
    }

    .mc-card-left {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    .mc-veg {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .mc-veg-dot {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        border: 1.5px solid #21a052;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .mc-veg-dot::after {
        content: '';
        width: 7px;
        height: 7px;
        background: #21a052;
        border-radius: 50%;
    }
    .mc-name {
        font-family: 'Outfit', sans-serif;
        font-size: 0.98rem;
        font-weight: 700;
        color: var(--text);
        line-height: 1.35;
    }
    .mc-popular-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        background: rgba(235,160,102,0.15);
        color: var(--saffron);
        border: 1px solid rgba(235,160,102,0.3);
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 20px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        margin-left: 0.35rem;
        vertical-align: middle;
    }
    .mc-desc {
        font-size: 0.8rem;
        color: var(--text-muted);
        line-height: 1.5;
        margin-top: 0.1rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .mc-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.25rem;
    }
    .mc-price {
        font-family: 'Outfit';
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--terracotta);
        letter-spacing: -0.5px;
    }

    /* Right-side Controls Container */
    .mc-btn-wrap {
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 96px;
    }

    /* ADD/Quantity selector buttons */
    .mc-add-btn {
        background: var(--surface);
        border: 2px solid var(--terracotta);
        color: var(--terracotta);
        padding: 0.35rem 0.9rem;
        border-radius: 8px;
        font-family: 'Outfit';
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.2s, color 0.2s, transform 0.15s;
        box-shadow: 0 2px 8px rgba(211,106,77,0.15);
        width: 100%;
        text-align: center;
    }
    .mc-add-btn:hover {
        background: var(--terracotta);
        color: #fff;
        transform: scale(1.05);
    }
    .mc-qty-wrap {
        display: inline-flex;
        align-items: center;
        border: 2px solid var(--terracotta);
        border-radius: 8px;
        overflow: hidden;
        width: 100%;
    }
    .mc-qty-btn {
        background: var(--terracotta);
        border: none;
        color: #fff;
        width: 30px;
        height: 32px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .mc-qty-btn:hover {
        opacity: 0.82;
    }
    .mc-qty-val {
        flex: 1;
        text-align: center;
        font-family: 'Outfit';
        font-size: 0.92rem;
        font-weight: 700;
        color: var(--text);
        background: transparent;
    }

    /* Animations and Empty States */
    @keyframes panelFadeIn {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .menu-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-muted);
    }
    .menu-empty span {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 0.75rem;
    }
    .menu-note {
        background: rgba(211,106,77,0.08);
        border-left: 3px solid var(--terracotta);
        color: var(--terracotta);
        border-radius: 0 8px 8px 0;
        padding: 0.6rem 1rem;
        font-size: 0.88rem;
        font-weight: 500;
        margin-bottom: 1.25rem;
    }
    `;
    document.head.appendChild(style);
})();

// Fetch menu metadata from the server and render category tabs
async function initializeMenu() {
    const container = document.getElementById('menu-categories-container');
    const tabsEl = document.getElementById('menu-tabs');
    if (!container || !tabsEl) return;

    let data = null;

    // Attempt 1: Fetch from backend Express API
    try {
        const response = await fetch(`${API_BASE}/menu`);
        if (response.ok) {
            data = await response.json();
        } else {
            console.warn(`[Menu Renderer] API returned status ${response.status}. Trying static fallback...`);
        }
    } catch (err) {
        console.warn('[Menu Renderer] API connection failed. Trying static fallback...', err);
    }

    // Attempt 2: Fetch from static fallback JSON file (works on Vercel and local static servers)
    if (!data) {
        try {
            const response = await fetch('data/menu.json');
            if (response.ok) {
                data = await response.json();
                console.log('[Menu Renderer] Successfully loaded menu from static fallback file.');
            } else {
                throw new Error(`Static fallback returned status ${response.status}`);
            }
        } catch (err) {
            container.innerHTML = `
                <div class="menu-empty">
                    <span>⚠️</span>
                    <p>Unable to load the menu. Please check that the server is online.</p>
                </div>`;
            tabsEl.innerHTML = '';
            console.error('[Menu Renderer] Both API and static fallback failed:', err);
            return;
        }
    }

    try {
        allCategories = data.categories;

        // Build navigation tabs
        tabsEl.innerHTML = allCategories.map((cat, i) => `
            <button class="menu-tab ${i === 0 ? 'active' : ''}"
                    data-index="${i}"
                    aria-selected="${i === 0}">
                ${cat.emoji} ${cat.name}
            </button>
        `).join('');

        // Wire click handler to switch categories
        tabsEl.querySelectorAll('.menu-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index, 10);
                tabsEl.querySelectorAll('.menu-tab').forEach((tab, tIdx) => {
                    tab.classList.toggle('active', tIdx === idx);
                    tab.setAttribute('aria-selected', tIdx === idx);
                });
                renderCategoryPanel(allCategories[idx], container);
                
                // Smooth scroll view to active category section
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // Show first category by default
        renderCategoryPanel(allCategories[0], container);

    } catch (err) {
        container.innerHTML = `
            <div class="menu-empty">
                <span>⚠️</span>
                <p>Unable to process menu data.</p>
            </div>`;
        tabsEl.innerHTML = '';
        console.error('[Menu Renderer] Processing error:', err);
    }
}

// Render the grid containing search bar and item cards for the selected category
function renderCategoryPanel(cat, container) {
    if (!cat) return;

    let searchVal = '';

    function buildGrid(items) {
        if (!items.length) {
            return `<div class="menu-empty"><span>🔍</span><p>No dishes found matching your search.</p></div>`;
        }
        return items.map(item => buildCard(item)).join('');
    }

    function buildCard(item) {
        const cartItem = getCartItem(item.name);
        const qty = cartItem ? cartItem.quantity : 0;
        const safeId = esc(item.id || item.name.replace(/\s+/g, '-'));
        const safeName = esc(item.name);
        const safePrice = item.price;

        const addControl = qty > 0
            ? `<div class="mc-qty-wrap">
                 <button class="mc-qty-btn" onclick="mcDecrement('${safeName}', ${safePrice})">−</button>
                 <span class="mc-qty-val">${qty}</span>
                 <button class="mc-qty-btn" onclick="mcIncrement('${safeName}', ${safePrice})">+</button>
               </div>`
            : `<button class="mc-add-btn" onclick="mcAdd('${safeName}', ${safePrice})">ADD +</button>`;

        return `
        <div class="mc-card" id="mc-${safeId}">
            <div class="mc-card-left">
                <div class="mc-veg"><div class="mc-veg-dot"></div></div>
                <div class="mc-name">
                    ${item.name}${item.popular ? '<span class="mc-popular-tag">★ Bestseller</span>' : ''}
                </div>
                ${item.desc ? `<div class="mc-desc">${item.desc}</div>` : ''}
                <div class="mc-bottom">
                    <div class="mc-price">₹${item.price}</div>
                </div>
            </div>
            <div class="mc-btn-wrap">
                ${addControl}
            </div>
        </div>`;
    }

    function refresh() {
        const query = searchVal.toLowerCase();
        const filtered = query
            ? cat.items.filter(item => item.name.toLowerCase().includes(query))
            : cat.items;
        grid.innerHTML = buildGrid(filtered);
        if (countEl) countEl.textContent = `${filtered.length} items`;
    }

    // Assemble structure
    container.innerHTML = `
        <div class="menu-search-wrap">
            <div class="menu-search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" id="mc-search" placeholder="Search in ${cat.name}…" autocomplete="off">
            </div>
            <span class="search-count" id="mc-count">${cat.items.length} items</span>
        </div>
        ${cat.note ? `<div class="menu-note">ℹ️ ${cat.note}</div>` : ''}
        <div class="menu-panel-grid" id="mc-grid">
            ${buildGrid(cat.items)}
        </div>
    `;

    const grid = container.querySelector('#mc-grid');
    const countEl = container.querySelector('#mc-count');

    // Live search filter input
    container.querySelector('#mc-search').addEventListener('input', e => {
        searchVal = e.target.value;
        refresh();
    });

    // Share update function globally for sync
    window._mcRefreshPanel = refresh;
}

// Helpers for localStorage cart state retrieval
function getCartItem(name) {
    try {
        const cached = JSON.parse(localStorage.getItem('jainCafeCart') || '[]');
        return cached.find(item => item.name === name) || null;
    } catch {
        return null;
    }
}

// Global action handlers wired to card buttons
window.mcAdd = function(name, price) {
    if (typeof addToCart === 'function') {
        addToCart(name, price);
    }
    setTimeout(() => { if (window._mcRefreshPanel) window._mcRefreshPanel(); }, 50);
};

window.mcIncrement = function(name, price) {
    if (typeof updateQuantity === 'function') {
        updateQuantity(name, 1);
    }
    setTimeout(() => { if (window._mcRefreshPanel) window._mcRefreshPanel(); }, 50);
};

window.mcDecrement = function(name, price) {
    if (typeof updateQuantity === 'function') {
        updateQuantity(name, -1);
    }
    setTimeout(() => { if (window._mcRefreshPanel) window._mcRefreshPanel(); }, 50);
};

// String escaping helper
function esc(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Bootstrap menu loader
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMenu);
} else {
    initializeMenu();
}
