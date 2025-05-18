document.addEventListener('DOMContentLoaded', () => {
    const menuContainer = document.getElementById('menu-container');
    const orderSection = document.querySelector('.order-content');
    const billButton = document.getElementById('bill-btn');
    const checkoutButton = document.getElementById('checkout-btn');
    let selectedTable = null;
    const tableStates = {};

    // Initialize table states
    document.querySelectorAll('.table-btn').forEach((button) => {
        const tableId = button.getAttribute('data-table-id');
        tableStates[tableId] = {
            total: 0,
            items: [],
            billed: false
        };
    });

    // Handle table selection
    document.querySelectorAll('.table-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const tableId = button.getAttribute('data-table-id');
            selectedTable = tableId;

            const tableState = tableStates[tableId];
            populateOrderSection(tableId, tableState);
        });
    });

    // Populate the Order section
    function populateOrderSection(tableId, tableState) {
        orderSection.innerHTML = `
            <h3>Table ${tableId}</h3>
            <div class="order-items">
                ${tableState.items
                    .map((item, index) => `<p>${item.name} - $${item.price.toFixed(2)}</p>`)
                    .join('')}
            </div>
            <p class="total-bill">Total: $${tableState.total.toFixed(2)}</p>
        `;
    }

    // Fetch and load menu items dynamically
    fetch('menu-items.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load menu items');
            return response.text();
        })
        .then(data => {
            menuContainer.innerHTML = data;
            attachMenuItemListeners();
        })
        .catch(error => console.error('Error loading menu items:', error));

    // Attach event listeners to menu items
    function attachMenuItemListeners() {
        document.querySelectorAll('.menu-item').forEach((item) => {
            item.addEventListener('click', () => {
                const itemName = item.getAttribute('data-name');
                const itemPrice = parseFloat(item.getAttribute('data-price'));

                addItemToOrder(itemName, itemPrice);
            });
        });
    }

    // Add an item to the order
    function addItemToOrder(itemName, itemPrice) {
        if (!selectedTable) {
            alert('Please select a table first!');
            return;
        }

        const tableState = tableStates[selectedTable];
        tableState.items.push({ name: itemName, price: itemPrice });
        tableState.total += itemPrice;

        populateOrderSection(selectedTable, tableState);
        checkoutButton.disabled = true; // Disable checkout until bill is generated
    }

    // Handle Bill button click
    billButton.addEventListener('click', () => {
        if (!selectedTable) {
            alert('Please select a table first!');
            return;
        }

        const tableState = tableStates[selectedTable];

        if (tableState.items.length === 0) {
            alert('No items to bill!');
            return;
        }

        tableState.billed = true;
        checkoutButton.disabled = false; // Enable checkout after billing

        alert(`Bill generated for Table ${selectedTable}. Total: $${tableState.total.toFixed(2)}`);
    });

    // Handle Checkout button click
    checkoutButton.addEventListener('click', () => {
        if (!selectedTable) {
            alert('Please select a table first!');
            return;
        }

        const tableState = tableStates[selectedTable];

        if (!tableState.billed) {
            alert('Please generate the bill first!');
            return;
        }

        alert(`Checkout completed for Table ${selectedTable}.`);
        // Reset the table state after checkout
        tableState.items = [];
        tableState.total = 0;
        tableState.billed = false;

        populateOrderSection(selectedTable, tableState);
        checkoutButton.disabled = true; // Disable checkout again
    });
});