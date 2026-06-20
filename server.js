const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const MENU_FILE = path.join(__dirname, 'data', 'menu.json');
const ADMIN_PASSWORD = 'jaincafe2025';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve client assets directly from root directory

// Read menu structure from JSON storage file
function readMenu() {
    return JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'));
}

// Persist menu modifications to JSON storage file
function writeMenu(data) {
    fs.writeFileSync(MENU_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Generate unique identifier strings for categories and dishes
function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/* ──────────────────────────────────────────
   AUTHENTICATION ENDPOINT
   ────────────────────────────────────────── */
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: 'admin-authenticated' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }
});

/* ──────────────────────────────────────────
   MENU API ENDPOINTS
   ────────────────────────────────────────── */

// Get the full menu tree
app.get('/api/menu', (req, res) => {
    try {
        const menu = readMenu();
        res.json(menu);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve menu data.' });
    }
});

// Create a new menu category
app.post('/api/categories', (req, res) => {
    const { name, emoji } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const menu = readMenu();
    const newCat = {
        id: generateId('cat'),
        name,
        emoji: emoji || '🍽️',
        items: []
    };

    menu.categories.push(newCat);
    writeMenu(menu);
    res.json({ success: true, category: newCat });
});

// Delete a category and its items
app.delete('/api/categories/:catId', (req, res) => {
    const menu = readMenu();
    const idx = menu.categories.findIndex(c => c.id === req.params.catId);
    if (idx === -1) return res.status(404).json({ error: 'Category not found.' });

    menu.categories.splice(idx, 1);
    writeMenu(menu);
    res.json({ success: true });
});

// Add an item to a category
app.post('/api/categories/:catId/items', (req, res) => {
    const { name, price, popular, desc } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required.' });
    }

    const menu = readMenu();
    const cat = menu.categories.find(c => c.id === req.params.catId);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    const newItem = {
        id: generateId('item'),
        name,
        price: parseFloat(price),
        popular: popular || false,
        desc: desc || ''
    };

    cat.items.push(newItem);
    writeMenu(menu);
    res.json({ success: true, item: newItem });
});

// Update a menu item
app.put('/api/categories/:catId/items/:itemId', (req, res) => {
    const { name, price, popular, desc } = req.body;
    const menu = readMenu();
    const cat = menu.categories.find(c => c.id === req.params.catId);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    const item = cat.items.find(i => i.id === req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = parseFloat(price);
    if (popular !== undefined) item.popular = popular;
    if (desc !== undefined) item.desc = desc;

    writeMenu(menu);
    res.json({ success: true, item });
});

// Remove a menu item
app.delete('/api/categories/:catId/items/:itemId', (req, res) => {
    const menu = readMenu();
    const cat = menu.categories.find(c => c.id === req.params.catId);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    const idx = cat.items.findIndex(i => i.id === req.params.itemId);
    if (idx === -1) return res.status(404).json({ error: 'Item not found.' });

    cat.items.splice(idx, 1);
    writeMenu(menu);
    res.json({ success: true });
});

/* ──────────────────────────────────────────
   CLIENT TEMPLATE ENDPOINTS
   ────────────────────────────────────────── */
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n✅ Jain Cafe Server is RUNNING!`);
    console.log(`\n   🌐 Main Site  →  http://localhost:${PORT}`);
    console.log(`   🔐 Admin Panel →  http://localhost:${PORT}/admin\n`);
});
