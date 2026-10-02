from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import numpy as np
import os

# Set current directory to serve static files (index.html, script.js, style.css)
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Load your Colab model.pkl
try:
    model = joblib.load('model.pkl')
    print("✅ Successfully loaded Colab 'model.pkl' (17 Features Model)!")
except Exception as e:
    print(f"❌ Error loading 'model.pkl': {e}")
    model = None

# 1. Route to serve the frontend dashboard on http://localhost:5000
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# 2. Health check route
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "model_loaded": model is not None})

# 3. ML Prediction API Endpoint
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    if model is None:
        return jsonify({"error": "model.pkl not loaded"}), 500

    data = request.get_json() or {}

    try:
        # Map 17 Features in exact order trained in Colab
        age = float(data.get('age', 20))
        gender = 1 if data.get('gender') == 'male' else 0
        family_income = float(data.get('family_income', 50000))
        internet_access = 1 if data.get('internet', 'yes') == 'yes' else 0
        study_hours = float(data.get('study_hours', 3.5))
        attendance_rate = float(data.get('attendance', 75.0))
        assignment_delay = float(data.get('assignment_delay', 1))
        travel_time = float(data.get('travel_time', 30))
        part_time_job = 1 if data.get('part_time', 'no') == 'yes' else 0
        scholarship = 1 if data.get('scholarship', 'no') == 'yes' else 0
        stress_index = float(data.get('stress_index', 5))
        gpa = float(data.get('gpa', 2.8))
        semester_gpa = float(data.get('semester_gpa', gpa))
        cgpa = float(data.get('cgpa', gpa))
        semester = int(data.get('semester', 3))
        
        dept_map = {'computer_science': 0, 'engineering': 1, 'business': 2, 'arts': 3}
        department = dept_map.get(data.get('department'), 0)
        
        parent_map = {'high_school': 0, 'bachelors': 1, 'masters': 2}
        parental_edu = parent_map.get(data.get('parentEdu'), 1)

        # 17 Feature Array
        features = np.array([[
            age, gender, family_income, internet_access, study_hours,
            attendance_rate, assignment_delay, travel_time, part_time_job,
            scholarship, stress_index, gpa, semester_gpa, cgpa,
            semester, department, parental_edu
        ]])

        prediction = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        confidence = float(probabilities[prediction]) * 100.0

        is_dropout = (prediction == 1)

        if attendance_rate < 70.0:
            rule_desc = f"IF Attendance_Rate ({attendance_rate}%) < 70% OR Assignment Delay ({assignment_delay}d) > 2"
        elif gpa < 2.2:
            rule_desc = f"IF Attendance_Rate >= 70% AND GPA ({gpa:.2f}) < 2.20 AND Stress Index ({stress_index}/10)"
        else:
            rule_desc = f"IF Attendance ({attendance_rate}%) >= 70% AND CGPA ({cgpa:.2f}) >= 2.20"

        recommendation = (
            "HIGH RISK ALERT: Schedule academic advising, evaluate assignment deadlines, and review financial/scholarship aid."
            if is_dropout else
            "LOW RISK: Student is progressing within normal academic parameters."
        )

        return jsonify({
            "status": "Dropout" if is_dropout else "Retained",
            "is_dropout": is_dropout,
            "confidence": round(confidence, 1),
            "rule_triggered": rule_desc,
            "recommendation": recommendation,
            "source": "Colab PKL Model (17 Features)"
        })

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 400

if __name__ == '__main__':
    print("🚀 Running Web App on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)