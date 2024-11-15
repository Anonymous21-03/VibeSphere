import os
import io
import torch
import torchaudio
from flask import Flask, request, jsonify, send_file
from audiocraft.models import musicgen
from pymongo import MongoClient
from bson import Binary
import logging
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017/")  # Adjust this with your MongoDB URI
db = client["musicDB"]
audio_collection = db["audio_files"]

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

        # Save the generated audio to memory
        audio_title = prompt.replace(" ", "_")  # Create a unique title from the prompt
        
        # Use BytesIO buffer for in-memory storage
        buffer = io.BytesIO()
        torchaudio.save(buffer, res.cpu()[0], sample_rate=32000, format="wav")
        buffer.seek(0)  # Reset buffer position for reading

        # Convert buffer to binary for MongoDB storage
        binary_audio = Binary(buffer.read())

        # Store in MongoDB
        audio_doc = {
            "title": audio_title,
            "originalPrompt": prompt,
            "audioData": binary_audio,
            "metadata": {
                "duration": 2,  # From your model.set_generation_params
                "sampleRate": 32000,
                "format": "wav",
                "createdAt": datetime.now(),
                "generationParams": {
                    "model": "small",
                    "device": str(device)
                }
            }
        }
        audio_collection.insert_one(audio_doc)


        return jsonify({'audio_url': f'http://localhost:5000/download-music/{audio_title}'}), 200
    except Exception as e:
        logger.error(f"Error generating music: {str(e)}", exc_info=True)
        return jsonify({'error': f"Error generating music: {str(e)}"}), 500

@app.route('/download-music/<title>', methods=['GET'])
def download_music(title):
    try:
        # Fetch the audio file from MongoDB
        audio_doc = audio_collection.find_one({"title": title})
        if not audio_doc:
            return jsonify({'error': 'Audio file not found'}), 404

        # Get the audio data
        if "audioData" in audio_doc:
            binary_data = audio_doc["audioData"]
        else:
            binary_data = audio_doc["audio_data"]  # for backwards compatibility

        # Create a BytesIO object from the binary data
        audio_buffer = io.BytesIO(binary_data)
        
        # Send the file with correct headers
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=False,  # Changed to False to allow direct playback
            download_name=f"{title}.wav"
        )
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

@app.route('/api/songs', methods=['GET'])
def get_all_songs():
    try:
        songs = audio_collection.find()  # Fetch all songs from the DB
        songs_list = [
            {
                "name": song["title"], 
                "originalPrompt": song.get("originalPrompt", song["title"]),
                "image": "default-image.jpg", 
                "audio": f'http://localhost:5000/download-music/{song["title"]}',
                "metadata": song.get("metadata", {})
            }
            for song in songs
        ]
        return jsonify(songs_list), 200
    except Exception as e:
        logger.error(f"Error fetching songs: {str(e)}", exc_info=True)
        return jsonify({'error': f"Error fetching songs: {str(e)}"}), 500
