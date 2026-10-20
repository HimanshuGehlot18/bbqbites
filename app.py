from flask import Flask, request, jsonify, render_template, send_from_directory, session, redirect
import sqlite3
import os
import json
import random
from functools import wraps

app = Flask(__name__, static_folder='.', static_url_path='', template_folder='.')
app.secret_key = 'bbqbites-admin-secret-key-999' # Secret key for secure cookie-based session

# Database path configuration relative to the app.py file location
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_DIR = os.path.join(BASE_DIR, 'database')
DB_PATH = os.path.join(DB_DIR, 'bbqbites.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Automatically create the database directory if it does not exist
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
        print(f"Created database directory: {DB_DIR}")

    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE,
                customer_name TEXT,
                phone TEXT,
                address TEXT,
                items TEXT, -- JSON string representation of ordered items
                total_price REAL,
                payment_method TEXT,
                status TEXT DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT,
                email TEXT,
                phone TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

# --- Access Control Decorator ---
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


# Route Handlers for serving Pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/index.html')
def index_html():
    return render_template('index.html')

@app.route('/about.html')
def about_html():
    return render_template('about.html')

@app.route('/contact.html')
def contact_html():
    return render_template('contact.html')

@app.route('/checkout/checkout.html')
def checkout_html():
    return render_template('checkout/checkout.html')

@app.route('/admin')
def admin_slash_redirect():
    return redirect('/admin/admin.html')

@app.route('/admin.html')
def admin_html_redirect():
    return redirect('/admin/admin.html')

@app.route('/admin/admin.html')
def admin_html():
    if not session.get('admin_logged_in'):
        return render_template('admin/admin_login.html')
    return render_template('admin/admin.html')

@app.route('/login')
def login_route():
    if session.get('admin_logged_in'):
        return redirect('/admin/admin.html')
    return render_template('login/login.html')

@app.route('/login/login.html')
def login_html():
    if session.get('admin_logged_in'):
        return redirect('/admin/admin.html')
    return render_template('login/login.html')


# --- REST API ENDPOINTS ---

# Session Login / Logout
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        password = data.get('password')

        # Load admin credentials from environment variables (or use defaults)
        admin_user = os.environ.get('ADMIN_USERNAME', 'admin').strip()
        admin_pass = os.environ.get('ADMIN_PASSWORD', 'password123')

        u = username.lower()
        is_admin_match = (
            u == admin_user.lower() or 
            u in ['admin', 'admin@bbqbites.com', 'admin@gmail.com'] or 
            u == f"{admin_user.lower()}@bbqbites.com"
        )

        if is_admin_match and password == admin_pass:
            session['admin_logged_in'] = True
            return jsonify({'success': True, 'role': 'admin', 'redirect': '/admin/admin.html'})
        else:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True})


