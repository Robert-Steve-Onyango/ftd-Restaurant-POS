// filepath: c:\Data Science Course\Developer\Foster the Data\Restaurant POS\templates\index.js

let selectedTable = null;
let tableOrders = {}; // Store orders per table

function renderOrderList(orderList, orders) {
    orderList.innerHTML = '';
    let total = 0;
    if (orders && orders.length > 0) {
        orders.forEach((order, idx) => {
            const li = document.createElement('li');
            li.textContent = `${order.name} - $${order.price}`;
            li.style.cursor = 'pointer';
            li.title = 'Click to select';

            // Remove button (hidden by default)
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.style.display = 'none';
            removeBtn.style.marginLeft = '10px';

            // Remove item on button click
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                orders.splice(idx, 1);
                renderOrderList(orderList, orders);
            });

            li.appendChild(removeBtn);

            li.addEventListener('click', function() {
                // Remove highlight from all items
                orderList.querySelectorAll('li').forEach(item => {
                    item.style.backgroundColor = '';
                    if (item.lastChild.tagName === 'BUTTON') {
                        item.lastChild.style.display = 'none';
                    }
                });
                // Highlight this item and show remove button
                li.style.backgroundColor = '#ffe082';
                removeBtn.style.display = 'inline-block';
            });

            orderList.appendChild(li);
            total += parseFloat(order.price);
        });
    }
    // Add total row (not numbered)
    const totalLi = document.createElement('li');
    totalLi.style.fontWeight = 'bold';
    totalLi.style.borderTop = '1px solid #ccc';
    totalLi.style.marginTop = '8px';
    totalLi.style.listStyle = 'none'; // This line removes the number
    totalLi.textContent = `Total: $${total.toFixed(2)}`;
    orderList.appendChild(totalLi);
}

