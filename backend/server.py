from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)
CORS(app)

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

# Initialize DB
with get_db() as db:
    db.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, company TEXT)')
    db.commit()

# Run this once to migrate your DB
with get_db() as db:
    db.execute('ALTER TABLE users ADD COLUMN company TEXT')
    db.commit()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    company = data.get('company')
    if not username or not password or not company:
        return jsonify({'success': False, 'message': 'Missing username, password, or company name'}), 400
    if not username.endswith('@gmail.com'):
        return jsonify({'success': False, 'message': 'Only Gmail addresses are allowed'}), 400
    hashed = generate_password_hash(password)
    try:
        with get_db() as db:
            db.execute('INSERT INTO users (username, password, company) VALUES (?, ?, ?)', (username, hashed, company))
            db.commit()
        return jsonify({'success': True})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Username already exists'}), 409

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    with get_db() as db:
        user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        if user and check_password_hash(user['password'], password):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

if __name__ == '__main__':
    app.run(debug=True)