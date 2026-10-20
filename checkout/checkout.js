document.addEventListener('DOMContentLoaded', () => {
    const summaryItemsContainer = document.querySelector('.summary-items');
    const totalPriceEl = document.querySelector('.total-price');
    const paymentForm = document.getElementById('payment-form');
    const confirmationOverlay = document.getElementById('confirmation-overlay');

    // UPI & Card elements
    const creditCardOption = document.getElementById('credit-card-option');
    const creditCardRadio = document.getElementById('credit-card');
    const cardUnavailableBanner = document.getElementById('card-unavailable-banner');
    const upiOption = document.getElementById('upi-option');
    const upiRadio = document.getElementById('upi');
    const cashOption = document.getElementById('cash-option');
    const cashRadio = document.getElementById('cash');
    const upiInlineShowcase = document.getElementById('upi-inline-showcase');
    const copyUpiBtn = document.getElementById('copy-upi-btn');

    // UPI Modal elements
    const upiModalOverlay = document.getElementById('upi-modal-overlay');
    const upiModalPayable = document.getElementById('upi-modal-payable');
    const upiCancelModalBtn = document.getElementById('upi-cancel-modal-btn');

    let upiTimeoutId = null;
    let cardAlertTimeout = null;

    // 1. Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Function to calculate total
    const getCartTotal = () => {
        let total = 0;
        cart.forEach(item => {
            const itemPrice = parseFloat(item.price.replace('$', ''));
            total += itemPrice * item.quantity;
        });
        return total;
    };

    // Function to render the order summary
    const renderOrderSummary = () => {
        if (!summaryItemsContainer || !totalPriceEl) return;

        summaryItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            summaryItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            if (paymentForm) paymentForm.style.display = 'none';
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

    // --- Payment Option Handlers ---

    // 1. Show "Not Available" when Credit/Debit card is clicked
    const showCardUnavailableAlert = () => {
        if (!cardUnavailableBanner) return;
        cardUnavailableBanner.classList.add('show');
        cardUnavailableBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Ensure Credit Card radio stays unchecked and keep UPI selected
        if (creditCardRadio) creditCardRadio.checked = false;
        if (upiRadio) upiRadio.checked = true;
        updatePaymentOptionStyles();

        // Clear previous timeout and auto-hide after 5 seconds
        if (cardAlertTimeout) clearTimeout(cardAlertTimeout);
        cardAlertTimeout = setTimeout(() => {
            cardUnavailableBanner.classList.remove('show');
        }, 5000);
    };

    if (creditCardOption) {
        creditCardOption.addEventListener('click', (e) => {
            e.preventDefault();
            showCardUnavailableAlert();
        });
    }

    if (creditCardRadio) {
        creditCardRadio.addEventListener('click', (e) => {
            e.preventDefault();
            showCardUnavailableAlert();
        });
    }

    // Function to synchronize selected styles and inline QR showcase
    const updatePaymentOptionStyles = () => {
        const isUpi = upiRadio && upiRadio.checked;
        const isCash = cashRadio && cashRadio.checked;

        if (upiOption) {
            upiOption.classList.toggle('selected', isUpi);
        }
        if (cashOption) {
            cashOption.classList.toggle('selected', isCash);
        }

        // Toggle inline UPI QR container
        if (upiInlineShowcase) {
            if (isUpi) {
                upiInlineShowcase.classList.remove('hidden');
            } else {
                upiInlineShowcase.classList.add('hidden');
            }
        }
    };

    if (upiRadio) {
        upiRadio.addEventListener('change', () => {
            if (cardUnavailableBanner) cardUnavailableBanner.classList.remove('show');
            updatePaymentOptionStyles();
        });
    }

    if (cashRadio) {
        cashRadio.addEventListener('change', () => {
            if (cardUnavailableBanner) cardUnavailableBanner.classList.remove('show');
            updatePaymentOptionStyles();
        });
    }

    // Copy UPI ID button
    if (copyUpiBtn) {
        copyUpiBtn.addEventListener('click', async () => {
            const upiId = 'himanshugehlot521@okicici';
            try {
                await navigator.clipboard.writeText(upiId);
                copyUpiBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                copyUpiBtn.classList.add('copied');
                setTimeout(() => {
                    copyUpiBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                    copyUpiBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                // Fallback copy
                const tempInput = document.createElement('input');
                tempInput.value = upiId;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                copyUpiBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => {
                    copyUpiBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                }, 2000);
            }
        });
    }

    // --- Order Submission Function ---
    const sendOrderToBackend = (customerData) => {
        // Ensure QR modal is closed
        closeUpiModal();

        // Immediately show the confirmation screen
        showOrderConfirmationScreen();

        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        })
        .then(res => res.json())
        .then(data => {
            console.log('Order status:', data);
        })
        .catch(err => {
            console.error('Order submit notice:', err);
        });
    };

    // --- Show Confirmation Screen ---
    const showOrderConfirmationScreen = () => {
        // Clear the cart from localStorage
        localStorage.removeItem('cart');

        if (confirmationOverlay) {
            confirmationOverlay.style.display = 'flex';
            confirmationOverlay.classList.add('visible');
            confirmationOverlay.style.opacity = '1';
            confirmationOverlay.style.visibility = 'visible';
            confirmationOverlay.style.zIndex = '10000';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // --- UPI 10-Second QR Display Flow ---
    const startUpiPaymentFlow = (customerData) => {
        if (!upiModalOverlay) {
            sendOrderToBackend(customerData);
            return;
        }

        // Show modal and update amount
        const totalPrice = customerData.total_price;
        if (upiModalPayable) {
            upiModalPayable.textContent = `$${totalPrice.toFixed(2)}`;
        }

        upiModalOverlay.style.display = 'flex';
        upiModalOverlay.classList.add('visible');
        upiModalOverlay.setAttribute('aria-hidden', 'false');

        if (upiTimeoutId) clearTimeout(upiTimeoutId);

        let orderHandled = false;
        const triggerConfirmation = () => {
            if (orderHandled) return;
            orderHandled = true;
            if (upiTimeoutId) {
                clearTimeout(upiTimeoutId);
                upiTimeoutId = null;
            }
            sendOrderToBackend(customerData);
        };

        // QR code displays for 10 seconds, then automatically closes and shows confirmation!
        upiTimeoutId = setTimeout(() => {
            triggerConfirmation();
        }, 10000);

        // Close button: user finishes scanning and closes QR code -> directly triggers confirmation!
        if (upiCancelModalBtn) {
            upiCancelModalBtn.onclick = (e) => {
                if (e) e.preventDefault();
                triggerConfirmation();
            };
        }

        // Clicking overlay backdrop also completes and confirms
        upiModalOverlay.onclick = (e) => {
            if (e.target === upiModalOverlay) {
                triggerConfirmation();
            }
        };

        // Pressing Escape also completes and confirms
        const onEsc = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', onEsc);
                triggerConfirmation();
            }
        };
        document.addEventListener('keydown', onEsc);
    };

    const closeUpiModal = () => {
        if (upiModalOverlay) {
            upiModalOverlay.classList.remove('visible');
            upiModalOverlay.style.display = 'none';
            upiModalOverlay.setAttribute('aria-hidden', 'true');
        }
    };

    // 2. Handle form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const customerName = document.getElementById('customer-name').value.trim();
            const customerPhone = document.getElementById('customer-phone').value.trim();
            const customerAddress = document.getElementById('customer-address').value.trim();
            const selectedPaymentRadio = document.querySelector('input[name="payment"]:checked');
            const selectedPayment = selectedPaymentRadio ? selectedPaymentRadio.value : 'upi';

            if (selectedPayment === 'credit') {
                showCardUnavailableAlert();
                return;
            }

            const totalPrice = getCartTotal();
            const validItems = cart && cart.length > 0 ? cart : [{ name: 'BBQ Special Meal', price: '$15.00', quantity: 1 }];

            const orderPayload = {
                customer_name: customerName,
                phone: customerPhone,
                address: customerAddress,
                payment_method: selectedPayment,
                items: validItems,
                total_price: totalPrice > 0 ? totalPrice : 15.00
            };

            if (selectedPayment === 'upi') {
                // Launch the 10-second UPI Payment flow
                startUpiPaymentFlow(orderPayload);
            } else {
                // Cash on Delivery
                sendOrderToBackend(orderPayload);
            }
        });
    }

    // Initial setup
    updatePaymentOptionStyles();
    renderOrderSummary();
});