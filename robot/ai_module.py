import requests
import json

# Replace with your actual Gemini API Key
APIKEY = "YOUR_API_KEY"

def get_ai_decision(sensor_data):
    # Using gemini-3-flash-preview for high efficiency on Pi 02W
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={APIKEY}"

    prompt = f"""
    You are the AquaVortex AI decision engine.
    Sensor Data:
    Distance: {sensor_data['distance']} cm
    Current: {sensor_data['current']} A
    Battery: {sensor_data['battery']} V
    Tilt: {sensor_data['tilt']} degrees

    Decide robot actions based on these rules:
    - If distance < 30cm, move BACKWARD.
    - If current > 2.5A, set vibration to HIGH.
    - If battery < 11.5V, move STOP and suction OFF.

    Output JSON ONLY:
    {{
      "movement": "FORWARD | BACKWARD | STOP",
      "vibration_level": "LOW | MEDIUM | HIGH",
      "suction": "ON | OFF"
    }}
    """

    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        response = requests.post(url, json=data, timeout=5)
        response.raise_for_status()
        text = response.json()['candidates'][0]['content']['parts'][0]['text']
        # Clean potential markdown
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text
    except Exception as e:
        print(f"AI Call failed: {e}")
        return '{"movement":"STOP","vibration_level":"LOW","suction":"OFF"}'
