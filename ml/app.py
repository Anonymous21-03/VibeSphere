from flask import Flask, request, jsonify
from models.image_analysis import analyze_face
from models.video_analysis import analyze_video
from models.text_analysis import analyze_text
from models.music_generation import generate_music

app = Flask(__name__)

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    image_file = request.files['file']
    status, emotion = analyze_face(image_file)
    return jsonify({'status': status, 'emotion': emotion}), 200

@app.route('/analyze-video', methods=['POST'])
def analyze_video_route():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    video_file = request.files['file']
    status, data = analyze_video(video_file)
    return jsonify({'status': status, 'data': data}), 200

@app.route('/analyze-text', methods=['POST'])
def analyze_text_route():
    text = request.json.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    analysis_result = analyze_text(text)
    return jsonify(analysis_result), 200

@app.route('/generate-music', methods=['POST'])
def generate_music_route():
    prompt = request.json.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    audio_url = generate_music(prompt)
    return jsonify({'audio_url': audio_url}), 200

if __name__ == '__main__':
    app.run(port=5001, debug=True)
