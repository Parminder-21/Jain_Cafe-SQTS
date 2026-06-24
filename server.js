const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
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

const HISTORY_FILE = path.join(__dirname, 'data', 'history.json');

function readHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
        }
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeHistory(data) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function addHistoryEntry(actionType, details) {
    const history = readHistory();
    const newEntry = {
        id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        actionType,
        undone: false,
        ...details
    };
    history.push(newEntry);
    writeHistory(history);
}

// Generate unique identifier strings for categories and dishes
function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/* ──────────────────────────────────────────
   DEBUG / STATUS ENDPOINT
   ────────────────────────────────────────── */
app.get('/api/test', (req, res) => {
    res.send('Express backend is running successfully!');
});

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

    addHistoryEntry('add_category', {
        description: `Added category "${newCat.emoji} ${newCat.name}"`,
        catId: newCat.id,
        catName: newCat.name,
        emoji: newCat.emoji
    });

    res.json({ success: true, category: newCat });
});

// Delete a category and its items
app.delete('/api/categories/:catId', (req, res) => {
    const menu = readMenu();
    const idx = menu.categories.findIndex(c => c.id === req.params.catId);
    if (idx === -1) return res.status(404).json({ error: 'Category not found.' });

    const catToDelete = menu.categories[idx];

    addHistoryEntry('delete_category', {
        description: `Deleted category "${catToDelete.emoji} ${catToDelete.name}" (${catToDelete.items.length} items)`,
        catId: catToDelete.id,
        catName: catToDelete.name,
        categoryDetails: catToDelete
    });

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

    addHistoryEntry('add_item', {
        description: `Added item "${newItem.name}" to category "${cat.emoji} ${cat.name}"`,
        catId: cat.id,
        catName: cat.name,
        itemId: newItem.id,
        itemName: newItem.name,
        itemDetails: newItem
    });

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

    const oldItem = { ...item };

    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = parseFloat(price);
    if (popular !== undefined) item.popular = popular;
    if (desc !== undefined) item.desc = desc;

    writeMenu(menu);

    addHistoryEntry('edit_item', {
        description: `Updated item "${item.name}" in category "${cat.emoji} ${cat.name}"`,
        catId: cat.id,
        itemId: item.id,
        itemName: item.name,
        before: oldItem,
        after: { ...item }
    });

    res.json({ success: true, item });
});

// Remove a menu item
app.delete('/api/categories/:catId/items/:itemId', (req, res) => {
    const menu = readMenu();
    const cat = menu.categories.find(c => c.id === req.params.catId);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    const idx = cat.items.findIndex(i => i.id === req.params.itemId);
    if (idx === -1) return res.status(404).json({ error: 'Item not found.' });

    const itemToDelete = cat.items[idx];

    addHistoryEntry('delete_item', {
        description: `Deleted item "${itemToDelete.name}" from category "${cat.emoji} ${cat.name}"`,
        catId: cat.id,
        catName: cat.name,
        itemId: itemToDelete.id,
        itemName: itemToDelete.name,
        itemDetails: itemToDelete
    });

    cat.items.splice(idx, 1);
    writeMenu(menu);
    res.json({ success: true });
});

/* ──────────────────────────────────────────
   HISTORY API ENDPOINTS
   ────────────────────────────────────────── */

// Get history logs
app.get('/api/history', (req, res) => {
    try {
        const history = readHistory();
        res.json(history.slice().reverse());
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve history data.' });
    }
});

// Clear all history logs
app.delete('/api/history', (req, res) => {
    try {
        writeHistory([]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear history.' });
    }
});

// Undo a history action
app.post('/api/history/undo/:id', (req, res) => {
    const { id } = req.params;
    const history = readHistory();
    const entryIdx = history.findIndex(h => h.id === id);

    if (entryIdx === -1) {
        return res.status(404).json({ error: 'History entry not found.' });
    }

    const entry = history[entryIdx];
    if (entry.undone) {
        return res.status(400).json({ error: 'This action has already been undone.' });
    }

    const menu = readMenu();
    let success = false;
    let message = '';

    try {
        switch (entry.actionType) {
            case 'delete_item': {
                let cat = menu.categories.find(c => c.id === entry.catId);
                if (!cat) {
                    cat = {
                        id: entry.catId,
                        name: entry.catName || 'Restored Category',
                        emoji: '🍽️',
                        items: []
                    };
                    menu.categories.push(cat);
                }
                if (!cat.items.some(i => i.id === entry.itemId)) {
                    cat.items.push(entry.itemDetails);
                }
                success = true;
                message = `Restored item "${entry.itemName}" to "${cat.name}"`;
                break;
            }

            case 'delete_category': {
                if (!menu.categories.some(c => c.id === entry.catId)) {
                    menu.categories.push(entry.categoryDetails);
                    success = true;
                    message = `Restored category "${entry.catName}" with items.`;
                } else {
                    return res.status(400).json({ error: 'Category already exists.' });
                }
                break;
            }

            case 'add_item': {
                const cat = menu.categories.find(c => c.id === entry.catId);
                if (cat) {
                    const itemIdx = cat.items.findIndex(i => i.id === entry.itemId);
                    if (itemIdx !== -1) {
                        cat.items.splice(itemIdx, 1);
                        success = true;
                        message = `Removed added item "${entry.itemName}"`;
                    } else {
                        return res.status(400).json({ error: 'Item not found in category.' });
                    }
                } else {
                    return res.status(400).json({ error: 'Category not found.' });
                }
                break;
            }

            case 'add_category': {
                const catIdx = menu.categories.findIndex(c => c.id === entry.catId);
                if (catIdx !== -1) {
                    const cat = menu.categories[catIdx];
                    if (cat.items.length > 0) {
                        return res.status(400).json({ error: 'Cannot undo: Category now contains items.' });
                    }
                    menu.categories.splice(catIdx, 1);
                    success = true;
                    message = `Removed added category "${entry.catName}"`;
                } else {
                    return res.status(400).json({ error: 'Category not found.' });
                }
                break;
            }

            case 'edit_item': {
                const cat = menu.categories.find(c => c.id === entry.catId);
                if (cat) {
                    const item = cat.items.find(i => i.id === entry.itemId);
                    if (item) {
                        Object.assign(item, entry.before);
                        success = true;
                        message = `Restored item "${entry.itemName}" to previous state.`;
                    } else {
                        return res.status(400).json({ error: 'Item not found.' });
                    }
                } else {
                    return res.status(400).json({ error: 'Category not found.' });
                }
                break;
            }

            default:
                return res.status(400).json({ error: 'Unsupported undo action.' });
        }

        if (success) {
            writeMenu(menu);
            entry.undone = true;
            writeHistory(history);
            
            // Add a history log for the undo itself
            const undoHistory = readHistory();
            undoHistory.push({
                id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                timestamp: new Date().toISOString(),
                actionType: 'undo_action',
                undone: false,
                description: `Undid action: ${entry.description}`
            });
            writeHistory(undoHistory);

            return res.json({ success: true, message });
        } else {
            return res.status(500).json({ error: 'Failed to perform undo.' });
        }

    } catch (err) {
        return res.status(500).json({ error: `Error during undo: ${err.message}` });
    }
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