// --- LOGIN MODAL ---
// Create login modal dynamically
function createLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.style = 'display:flex; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); z-index:2000; align-items:center; justify-content:center;';
    modal.innerHTML = `
        <div style="background:#fff; padding:32px 24px; border-radius:8px; min-width:300px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.2);">
            <h3>POS Login</h3>
            <form id="login-form" autocomplete="off">
                <input type="text" id="login-restaurant" placeholder="Restaurant Name" required style="margin-bottom:12px; width:90%; padding:8px; border-radius:4px; border:1px solid #ccc;"><br>
                <input type="password" id="login-poskey" placeholder="POS Key" required style="margin-bottom:16px; width:90%; padding:8px; border-radius:4px; border:1px solid #ccc;"><br>
                <button type="submit" style="padding:8px 24px; border-radius:4px; background:#28a745; color:#fff; border:none; cursor:pointer;">Login</button>
            </form>
            <div id="login-error" style="color:red; margin-top:10px; display:none;"></div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showLoginModal() {
    let modal = document.getElementById('login-modal');
    if (!modal) createLoginModal();
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-form').reset();
}

function hideLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

function isLoggedIn() {
    return localStorage.getItem('pos_logged_in') === 'true';
}

// On DOMContentLoaded, show login modal if not logged in
document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        showLoginModal();
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = true; // Disable checkout by default

    // Table selection logic
    document.querySelectorAll('.table-btn').forEach(function(tableBtn) {
        tableBtn.addEventListener('click', function() {
            // Highlight selected table
            document.querySelectorAll('.table-btn').forEach(btn => btn.classList.remove('selected-table'));
            this.classList.add('selected-table');
            selectedTable = this.getAttribute('data-table-id');
            // Update table indicator
            const indicator = document.getElementById('order-table-indicator');
            indicator.textContent = `Table: ${selectedTable}`;
            // Render order list for this table
            const orderList = document.getElementById('order-list');
            if (!tableOrders[selectedTable]) tableOrders[selectedTable] = [];
            renderOrderList(orderList, tableOrders[selectedTable]);
            // Enable checkout only if this table is billed
            checkoutBtn.disabled = !this.classList.contains('billed-table');
        });
    });

    // Fetch menu items from backend API and render them
    const restaurant_id = localStorage.getItem('restaurant_id');
    fetch(`/menu_items?restaurant_id=${restaurant_id}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) throw new Error(data.message || 'Failed to load menu');
            const menuContainer = document.getElementById('menu-container');
            menuContainer.innerHTML = '';
            // Use a grid container for 4x4 layout
            const grid = document.createElement('div');
            grid.className = 'menu-items';
            data.items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'menu-item';
                div.setAttribute('data-id', item.id);
                div.setAttribute('data-name', item.name);
                div.setAttribute('data-price', item.price);
                div.innerHTML = `
                    <img src="${item.image_url}" alt="${item.name}">
                    <p>${item.name}</p>
                    <span style="font-weight:bold;">$${item.price}</span>
                    <button class="serve-btn">Serve</button>
                `;
                grid.appendChild(div);
            });
            menuContainer.appendChild(grid);
            // Add event listeners to Serve buttons
            grid.querySelectorAll('.serve-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (!selectedTable) {
                        alert('Please choose a table first.');
                        return;
                    }
                    const menuItem = this.closest('.menu-item');
                    const itemId = menuItem.getAttribute('data-id');
                    const itemName = menuItem.getAttribute('data-name');
                    const itemPrice = menuItem.getAttribute('data-price');
                    if (!tableOrders[selectedTable]) tableOrders[selectedTable] = [];
                    tableOrders[selectedTable].push({ id: itemId, name: itemName, price: itemPrice });
                    const orderList = document.getElementById('order-list');
                    renderOrderList(orderList, tableOrders[selectedTable]);
                });
            });
            // Menu search logic
            const menuSearch = document.getElementById('menu-search');
            menuSearch.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                grid.querySelectorAll('.menu-item').forEach(function(item) {
                    const name = item.getAttribute('data-name') || '';
                    if (name.toLowerCase().includes(query)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading menu:', error);
        });

    // Attach login handler
    document.body.addEventListener('submit', async function(e) {
        if (e.target && e.target.id === 'login-form') {
            e.preventDefault();
            const restaurant = document.getElementById('login-restaurant').value.trim();
            const poskey = document.getElementById('login-poskey').value;
            const loginError = document.getElementById('login-error');
            if (!restaurant || !poskey) {
                loginError.textContent = 'All fields are required.';
                loginError.style.display = 'block';
                return;
            }
            try {
                const res = await fetch('/pos_users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ restaurant_name: restaurant, pos_key: poskey })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('pos_logged_in', 'true');
                    if (data.restaurant_id) {
                        localStorage.setItem('restaurant_id', data.restaurant_id);
                    }
                    hideLoginModal();
                } else {
                    loginError.textContent = 'Wrong credentials. See admin.';
                    loginError.style.display = 'block';
                }
            } catch (err) {
                loginError.textContent = 'Server error. Try again later.';
                loginError.style.display = 'block';
            }
        }
    });

    // Logout button handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('pos_logged_in');
            location.reload();
        });
    }

    // Example waiter list (replace with dynamic fetch if needed)
    const waiterNames = ["Alice", "Bob", "Carol", "David", "Eve"];
    // BILL button logic
    const billBtn = document.getElementById('bill-btn');
    billBtn.addEventListener('click', function() {
        if (!selectedTable) {
            alert('Please select a table to bill.');
            return;
        }
        // Show waiter select modal
        const waiterModal = document.getElementById('waiter-modal');
        const waiterSelect = document.getElementById('waiter-select');
        waiterSelect.innerHTML = waiterNames.map(name => `<option value="${name}">${name}</option>`).join('');
        waiterModal.style.display = 'flex';
        // Confirm/cancel handlers
        document.getElementById('waiter-select-confirm').onclick = function() {
            const waiter = waiterSelect.value;
            waiterModal.style.display = 'none';
            // Mark table as billed (red)
            const selectedBtn = document.querySelector(`.table-btn[data-table-id="${selectedTable}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('billed-table');
            }
            // Calculate total bill
            const orders = tableOrders[selectedTable] || [];
            const total = orders.reduce((sum, order) => sum + parseFloat(order.price), 0);
            // Generate order_id (timestamp + table)
            const order_id = `T${selectedTable}_${Date.now()}`;
            // Log bill to backend
            fetch('/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id,
                    table_number: selectedTable,
                    waiter,
                    bill: total,
                    status: 'Invoiced'
                })
            }).then(res => res.json()).then(data => {
                if (!data.success) {
                    alert('Failed to log bill: ' + (data.message || 'Unknown error'));
                } else {
                    // Store bill_id for later status update
                    selectedBtn.setAttribute('data-bill-id', data.bill_id);
                }
            });
            // Enable checkout
            checkoutBtn.disabled = false;
        };
        document.getElementById('waiter-select-cancel').onclick = function() {
            waiterModal.style.display = 'none';
        };
    });

    // CHECKOUT button logic
    checkoutBtn.addEventListener('click', function() {
        if (!selectedTable) {
            alert('Please select a table to checkout.');
            return;
        }
        const selectedBtn = document.querySelector(`.table-btn[data-table-id="${selectedTable}"]`);
        if (!selectedBtn.classList.contains('billed-table')) {
            alert('Please bill the table before checkout.');
            return;
        }
        // Show payment modal
        document.getElementById('payment-modal').style.display = 'flex';
        // Payment method handlers
        const payMpesa = document.getElementById('pay-mpesa');
        const payCash = document.getElementById('pay-cash');
        const closePayment = document.getElementById('close-payment-modal');
        function finalizeCheckout() {
            // Clear orders for this table
            tableOrders[selectedTable] = [];
            renderOrderList(document.getElementById('order-list'), tableOrders[selectedTable]);
            // Mark table as available (green)
            if (selectedBtn) {
                selectedBtn.classList.remove('billed-table');
                // Update bill status in backend
                const billId = selectedBtn.getAttribute('data-bill-id');
                if (billId) {
                    fetch(`/bills/${billId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Checkedout' })
                    });
                    selectedBtn.removeAttribute('data-bill-id');
                }
            }
            checkoutBtn.disabled = true;
            document.getElementById('payment-modal').style.display = 'none';
        }
        payMpesa.onclick = function() {
            alert('Mpesa payment processed!');
            finalizeCheckout();
        };
        payCash.onclick = function() {
            alert('Cash payment processed!');
            finalizeCheckout();
        };
        closePayment.onclick = function() {
            document.getElementById('payment-modal').style.display = 'none';
        };
    });
});