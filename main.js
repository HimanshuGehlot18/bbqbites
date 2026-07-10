document.addEventListener("DOMContentLoaded", () => {
  const swiperEl = document.querySelector(".mySwiper");
  if (swiperEl) {
    new Swiper(swiperEl, {
      loop: true,
      navigation: {
        nextEl: "#next",
        prevEl: "#prev",
      },
    });
  }

  // --- Element Selections ---
  const cartIcon = document.querySelector(".cart-icon");
  const cartTab = document.querySelector(".cart-tab");
  const closeBtn = document.querySelector(".close-btn");
  const cardlist = document.querySelector(".card-list");
  const cartList = document.querySelector(".cart-list");
  const cartTotal = document.querySelector(".cart-total");
  const cartVlaue = document.querySelector(".cart-value");
  const HamBurgur = document.querySelector(".hamburger");
  const MobileMenu = document.querySelector(".mobile-menu");
  const bars = document.querySelector(".fa-bars");

  // --- Event Listeners for UI ---
  if (cartIcon) {
    cartIcon.addEventListener("click", (e) => {
      e.preventDefault();
      cartTab.classList.add("cart-tab-active");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cartTab.classList.remove("cart-tab-active");
    });
  }

  if (HamBurgur) {
    HamBurgur.addEventListener("click", () => {
      MobileMenu.classList.toggle("active");
      if (bars.classList.contains("fa-bars")) {
        bars.classList.remove("fa-bars");
        bars.classList.add("fa-xmark");
      } else {
        bars.classList.remove("fa-xmark");
        bars.classList.add("fa-bars");
      }
    });
  }

  // --- Notification Toast ---
  const showNotification = (message) => {
    const toast = document.createElement('div');
    toast.classList.add('notification-toast');
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 100); // Small delay to allow the element to be in the DOM

    // Animate out and remove after a few seconds
    setTimeout(() => {
      toast.classList.remove('show');
      // Remove the element from DOM after the transition ends
      toast.addEventListener('transitionend', () => toast.remove());
    }, 2500); // The notification will be visible for 2.5 seconds
  };

  // --- Cart Logic ---
  let productlist = [];
  // 1. Load cart from localStorage or start with an empty array
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Function to save the cart to localStorage
  const saveCart = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
  };

  // Function to update totals and cart value icon
  const updateTotals = () => {
    let totalPrice = 0;
    let totalQunatity = 0;

    cart.forEach((product) => {
      let price = parseFloat(product.price.replace("$", ""));
      totalPrice += price * product.quantity;
      totalQunatity += product.quantity;
    });

    if (cartTotal && cartVlaue) {
      cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
      cartVlaue.textContent = totalQunatity;
    }
  };

  // Renders a single product item in the cart panel
  const renderCartItem = (product) => {
    if (!cartList) return;

    let price = parseFloat(product.price.replace("$", ""));

    const cartITEM = document.createElement("div");
    cartITEM.classList.add("item");
    cartITEM.dataset.id = product.id; // Use data-id to find the item later

    cartITEM.innerHTML = `
      <div class="item-image">
        <img src="${product.image}">
      </div>
      <div class="item-content">
        <h4>${product.name}</h4>
        <h4 class="item-total">$${(price * product.quantity).toFixed(2)}</h4>
      </div>
      <div class="flex">
        <a href="#" class="quantity-btn minus">
          <i class="fa-solid fa-minus"></i>
        </a>
        <h4 class="quantity-value">${product.quantity}</h4>
        <a href="#" class="quantity-btn plus">
          <i class="fa-solid fa-plus"></i>
        </a>
      </div>
    `;
    cartList.appendChild(cartITEM);

    // Event listeners for plus/minus buttons
    cartITEM.querySelector(".plus").addEventListener("click", (e) => {
      e.preventDefault();
      changeQuantity(product.id, 1);
    });

    cartITEM.querySelector(".minus").addEventListener("click", (e) => {
      e.preventDefault();
      changeQuantity(product.id, -1);
    });
  };

  // Renders the entire cart based on the `cart` array
  const renderCart = () => {
    if (!cartList) return;
    cartList.innerHTML = ""; // Clear the cart before re-rendering
    cart.forEach(renderCartItem);
    updateTotals();
  };

  // Handles adding a product to the cart
  const addTocart = (productId) => {
    const existingProduct = cart.find((item) => item.id === productId);

    if (existingProduct) {
      showNotification("Item is already in the cart!");
    } else {
      const productToAdd = productlist.find((item) => item.id === productId);
      if (productToAdd) {
        cart.push({ ...productToAdd, quantity: 1 });
      }
    }
    saveCart();
    renderCart();
  };

  // Handles changing the quantity of a product
  const changeQuantity = (productId, change) => {
    const productIndex = cart.findIndex((item) => item.id === productId);
    if (productIndex > -1) {
      cart[productIndex].quantity += change;

      if (cart[productIndex].quantity <= 0) {
        // Find the DOM element to animate its removal
        const itemElement = cartList.querySelector(`.item[data-id='${productId}']`);
        if (itemElement) {
          itemElement.classList.add('slide-out');
          // Wait for the animation to finish before removing from the array and re-rendering
          itemElement.addEventListener('transitionend', () => {
            // Now that the animation is done, remove the item from the data and re-render
            const updatedCart = cart.filter(p => p.id !== productId);
            cart = updatedCart;
            saveCart(); // Save the new cart state
            renderCart(); // Re-render to remove the element from the DOM
          }, { once: true }); // {once: true} automatically removes the event listener after it runs
          return; // Exit the function to let the animation play
        }
      }
    }
    saveCart();
    renderCart();
  };

  // Renders the product cards on the home page
  const showCards = () => {
    if (!cardlist) return;
    productlist.forEach((product) => {
      const orderCard = document.createElement("div");
      orderCard.classList.add("order-card");

      orderCard.innerHTML = `
        <div class="card-image">
          <img src="${product.image}" />
        </div>
        <h4>${product.name}</h4>
        <h5 class="price">${product.price}</h5>
        <a href="#" class=" btn card-btn">Order Now</a>
      `;
      cardlist.appendChild(orderCard);

      orderCard.querySelector(".card-btn").addEventListener("click", (e) => {
        e.preventDefault();
        addTocart(product.id);
      });
    });
  };

  // --- Contact Form Submission Handler ---
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fullName = document.getElementById("contact-name").value;
      const email = document.getElementById("contact-email").value;
      const phone = document.getElementById("contact-phone").value;
      const message = document.getElementById("contact-message").value;

      fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          phone: phone,
          message: message
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification("Message sent successfully!");
          contactForm.reset();
        } else {
          showNotification("Failed to send message: " + (data.error || "Server error"));
        }
      })
      .catch(err => {
        console.error("Error:", err);
        showNotification("Failed to connect to server.");
      });
    });
  }

  // --- Newsletter Form Submission Handler ---
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("subscriber-email");
      const email = emailInput.value;

      fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification("Subscribed successfully!");
          newsletterForm.reset();
        } else {
          showNotification(data.message || "Subscription failed.");
        }
      })
      .catch(err => {
        console.error("Error:", err);
        showNotification("Failed to connect to server.");
      });
    });
  }

  // --- Initialization ---
  const initApp = () => {
    // Fetch products only if on the home page
    if (cardlist) {
      fetch("products.json")
        .then((response) => response.json())
        .then((data) => {
          productlist = data;
          showCards();
        });
    }
    // Render the cart from localStorage on every page load
    renderCart();
  };

  initApp();
});