# Orders API
@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        customer_name = data.get('customer_name')
        phone = data.get('phone')
        address = data.get('address')
        payment_method = data.get('payment_method')
        items = data.get('items')
        total_price = data.get('total_price')

        if not all([customer_name, phone, address, payment_method, items, total_price is not None]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400

        # Convert items to JSON string for database storage
        items_str = json.dumps(items)
        
        # Generate unique order number
        order_number = f"BBQ-{random.randint(100000, 999999)}"

        with get_db() as conn:
            conn.execute('''
                INSERT INTO orders (order_number, customer_name, phone, address, items, total_price, payment_method, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
            ''', (order_number, customer_name, phone, address, items_str, float(total_price), payment_method))
            conn.commit()

        return jsonify({'success': True, 'order_number': order_number})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
@admin_required
def get_orders():
    try:
        with get_db() as conn:
            cursor = conn.execute('SELECT * FROM orders ORDER BY created_at DESC')
            rows = cursor.fetchall()
            orders = []
            for row in rows:
                orders.append({
                    'id': row['id'],
                    'order_number': row['order_number'],
                    'customer_name': row['customer_name'],
                    'phone': row['phone'],
                    'address': row['address'],
                    'items': json.loads(row['items']),
                    'total_price': row['total_price'],
                    'payment_method': row['payment_method'],
                    'status': row['status'],
                    'created_at': row['created_at']
                })
        return jsonify({'success': True, 'orders': orders})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    try:
        data = request.get_json()
        status = data.get('status')
        if not status:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
        
        with get_db() as conn:
            conn.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
            conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
@admin_required
def delete_order(order_id):
    try:
        with get_db() as conn:
            conn.execute('DELETE FROM orders WHERE id = ?', (order_id,))
            conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Contact Messages API
@app.route('/api/contact', methods=['POST'])
def create_contact():
    try:
        data = request.get_json()
        full_name = data.get('full_name')
        email = data.get('email')
        phone = data.get('phone')
        message = data.get('message')

        if not all([full_name, email, phone, message]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400

        with get_db() as conn:
            conn.execute('''
                INSERT INTO contact_messages (full_name, email, phone, message)
                VALUES (?, ?, ?, ?)
            ''', (full_name, email, phone, message))
            conn.commit()

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/contact', methods=['GET'])
@admin_required
def get_contacts():
    try:
        with get_db() as conn:
            cursor = conn.execute('SELECT * FROM contact_messages ORDER BY created_at DESC')
            rows = cursor.fetchall()
            messages = []
            for row in rows:
                messages.append({
                    'id': row['id'],
                    'full_name': row['full_name'],
                    'email': row['email'],
                    'phone': row['phone'],
                    'message': row['message'],
                    'created_at': row['created_at']
                })
        return jsonify({'success': True, 'messages': messages})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/contact/<int:msg_id>', methods=['DELETE'])
@admin_required
def delete_contact(msg_id):
    try:
        with get_db() as conn:
            conn.execute('DELETE FROM contact_messages WHERE id = ?', (msg_id,))
            conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Newsletter API
@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400

        with get_db() as conn:
            try:
                conn.execute('INSERT INTO newsletter_subscribers (email) VALUES (?)', (email,))
                conn.commit()
            except sqlite3.IntegrityError:
                return jsonify({'success': False, 'message': 'Email is already subscribed'}), 200

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/subscribe', methods=['GET'])
@admin_required
def get_subscribers():
    try:
        with get_db() as conn:
            cursor = conn.execute('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC')
            rows = cursor.fetchall()
            subscribers = []
            for row in rows:
                subscribers.append({
                    'id': row['id'],
                    'email': row['email'],
                    'created_at': row['created_at']
                })
        return jsonify({'success': True, 'subscribers': subscribers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/subscribe/<int:sub_id>', methods=['DELETE'])
@admin_required
def delete_subscriber(sub_id):
    try:
        with get_db() as conn:
            conn.execute('DELETE FROM newsletter_subscribers WHERE id = ?', (sub_id,))
            conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Dashboard statistics summary
@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_stats():
    try:
        with get_db() as conn:
            cursor = conn.execute("SELECT SUM(total_price) FROM orders WHERE status != 'Cancelled'")
            total_revenue = cursor.fetchone()[0] or 0.0
            
            cursor = conn.execute("SELECT COUNT(*) FROM orders")
            total_orders = cursor.fetchone()[0]
            
            cursor = conn.execute("SELECT COUNT(*) FROM contact_messages")
            total_messages = cursor.fetchone()[0]
            
            cursor = conn.execute("SELECT COUNT(*) FROM newsletter_subscribers")
            total_subscribers = cursor.fetchone()[0]
            
        return jsonify({
            'success': True,
            'stats': {
                'total_revenue': round(total_revenue, 2),
                'total_orders': total_orders,
                'total_messages': total_messages,
                'total_subscribers': total_subscribers
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Seeding demo data helper
@app.route('/api/admin/populate-demo', methods=['POST'])
@admin_required
def populate_demo():
    try:
        demo_subscribers = [
            ('jane.doe@example.com',),
            ('alex.smith@example.com',),
            ('mark.twain@example.com',),
            ('chef.barry@example.com',),
            ('bbqfanatic@gmail.com',)
        ]
        demo_messages = [
            ('Alice Johnson', 'alice@gmail.com', '1234567890', 'Hello! Do you open on Thanksgiving? We would love to dine in with the family.'),
            ('Bob Miller', 'bob@example.com', '9876543210', 'Great food! The ribs were incredibly tender and smoky. I will definitely order again.'),
            ('Charlie Rose', 'charlie@rose.com', '5551234567', 'Do you cater for corporate lunch events? Need catering for 50 people next month.')
        ]
        demo_orders = [
            ('BBQ-837482', 'Marcus Vance', '555-987-6543', '123 Elm St, Springfield', json.dumps([
                {'id': '1', 'name': 'Double Burger', 'price': '$200.00', 'quantity': 2, 'image': '../image/burger.png'},
                {'id': '2', 'name': 'BBQ Ribs', 'price': '$450.00', 'quantity': 1, 'image': '../image/burger.png'}
            ]), 850.0, 'credit', 'Completed'),
            ('BBQ-294719', 'Sarah Parker', '555-234-5678', '456 Oak Lane, Shelbyville', json.dumps([
                {'id': '3', 'name': 'Pulled Pork Sandwich', 'price': '$180.00', 'quantity': 3, 'image': '../image/burger.png'}
            ]), 540.0, 'upi', 'Preparing'),
            ('BBQ-104928', 'David Wilson', '555-876-5432', '789 Pine Road, Capital City', json.dumps([
                {'id': '1', 'name': 'Double Burger', 'price': '$200.00', 'quantity': 1, 'image': '../image/burger.png'},
                {'id': '3', 'name': 'Pulled Pork Sandwich', 'price': '$180.00', 'quantity': 1, 'image': '../image/burger.png'}
            ]), 380.0, 'cash', 'Pending')
        ]

        with get_db() as conn:
            for email in demo_subscribers:
                try:
                    conn.execute('INSERT INTO newsletter_subscribers (email) VALUES (?)', email)
                except sqlite3.IntegrityError:
                    pass
            
            for msg in demo_messages:
                conn.execute('INSERT INTO contact_messages (full_name, email, phone, message) VALUES (?, ?, ?, ?)', msg)
            
            for order in demo_orders:
                try:
                    conn.execute('''
                        INSERT INTO orders (order_number, customer_name, phone, address, items, total_price, payment_method, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', order)
                except sqlite3.IntegrityError:
                    pass
            
            conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Clear all database entries
@app.route('/api/admin/clear-data', methods=['POST'])
@admin_required
def clear_data():
    try:
        with get_db() as conn:
            conn.execute('DELETE FROM orders')
            conn.execute('DELETE FROM contact_messages')
            conn.execute('DELETE FROM newsletter_subscribers')
            conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Initialize database tables on import
init_db()

if __name__ == '__main__':
    print("Database initialized successfully.")
    app.run(debug=True, port=5000)
