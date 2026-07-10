document.addEventListener('DOMContentLoaded', () => {
    const summaryItemsContainer = document.querySelector('.summary-items');
    const totalPriceEl = document.querySelector('.total-price');
    const paymentForm = document.getElementById('payment-form');
    const confirmationOverlay = document.getElementById('confirmation-overlay');

    // 1. Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Function to render the order summary
    const renderOrderSummary = () => {
        if (!summaryItemsContainer || !totalPriceEl) return;

        // Clear previous items
        summaryItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            summaryItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            paymentForm.style.display = 'none'; // Hide form if cart is empty
            return;
        }

        let totalPrice = 0;

        cart.forEach(item => {
            const itemPrice = parseFloat(item.price.replace('$', ''));
            const itemTotal = itemPrice * item.quantity;
            totalPrice += itemTotal;

            const summaryItem = document.createElement('div');
            summaryItem.classList.add('summary-item');
            summaryItem.innerHTML = `
                <span class="item-name">${item.name} (x${item.quantity})</span>
                <span class="item-price">$${itemTotal.toFixed(2)}</span>
            `;
            summaryItemsContainer.appendChild(summaryItem);
        });

        totalPriceEl.textContent = `$${totalPrice.toFixed(2)}`;
    };

    // 2. Handle form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const customerName = document.getElementById('customer-name').value;
            const customerPhone = document.getElementById('customer-phone').value;
            const customerAddress = document.getElementById('customer-address').value;
            const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value || 'credit';

            // Calculate total price
            let totalPrice = 0;
            cart.forEach(item => {
                const itemPrice = parseFloat(item.price.replace('$', ''));
                totalPrice += itemPrice * item.quantity;
            });

            // Submit order via API
            fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer_name: customerName,
                    phone: customerPhone,
                    address: customerAddress,
                    payment_method: selectedPayment,
                    items: cart,
                    total_price: totalPrice
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Show the confirmation animation
                    if (confirmationOverlay) {
                        confirmationOverlay.classList.add('visible');
                    }
                    // Clear the cart from localStorage
                    localStorage.removeItem('cart');
                } else {
                    alert('Failed to place order: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                console.error('Error:', err);
                alert('An error occurred while placing the order. Please try again.');
            });
        });
    }

    // Initial render
    renderOrderSummary();
});