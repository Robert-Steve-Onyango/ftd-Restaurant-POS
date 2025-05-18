# Restaurant POS System

This is a Point of Sale (POS) system for restaurants built using Django. The application allows restaurant staff to manage menu items, take orders, and handle transactions efficiently.

## Project Structure

```
restaurant-pos/
├── pos/                  # Main Django project directory
│   ├── __init__.py      # Marks the directory as a Python package
│   ├── settings.py      # Configuration settings for the Django project
│   ├── urls.py          # URL routing for the application
│   ├── wsgi.py          # WSGI entry point for the application
│   └── asgi.py          # ASGI entry point for the application
├── menu/                 # Application for managing menu items
│   ├── migrations/       # Database migrations for the menu app
│   │   └── __init__.py  # Marks the directory as a Python package
│   ├── __init__.py      # Marks the directory as a Python package
│   ├── admin.py         # Admin interface for menu management
│   ├── apps.py          # Configuration for the menu application
│   ├── models.py        # Data models for the menu application
│   ├── tests.py         # Test cases for the menu application
│   └── views.py         # View functions for the menu application
├── orders/               # Application for managing orders
│   ├── migrations/       # Database migrations for the orders app
│   │   └── __init__.py  # Marks the directory as a Python package
│   ├── __init__.py      # Marks the directory as a Python package
│   ├── admin.py         # Admin interface for order management
│   ├── apps.py          # Configuration for the orders application
│   ├── models.py        # Data models for the orders application
│   ├── tests.py         # Test cases for the orders application
│   └── views.py         # View functions for the orders application
├── manage.py             # Command-line utility for interacting with the project
└── requirements.txt      # Project dependencies
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd restaurant-pos
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```
   python manage.py migrate
   ```

5. **Create a superuser (optional):**
   ```
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```
   python manage.py runserver
   ```

## Usage

- Access the application at `http://127.0.0.1:8000/`.
- Use the Django admin interface at `http://127.0.0.1:8000/admin/` to manage menu items and orders.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.