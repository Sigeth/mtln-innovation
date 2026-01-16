from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import os

app = Flask(__name__)

# PostgreSQL configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'your_database'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password')
}

@app.route('/submit', methods=['POST'])
def submit():
    """
    Receives JSON data and executes a SQL query.
    Expected JSON format: {"query": "SELECT * FROM table_name"}
    """
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Missing query in request body'}), 400
        
        sql_query = data['query']
        
        # Execute SQL query
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(sql_query)
        conn.commit()
        
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'result': [dict(row) for row in result]}), 200
    
    except psycopg2.Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/llm', methods=['POST'])
def llm():
    """
    Sends a query to an LLM and returns the response.
    Expected JSON format: {"prompt": "Your question here"}
    """
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Missing prompt in request body'}), 400
        
        prompt = data['prompt']
        
        # Call LLM service
        llm_response = call_llm(prompt)
        
        return jsonify({'success': True, 'response': llm_response}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def call_llm(prompt):
    """
    Placeholder function to call an LLM.
    Replace with your actual LLM API call.
    """
    return "LLM response placeholder"

if __name__ == '__main__':
    app.run(debug=True, port=8000)