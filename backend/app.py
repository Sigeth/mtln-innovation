from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import os

app = Flask(__name__)

# PostgreSQL configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'db'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'mydatabase'),
    'user': os.getenv('DB_USER', 'user'),
    'password': os.getenv('DB_PASSWORD', 'password')
}

@app.route('/api/submit', methods=['POST'])
def submit():
    """
    Receives JSON report from frontend and inserts it into building_reports table.
    Expected JSON fields (from frontend):
      - buildingName (string)
      - date (YYYY-MM-DD)
      - commanderNote (string)
      - photoCaption (string)
      - satisfaction (int)
      - fuel (number or string)
      - water (number or string)
      - provisions (number or string)
      - armament (string)
      - defibrillators { available, total }
      - previsionJ1 (string)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON body'}), 400

        # Required minimal fields
        building_name = data.get('buildingName')
        report_date = data.get('date')  # expected YYYY-MM-DD
        if not building_name or not report_date:
            return jsonify({'error': 'Missing buildingName or date'}), 400

        commander_note = data.get('commanderNote')
        photo_caption = data.get('photoCaption')
        satisfaction = data.get('satisfaction')
        try:
            satisfaction = int(satisfaction) if satisfaction is not None else None
        except (ValueError, TypeError):
            satisfaction = None

        fuel = data.get('fuel')
        water = data.get('water')
        provisions = data.get('provisions')
        armament = data.get('armament')
        defibs = data.get('defibrillators') or {}
        defib_available = defibs.get('available')
        defib_total = defibs.get('total')
        prevision_j1 = data.get('previsionJ1')

        insert_sql = """
            INSERT INTO building_reports (
                building_name,
                report_date,
                commander_note,
                photo_caption,
                satisfaction,
                fuel,
                water,
                provisions,
                armament,
                defibrillators_available,
                defibrillators_total,
                prevision_j1
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at;
        """

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(insert_sql, (
            building_name,
            report_date,
            commander_note,
            photo_caption,
            satisfaction,
            fuel,
            water,
            provisions,
            armament,
            defib_available,
            defib_total,
            prevision_j1
        ))
        inserted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({'success': True, 'inserted': inserted}), 201

    except psycopg2.Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/llm', methods=['POST'])
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
    app.run(host="0.0.0.0", port=8000)