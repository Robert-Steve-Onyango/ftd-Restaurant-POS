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

document.addEventListener('DOMContentLoaded', function() {
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

    fetch('menu-items.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;

            // Add event listeners to Serve buttons
            document.querySelectorAll('.serve-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (!selectedTable) {
                        alert('Please choose a table first.');
                        return;
                    }
                    const menuItem = this.closest('.menu-item');
                    const itemName = menuItem.getAttribute('data-name');
                    const itemPrice = menuItem.getAttribute('data-price');
                    if (!tableOrders[selectedTable]) tableOrders[selectedTable] = [];
                    tableOrders[selectedTable].push({ name: itemName, price: itemPrice });
                    const orderList = document.getElementById('order-list');
                    renderOrderList(orderList, tableOrders[selectedTable]);
                });
            });

            // After loading menu items into #menu-container
            const menuSearch = document.getElementById('menu-search');
            menuSearch.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                document.querySelectorAll('#menu-container .menu-item').forEach(function(item) {
                    const name = item.getAttribute('data-name') || '';
                    if (name.toLowerCase().includes(query)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            // BILL button logic
            const billBtn = document.getElementById('bill-btn');
            billBtn.addEventListener('click', function() {
                if (!selectedTable) {
                    alert('Please choose a table first.');
                    return;
                }
                // Add billed-table to the selected table
                const selectedBtn = document.querySelector(`.table-btn[data-table-id="${selectedTable}"]`);
                if (selectedBtn) {
                    selectedBtn.classList.add('billed-table');
                    // Enable checkout for this table
                    checkoutBtn.disabled = false;
                }
            });

            // CHECKOUT button logic
            checkoutBtn.addEventListener('click', function() {
                if (!selectedTable) return;
                paymentModal.style.display = 'flex';
            });

            // Modal logic
            const paymentModal = document.getElementById('payment-modal');
            const payMpesaBtn = document.getElementById('pay-mpesa');
            const payCashBtn = document.getElementById('pay-cash');
            const closePaymentModalBtn = document.getElementById('close-payment-modal');

            let paymentAction = null; // To store the action after modal selection

            // Handle modal close
            closePaymentModalBtn.addEventListener('click', function() {
                paymentModal.style.display = 'none';
            });

            // Mpesa logic
            payMpesaBtn.addEventListener('click', async function() {
                paymentModal.style.display = 'none';
                // Prompt for phone number in 07XXXXXXXX format
                let phone = prompt('Enter customer phone number (format: 07XXXXXXXX):');
                if (!phone || !/^07\d{8}$/.test(phone)) {
                    alert('Invalid phone number format.');
                    return;
                }
                // Convert to 2547XXXXXXXX
                phone = '254' + phone.substring(1);

                // Calculate total
                const orders = tableOrders[selectedTable] || [];
                const total = orders.reduce((sum, order) => sum + parseFloat(order.price), 0);

                // Send STK Push request to backend
                try {
                    const response = await fetch('/mpesa/stk-push', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, amount: total })
                    });
                    const result = await response.json();
                    if (result.success) {
                        alert('Payment request sent. Please complete payment on your phone.');
                    } else {
                        alert('Failed to initiate payment: ' + (result.message || 'Unknown error'));
                        return;
                    }
                } catch (err) {
                    alert('Error sending payment request.');
                    return;
                }

                // Finalize checkout
                finalizeCheckout();
            });

            // Cash logic
            payCashBtn.addEventListener('click', function() {
                paymentModal.style.display = 'none';
                alert('Please collect cash from the customer.');
                finalizeCheckout();
            });

            // Helper to finalize checkout
            function finalizeCheckout() {
                // Clear orders for this table
                tableOrders[selectedTable] = [];
                // Update the order list display
                const orderList = document.getElementById('order-list');
                renderOrderList(orderList, tableOrders[selectedTable]);
                // Remove billed-table class (make available/green)
                const selectedBtn = document.querySelector(`.table-btn[data-table-id="${selectedTable}"]`);
                if (selectedBtn) {
                    selectedBtn.classList.remove('billed-table');
                }
                // Disable checkout again
                checkoutBtn.disabled = true;
            }

            const tableSearch = document.getElementById('table-search');
            tableSearch.addEventListener('input', function() {
                const query = this.value.trim().toLowerCase();
                document.querySelectorAll('.tables .table-btn').forEach(function(btn) {
                    const tableId = btn.getAttribute('data-table-id') || '';
                    if (tableId.toLowerCase().includes(query)) {
                        btn.style.display = '';
                    } else {
                        btn.style.display = 'none';
                    }
                });
            });

            // Login modal logic
            const accountIcon = document.getElementById('account-icon');
            const loginModal = document.getElementById('login-modal');
            const closeLoginModalBtn = document.getElementById('close-login-modal');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const loginError = document.getElementById('login-error');
            const toggleRegisterBtn = document.getElementById('toggle-register');
            const toggleLoginBtn = document.getElementById('toggle-login');
            const modalTitle = document.getElementById('modal-title');

            function isLoggedIn() {
                return localStorage.getItem('loggedIn') === 'true';
            }

            function showLoginModal() {
                loginModal.style.display = 'flex';
                loginError.style.display = 'none';
                loginForm.style.display = '';
                registerForm.style.display = 'none';
                toggleRegisterBtn.style.display = '';
                toggleLoginBtn.style.display = 'none';
                modalTitle.textContent = 'Login';
                loginForm.reset();
                registerForm.reset();
            }

            function showRegisterModal() {
                loginModal.style.display = 'flex';
                loginError.style.display = 'none';
                loginForm.style.display = 'none';
                registerForm.style.display = '';
                toggleRegisterBtn.style.display = 'none';
                toggleLoginBtn.style.display = '';
                modalTitle.textContent = 'Register';
                loginForm.reset();
                registerForm.reset();
            }

            // Show login modal on page load if not logged in
            if (!isLoggedIn()) {
                showLoginModal();
            }

            accountIcon.addEventListener('click', function() {
                showLoginModal();
            });

            closeLoginModalBtn.addEventListener('click', function() {
                loginModal.style.display = 'none';
            });

            toggleRegisterBtn.addEventListener('click', function() {
                showRegisterModal();
            });

            toggleLoginBtn.addEventListener('click', function() {
                showLoginModal();
            });

            // Dummy registration (stores in localStorage for demo)
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const username = document.getElementById('register-username').value.trim();
                const password = document.getElementById('register-password').value;
                const password2 = document.getElementById('register-password2').value;
                const company = document.getElementById('register-company').value.trim();
                if (password !== password2) {
                    loginError.textContent = 'Passwords do not match.';
                    loginError.style.display = 'block';
                    return;
                }
                if (username.length < 3 || password.length < 3 || company.length < 2) {
                    loginError.textContent = 'All fields are required and must be valid.';
                    loginError.style.display = 'block';
                    return;
                }
                try {
                    const res = await fetch('http://localhost:5000/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password, company })
                    });
                    const data = await res.json();
                    if (data.success) {
                        loginError.style.display = 'none';
                        alert('Registration successful! Please login.');
                        showLoginModal();
                    } else {
                        loginError.textContent = data.message || 'Registration failed.';
                        loginError.style.display = 'block';
                    }
                } catch (err) {
                    loginError.textContent = 'Server error. Try again later.';
                    loginError.style.display = 'block';
                }
            });

            // Dummy login (checks localStorage for demo)
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value;
                const storedPassword = localStorage.getItem('user_' + username);
                if (storedPassword && storedPassword === password) {
                    loginModal.style.display = 'none';
                    localStorage.setItem('loggedIn', 'true');
                    alert('Login successful!');
                } else {
                    loginError.textContent = 'Invalid username or password.';
                    loginError.style.display = 'block';
                }
            });
        })
        .catch(error => {
            console.error('Error loading menu:', error);
        });
});