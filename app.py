from flask import Flask, request, jsonify, render_template
import psycopg2
import os
from menu_utils import get_menu_items, get_menu_file_for_restaurant
from dotenv import load_dotenv
from flask_vercel import Vercel

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
app = Vercel(app)

# Example Postgres connection (update with your credentials)
def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get('PGHOST', 'localhost'),
        database=os.environ.get('PGDATABASE', 'foster the data'),
        user=os.environ.get('PGUSER', 'admin'),
        password=os.environ.get('PGPASSWORD', 'root')
    )
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

@app.route('/pos_users', methods=['POST'])
def pos_users():
    data = request.get_json()
    restaurant_name = data.get('restaurant_name')
    pos_key = data.get('pos_key')
    if not restaurant_name or not pos_key:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Only use restaurant_name and pos_key for authentication
        cur.execute('SELECT id, menu FROM pos_users WHERE restaurant_name=%s AND pos_key=%s', (restaurant_name, pos_key))
        result = cur.fetchone()
        cur.close()
        conn.close()
        if result:
            return jsonify({'success': True, 'restaurant_id': result[0], 'menu': result[1]})
        else:
            return jsonify({'success': False, 'message': 'Wrong credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/menu_items')
def menu_items():
    restaurant_id = request.args.get('restaurant_id')
    if not restaurant_id:
        return jsonify({'success': False, 'message': 'Missing restaurant_id'}), 400
    menu_file = get_menu_file_for_restaurant(restaurant_id)
    if not menu_file:
        return jsonify({'success': False, 'message': 'Menu file not found'}), 404
    try:
        items = get_menu_items(menu_file)
        return jsonify({'success': True, 'items': items})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/bills', methods=['POST'])
def create_bill():
    data = request.get_json()
    order_id = data.get('order_id')
    table_number = data.get('table_number')
    waiter = data.get('waiter')
    bill = data.get('bill')
    status = data.get('status', 'Invoiced')
    if not all([order_id, table_number, waiter, bill]):
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('INSERT INTO bills (order_id, table_number, waiter, status, bill) VALUES (%s, %s, %s, %s, %s) RETURNING id, timestamp',
                    (order_id, table_number, waiter, status, bill))
        bill_row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'success': True, 'bill_id': bill_row[0], 'timestamp': bill_row[1]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/bills/<int:bill_id>/status', methods=['PUT'])
def update_bill_status(bill_id):
    data = request.get_json()
    status = data.get('status')
    if not status:
        return jsonify({'success': False, 'message': 'Missing status'}), 400
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('UPDATE bills SET status=%s WHERE id=%s', (status, bill_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
