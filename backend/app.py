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

# Anthropic API configuration
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

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
    Sends a query to Claude via Anthropic API and returns the response.
    Expected JSON format: {"prompt": "Your question here"}
    """
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Missing prompt in request body'}), 400
        
        if not ANTHROPIC_API_KEY:
            return jsonify({'error': 'ANTHROPIC_API_KEY not configured'}), 500
        
        prompt = data['prompt']
        
        # Call Claude API
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            json={
                'model': 'claude-opus-4-1',
                'max_tokens': 1024,
                'messages': [
                    {
                        'role': 'user',
                        'content': f'Tu es un assistant militaire expert en gestion de bases. Réponds en français de manière concise et professionnelle.\n\n{prompt}'
                    }
                ]
            }
        )
        
        if response.status_code != 200:
            return jsonify({'error': f'Anthropic API error: {response.text}'}), 500
        
        result = response.json()
        llm_response = result['content'][0]['text']
        
        return jsonify({'success': True, 'response': llm_response}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def stats():
    """
    Returns aggregated statistics for each building.
    - fuel, water, provisions: latest value from most recent report
    - satisfaction: average across all reports
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get latest report per building with avg satisfaction
        stats_sql = """
            SELECT 
                building_name,
                AVG(satisfaction) as avg_satisfaction,
                (ARRAY_AGG(fuel ORDER BY report_date DESC))[1] as fuel,
                (ARRAY_AGG(water ORDER BY report_date DESC))[1] as water,
                (ARRAY_AGG(provisions ORDER BY report_date DESC))[1] as provisions,
                MAX(report_date) as last_report_date,
                COUNT(*) as total_reports
            FROM building_reports
            GROUP BY building_name
            ORDER BY building_name;
        """
        
        cur.execute(stats_sql)
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        stats_data = []
        for row in results:
            stats_data.append({
                'building_name': row['building_name'],
                'avg_satisfaction': round(row['avg_satisfaction'], 2) if row['avg_satisfaction'] else None,
                'fuel': row['fuel'],
                'water': row['water'],
                'provisions': row['provisions'],
                'last_report_date': row['last_report_date'].isoformat() if row['last_report_date'] else None,
                'total_reports': row['total_reports']
            })
        
        return jsonify({'success': True, 'stats': stats_data}), 200
    
    except psycopg2.Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000)