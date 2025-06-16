import pandas as pd
import requests
import io
from flask import jsonify
import psycopg2
import os
import re

def get_menu_items(menu_file):
    # If menu_file is a URL, download the file first
    if isinstance(menu_file, str) and (menu_file.startswith('http://') or menu_file.startswith('https://')):
        # Handle Google Sheets links
        if 'docs.google.com/spreadsheets' in menu_file:
            # Convert to export link for Excel
            match = re.search(r'/d/([\w-]+)', menu_file)
            if match:
                sheet_id = match.group(1)
                export_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx'
                response = requests.get(export_url)
                response.raise_for_status()
                menu_file = io.BytesIO(response.content)
            else:
                raise ValueError('Invalid Google Sheets URL')
        else:
            # For other URLs, try to download as Excel
            response = requests.get(menu_file)
            response.raise_for_status()
            menu_file = io.BytesIO(response.content)
    df = pd.read_excel(menu_file)
    items = []
    for idx, row in df.iterrows():
        items.append({
            'id': row['ID'] if 'ID' in row else idx,
            'name': row['Meal Name'],
            'price': row['Average Price (USD)'],
            'image_url': row['Image URL']
        })
    return items

def get_menu_file_for_restaurant(restaurant_id):
    conn = psycopg2.connect(
        host=os.environ.get('PGHOST', 'localhost'),
        database=os.environ.get('PGDATABASE', 'foster the data'),
        user=os.environ.get('PGUSER', 'admin'),
        password=os.environ.get('PGPASSWORD', 'root')
    )
    cur = conn.cursor()
    cur.execute('SELECT menu FROM pos_users WHERE id=%s', (restaurant_id,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    if result and result[0]:
        return result[0]
    return None
