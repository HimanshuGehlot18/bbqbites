# 🍖 BBQ Bites - Online Food Ordering Web App

Welcome to **BBQ Bites**, a modern, responsive, and interactive online food ordering web application. BBQ Bites offers a seamless dining experience right from your browser—allowing users to explore a mouth-watering menu, manage a dynamic shopping cart, customize item quantities with smooth transitions, sign up/in using an animated interface, and complete order checkout via a simulated billing page.

---

## 🌟 Key Features

*   **Interactive Menu Listing**: Dynamically renders popular food items fetched from a local JSON product feed, featuring high-quality images, pricing, and add-to-cart buttons.
*   **Slide-out Cart Drawer**:
    *   Add items to the cart instantly.
    *   Prevent double-adding with user-friendly toast notifications.
    *   Increment/decrement quantities dynamically.
    *   Smooth "slide-out" transition animation when removing products (setting quantity to 0).
    *   Persistent cart storage across page loads using `localStorage`.
*   **Interactive Reviews Section**: A fully functional testimonials carousel powered by **SwiperJS** featuring user ratings and reviews.
*   **Sign-In & Registration Portal**: A polished, modern split-screen signup/signin transition page with sliding panel animations.
*   **Order Checkout & Billing Form**:
    *   Renders order summaries and calculates grand totals directly from `localStorage`.
    *   Simulated secure credit card billing form.
    *   Successful order placement with transaction confirmation and automated cart clearance.
*   **Responsive Web Design**: Optimized layouts across mobile devices, tablets, and desktop displays using CSS Flexbox, Grid, and Media Queries.

---

## 🛠️ Technology Stack

*   **Frontend Core**: HTML5, Vanilla CSS3, JavaScript (ES6+)
*   **Carousel Component**: [SwiperJS](https://swiperjs.com/) (version 11)
*   **Icon Library**: [FontAwesome Icons](https://fontawesome.com/) (version 7)
*   **Web Storage API**: `localStorage` (for persistent client-side cart operations)
*   **Backend Server**: Python, Flask (managing REST APIs, session control, and asset redirects)
*   **Database**: SQLite3 (for orders, contact forms, and newsletter subscribers)

---

## 📁 Project Structure

```text
BBQbites/
├── admin/                 # Admin Control Panel folder
│   ├── admin.css          # Styles for the admin dashboard
│   ├── admin.html         # Admin dashboard panel template
│   ├── admin.js           # Admin AJAX database operations & stats updates
│   └── admin_login.html   # Admin login template
├── checkout/
│   ├── checkout.css       # Custom styles for the checkout interface
│   ├── checkout.html      # Checkout summary page structure
│   └── checkout.js        # Checkout billing form handling and order processing
├── database/              # SQLite database storage folder
│   └── bbqbites.db        # Live application SQLite database
├── image/                 # Directory containing product pictures and assets
├── login/
│   ├── login.css          # Login/Register split-screen sliding animations
│   ├── login.html         # Sign In and Sign Up page templates
│   └── login.js           # Interactive animation triggers for account navigation
├── about.html             # "About Us" information page
├── app.py                 # Flask Backend server (API endpoints, routing, session control, DB initialization)
├── contact.html           # "Contact Us" feedback and location details page
├── index.html             # Core landing page (Hero, Services, Menu, Reviews)
├── main.js                # Core JS logic: cart processing, Swiper details, toast notices
├── products.json          # Mock database specifying 8 BBQ Bites signature products
├── requirements.txt       # Python environment dependencies
├── style.css              # Main application styling and system variables
└── README.md              # This documentation
```

> [!NOTE]
> Duplicate copies of `admin.css`, `admin.html`, `admin.js`, `admin_login.html`, and `bbqbites.db` have been removed from the main/root directory to maintain directory organization and prevent code redundancy.

---

## 🍔 Menu Products Config (`products.json`)

The application consumes mock database entries in `products.json`. Here are the delicious items currently supported:

| ID | Item Name | Price | Image Path |
| :--- | :--- | :---: | :--- |
| **1** | Double Beef Burger | \$9.67 | `image/burger.png` |
| **2** | Veggie Pizza | \$10.99 | `image/pizza.png` |
| **3** | Fried Chicken | \$13.45 | `image/fried-chicken.png` |
| **4** | Chicken Roll | \$7.50 | `image/chicken-roll.png` |
| **5** | Sub Sandwich | \$6.99 | `image/sandwich.png` |
| **6** | Chicken Lasagna | \$16.45 | `image/lasagna.png` |
| **7** | Italian Spaghetti | \$7.65 | `image/spaghetti.png` |
| **8** | Spring Roll | \$9.31 | `image/spring-roll.png` |

---

## 🔌 Setup & Local Execution

To run the full application with the Python Flask backend and SQLite database:

### 🐍 Option 1: Python Flask Backend (Recommended)

1. Make sure Python 3 is installed.
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```
   *Alternatively, you can start the application using:*
   ```bash
   flask run
   ```
4. Access the web application in your browser at `http://localhost:5000` (or `http://127.0.0.1:5000`).

### 🔑 Admin Dashboard Access
*   **Link**: `/admin.html` or `/admin/admin.html`
*   **Username**: `admin`
*   **Password**: `password123`

### 🌐 Option 2: Static Server (No Database functionality)
*If you only want to view frontend styles and static files (note that contact form, admin login, and order checkouts require Option 1):*
*   **Live Server**: Open the project folder in VS Code, and click **Go Live** on the bottom right.
*   **Python HTTP Server**: Run `python -m http.server 8000` in the directory, and visit `http://localhost:8000`.
*   **NodeJS**: Run `npx http-server -p 8000` in the directory, and visit `http://localhost:8000`.

---

## 💡 Key Code Mechanisms

### 🛒 Persistent Shopping Cart
Cart state changes are recorded dynamically. Below is a glance at the state storage routines in [main.js](file:///c:/Users/dell/Desktop/projects/BBQbites/BBQbites/main.js):
```javascript
// Load cart from localStorage or start fresh
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Save state updates
const saveCart = () => {
  localStorage.setItem("cart", JSON.stringify(cart));
};
```

### 🔔 Slide-out Cart Item Removal Animation
When a user lowers an item's quantity to 0, instead of removing it instantly, a CSS `slide-out` animation is triggered:
```javascript
itemElement.classList.add('slide-out');
itemElement.addEventListener('transitionend', () => {
  cart = cart.filter(p => p.id !== productId);
  saveCart();
  renderCart();
}, { once: true });
```
This transition is styled in [style.css](file:///c:/Users/dell/Desktop/projects/BBQbites/BBQbites/style.css) with a smooth transform translate-x effect.

---

## 🚀 Future Roadmap

*   **[Completed] Backend Integration**: Connected the application to a Python Flask server featuring session control and REST APIs.
*   **[Completed] Database Integration**: Enabled persistence using an SQLite3 database (`database/bbqbites.db`) to record client orders, contact logs, and newsletter subscribers.
*   **[Completed] Admin Dashboard**: Created a protected dashboard folder (`admin/`) containing HTML/CSS/JS files for analytics, demo seeding, and database records cleaning.
*   **Interactive Map Routing**: Integrate Google Maps API to track real-time delivery boy locations.
