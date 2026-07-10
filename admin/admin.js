document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const tabs = document.querySelectorAll('.sidebar-tab');
    const panels = document.querySelectorAll('.tab-panel');
    const toast = document.getElementById('admin-toast');

    // Stats
    const statOrders = document.getElementById('stat-total-orders');
    const statRevenue = document.getElementById('stat-total-revenue');
    const statMessages = document.getElementById('stat-total-messages');
    const statSubscribers = document.getElementById('stat-total-subscribers');

    // Sidebar Badges
    const badgeOrders = document.getElementById('badge-orders');
    const badgeMessages = document.getElementById('badge-messages');
    const badgeSubscribers = document.getElementById('badge-subscribers');

    // Table Bodies
    const ordersTableBody = document.getElementById('orders-table-body');
    const messagesTableBody = document.getElementById('messages-table-body');
    const subscribersTableBody = document.getElementById('subscribers-table-body');

    // Empty States
    const ordersEmpty = document.getElementById('orders-empty-state');
    const messagesEmpty = document.getElementById('messages-empty-state');
    const subscribersEmpty = document.getElementById('subscribers-empty-state');

    // Search and Filters
    const orderSearch = document.getElementById('order-search');
    const orderFilter = document.getElementById('order-status-filter');
    const messagesSearch = document.getElementById('messages-search');
    const subscribersSearch = document.getElementById('subscribers-search');

    // Utility Buttons
    const btnLoadDemo = document.getElementById('btn-load-demo');
    const btnClearDb = document.getElementById('btn-clear-db');
    const btnLogout = document.getElementById('btn-logout');

    // Cache of active data
    let ordersList = [];
    let messagesList = [];
    let subscribersList = [];

    // --- Toast Notification ---
    const showToast = (message, isError = false) => {
        if (!toast) return;
        toast.textContent = message;
        toast.style.backgroundColor = isError ? '#e74c3c' : '#212121';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // --- Helper Formatters ---
    const formatCurrency = (val) => {
        return `$${parseFloat(val).toFixed(2)}`;
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // --- Tab Switching ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Toggle active sidebar tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Toggle active panel
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `panel-${targetTab}`) {
                    panel.classList.add('active');
                }
            });
        });
    });

    // --- Data Fetching and UI Rendering ---

    const loadStats = () => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    statOrders.textContent = data.stats.total_orders;
                    statRevenue.textContent = formatCurrency(data.stats.total_revenue);
                    statMessages.textContent = data.stats.total_messages;
                    statSubscribers.textContent = data.stats.total_subscribers;

                    badgeOrders.textContent = data.stats.total_orders;
                    badgeMessages.textContent = data.stats.total_messages;
                    badgeSubscribers.textContent = data.stats.total_subscribers;
                }
            })
            .catch(err => console.error('Error fetching stats:', err));
    };

    const renderOrders = () => {
        ordersTableBody.innerHTML = '';
        
        // Filter criteria
        const searchVal = orderSearch.value.trim().toLowerCase();
        const filterVal = orderFilter.value;

        const filteredOrders = ordersList.filter(order => {
            const matchesSearch = order.customer_name.toLowerCase().includes(searchVal) || 
                                  order.order_number.toLowerCase().includes(searchVal);
            const matchesStatus = filterVal === 'all' || order.status === filterVal;
            return matchesSearch && matchesStatus;
        });

        if (filteredOrders.length === 0) {
            ordersEmpty.style.display = 'flex';
        } else {
            ordersEmpty.style.display = 'none';
            filteredOrders.forEach(order => {
                const tr = document.createElement('tr');
                
                // Formulate items list
                const itemsListHTML = order.items.map(item => 
                    `<li>${item.name} <strong>(x${item.quantity})</strong></li>`
                ).join('');

                tr.innerHTML = `
                    <td><strong>${order.order_number}</strong></td>
                    <td>${formatDate(order.created_at)}</td>
                    <td class="customer-info-cell">
                        <p class="cust-name">${order.customer_name}</p>
                        <p><i class="fa-solid fa-phone"></i> ${order.phone}</p>
                        <p><i class="fa-solid fa-location-dot"></i> ${order.address}</p>
                    </td>
                    <td>
                        <ul class="order-items-list">
                            ${itemsListHTML}
                        </ul>
                    </td>
                    <td><strong>${formatCurrency(order.total_price)}</strong></td>
                    <td>
                        <span class="pm-badge ${order.payment_method}">
                            <i class="${
                                order.payment_method === 'credit' ? 'fa-solid fa-credit-card' : 
                                order.payment_method === 'upi' ? 'fa-solid fa-qrcode' : 'fa-solid fa-money-bill-wave'
                            }"></i>
                            ${order.payment_method === 'credit' ? 'Card' : order.payment_method.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <select class="status-select ${order.status}" data-id="${order.id}">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button class="action-btn delete-order" data-id="${order.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;

                ordersTableBody.appendChild(tr);
            });

            // Bind change status listeners
            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    const orderId = e.target.getAttribute('data-id');
                    const newStatus = e.target.value;
                    updateOrderStatus(orderId, newStatus);
                });
            });

            // Bind delete order listeners
            document.querySelectorAll('.delete-order').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.target.closest('.delete-order');
                    const orderId = btnEl.getAttribute('data-id');
                    if (confirm('Delete this order record permanently?')) {
                        deleteOrder(orderId);
                    }
                });
            });
        }
    };

    const renderMessages = () => {
        messagesTableBody.innerHTML = '';
        const searchVal = messagesSearch.value.trim().toLowerCase();

        const filteredMessages = messagesList.filter(msg => {
            return msg.full_name.toLowerCase().includes(searchVal) || 
                   msg.email.toLowerCase().includes(searchVal) || 
                   msg.phone.includes(searchVal) || 
                   msg.message.toLowerCase().includes(searchVal);
        });

        if (filteredMessages.length === 0) {
            messagesEmpty.style.display = 'flex';
        } else {
            messagesEmpty.style.display = 'none';
            filteredMessages.forEach(msg => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatDate(msg.created_at)}</td>
                    <td class="customer-info-cell">
                        <p class="cust-name">${msg.full_name}</p>
                        <p><i class="fa-solid fa-envelope"></i> ${msg.email}</p>
                        <p><i class="fa-solid fa-phone"></i> ${msg.phone}</p>
                    </td>
                    <td style="max-width: 400px; word-wrap: break-word; line-height: 1.4;">
                        ${msg.message}
                    </td>
                    <td>
                        <button class="action-btn delete-message" data-id="${msg.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;
                messagesTableBody.appendChild(tr);
            });

            // Bind delete message listeners
            document.querySelectorAll('.delete-message').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.target.closest('.delete-message');
                    const msgId = btnEl.getAttribute('data-id');
                    if (confirm('Delete this contact inquiry record?')) {
                        deleteMessage(msgId);
                    }
                });
            });
        }
    };

    const renderSubscribers = () => {
        subscribersTableBody.innerHTML = '';
        const searchVal = subscribersSearch.value.trim().toLowerCase();

        const filteredSubscribers = subscribersList.filter(sub => {
            return sub.email.toLowerCase().includes(searchVal);
        });

        if (filteredSubscribers.length === 0) {
            subscribersEmpty.style.display = 'flex';
        } else {
            subscribersEmpty.style.display = 'none';
            filteredSubscribers.forEach(sub => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatDate(sub.created_at)}</td>
                    <td style="font-weight: 500;">${sub.email}</td>
                    <td>
                        <button class="action-btn delete-subscriber" data-id="${sub.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;
                subscribersTableBody.appendChild(tr);
            });

            // Bind delete subscriber listeners
            document.querySelectorAll('.delete-subscriber').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.target.closest('.delete-subscriber');
                    const subId = btnEl.getAttribute('data-id');
                    if (confirm('Delete subscriber from list?')) {
                        deleteSubscriber(subId);
                    }
                });
            });
        }
    };

    // --- Load Data From API ---
    const fetchOrders = () => {
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    ordersList = data.orders;
                    renderOrders();
                }
            })
            .catch(err => console.error('Error fetching orders:', err));
    };

    const fetchMessages = () => {
        fetch('/api/contact')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    messagesList = data.messages;
                    renderMessages();
                }
            })
            .catch(err => console.error('Error fetching messages:', err));
    };

    const fetchSubscribers = () => {
        fetch('/api/subscribe')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    subscribersList = data.subscribers;
                    renderSubscribers();
                }
            })
            .catch(err => console.error('Error fetching subscribers:', err));
    };

    const reloadAllData = () => {
        loadStats();
        fetchOrders();
        fetchMessages();
        fetchSubscribers();
    };

    // --- Action Methods ---

    const updateOrderStatus = (orderId, status) => {
        fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast(`Order status updated to ${status}`);
                reloadAllData();
            } else {
                showToast('Failed to update status', true);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Network error updating order status', true);
        });
    };

    const deleteOrder = (orderId) => {
        fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Order record deleted successfully');
                reloadAllData();
            } else {
                showToast('Failed to delete order', true);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Network error deleting order', true);
        });
    };

    const deleteMessage = (msgId) => {
        fetch(`/api/contact/${msgId}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Message inquiry deleted');
                reloadAllData();
            } else {
                showToast('Failed to delete message', true);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Network error deleting message', true);
        });
    };

    const deleteSubscriber = (subId) => {
        fetch(`/api/subscribe/${subId}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Subscriber unsubscribed');
                reloadAllData();
            } else {
                showToast('Failed to delete subscriber', true);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Network error deleting subscriber', true);
        });
    };

    // --- Search Input Listeners ---
    orderSearch.addEventListener('input', renderOrders);
    orderFilter.addEventListener('change', renderOrders);
    messagesSearch.addEventListener('input', renderMessages);
    subscribersSearch.addEventListener('input', renderSubscribers);

    // --- DB Utilities ---

    btnLoadDemo.addEventListener('click', () => {
        fetch('/api/admin/populate-demo', {
            method: 'POST'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Demo data generated successfully!');
                reloadAllData();
            } else {
                showToast('Failed to generate demo data.', true);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Server connection failed.', true);
        });
    });

    btnClearDb.addEventListener('click', () => {
        if (confirm('CAUTION: Are you sure you want to delete all database content? This will wipe all orders, messages, and subscribers.')) {
            fetch('/api/admin/clear-data', {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('All database content wiped successfully.');
                    reloadAllData();
                } else {
                    showToast('Failed to wipe database content.', true);
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Server connection failed.', true);
            });
        }
    });

    // --- Initial Load ---
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            fetch('/api/admin/logout', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Failed to log out', true);
            });
        });
    }

    reloadAllData();
});
