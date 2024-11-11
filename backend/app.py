from flask import Flask, request, jsonify, send_file
import os
import torch
import torchaudio
from audiocraft.models import musicgen
import logging
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory storage for playlists (you can use a database for production)
playlists = {}

@app.route('/generate-music', methods=['POST'])
def generate_music():
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400

    try:
        os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:32'
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model = musicgen.MusicGen.get_pretrained('small', device=device)
        model.set_generation_params(duration=2)

        # Generate music based on the prompt
        res = model.generate([prompt], progress=True)

        # Save the generated audio
        audio_title = prompt.replace(" ", "_")  # Create a unique title from the prompt
        output_path = f"{audio_title}.wav"
        torchaudio.save(output_path, res.cpu()[0], sample_rate=32000)

        return jsonify({'audio_url': f'http://localhost:5000/download-music/{audio_title}'}), 200
    except Exception as e:
        logger.error(f"Error generating music: {str(e)}", exc_info=True)
        return jsonify({'error': f"Error generating music: {str(e)}"}), 500

@app.route('/download-music/<title>', methods=['GET'])
def download_music(title):
    try:
        return send_file(f'{title}.wav', as_attachment=True)
    except Exception as e:
        logger.error(f"Error sending file: {str(e)}", exc_info=True)
        return jsonify({'error': f"Error sending file: {str(e)}"}), 500

@app.route('/playlists', methods=['POST'])
def create_playlist():
    data = request.get_json()
    playlist_name = data.get('playlist_name')
    
    if not playlist_name:
        return jsonify({'error': 'Playlist name is required'}), 400
    
    playlists[playlist_name] = []
    return jsonify({'message': f'Playlist "{playlist_name}" created!'}), 201

@app.route('/playlists/<playlist_name>', methods=['GET'])
def get_playlist(playlist_name):
    if playlist_name not in playlists:
        return jsonify({'error': 'Playlist not found'}), 404

    return jsonify(playlists[playlist_name]), 200

@app.route('/playlists/<playlist_name>/add', methods=['POST'])
def add_to_playlist(playlist_name):
    if playlist_name not in playlists:
        return jsonify({'error': 'Playlist not found'}), 404
    
    data = request.get_json()
    audio_title = data.get('audio_title')
    
    if not audio_title:
        return jsonify({'error': 'Audio title is required'}), 400

    playlists[playlist_name].append(audio_title)
    return jsonify({'message': f'Added "{audio_title}" to "{playlist_name}"'}), 200

if __name__ == '__main__':
    app.run(debug=True)

