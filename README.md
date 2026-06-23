# Jain Cafe

A responsive, premium web application for Jain Cafe (YN Road, Indore) featuring a dynamic menu system, a robust shopping cart, and a password-protected administrator dashboard.

## 🚀 Key Features

* **Tab-Based Category Filtering**: Eliminates vertical scroll fatigue by rendering one category grid at a time (inspired by Swiggy/Zomato UX).
* **Live Search**: Customers can instantly search and filter items inside the active category tab.
* **Premium Text-Only Cards**: Elegant layouts featuring category emojis, veg dots, item descriptions, and bestseller badges.
* **Dynamic Cart System**: LocalStorage-based cart with custom slide-out sidebar, quantity controllers, and a responsive mobile checkout bar.
* **Formspree Checkout**: Routes placed orders and contact submissions directly to the owner's inbox.
* **Admin Dashboard (`/admin`)**: A password-protected panel enabling real-time addition, editing, and deletion of categories and menu items.
* **Express Backend (`server.js`)**: Serves static pages and provides REST API routes to load and modify the JSON menu structure dynamically.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, Flexbox, Grid), JavaScript (ES6)
* **Backend**: Node.js, Express.js, CORS
* **Storage**: Local JSON database (`data/menu.json`)
* **Utilities**: Feather Icons, Formspree AJAX integration

---

## 💻 Local Setup & Installation

1. **Install Dependencies**:
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Launch the Server**:
   Start the Node server:
   ```bash
   node server.js
   ```

3. **Open the App**:
   - **Customer Landing & Menu**: Navigate to [http://localhost:3000](http://localhost:3000)
   - **Admin Panel**: Navigate to [http://localhost:3000/admin.html](http://localhost:3000/admin.html) (Password is configured in `server.js`)

---

## 🌐 Live Deployments (डिप्लॉयमेंट लिंक्स)

This project is deployed on two different hosting platforms. Here is what each is used for:

### 1. Render Deployment (Recommended for Full Features)
* **Link**: [https://jain-cafe-sqts.onrender.com](https://jain-cafe-sqts.onrender.com)
* **What it does**: Runs the full Node.js Express server backend (`server.js`) 24/7.
* **Admin Panel**: **Fully Functional (सक्रिय)**. Any changes you make to the menu (adding, editing, or deleting categories and dishes) will be saved permanently.

### 2. Vercel Deployment (Static Frontend Preview)
* **Link**: [https://jain-cafe-sqts.vercel.app](https://jain-cafe-sqts.vercel.app)
* **What it does**: Hosts the frontend static client files with extremely fast loading speeds.
* **Admin Panel**: **Static Preview Only (Read-Only)**. You can log in and view the dashboard, but you cannot save any menu updates because Vercel's serverless environment does not run a persistent Express server database.

---

## 📄 License

MIT
