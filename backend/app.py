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
from bson import ObjectId
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
client = MongoClient("mongodb://localhost:27017/")
db = client["musicDB"]
audio_collection = db["audio_files"]
playlist_collection = db["playlists"]

# In-memory storage for playlists
playlists = {}

@app.route('/api/songs', methods=['GET'])
def get_all_songs():
    try:
        logger.info("Fetching all songs from database...")
        
        # Add explicit cursor conversion to list to avoid cursor timeout
        songs = list(audio_collection.find())
        logger.info(f"Found {len(songs)} songs in database")
        
        if not songs:
            logger.info("No songs found in database")
            return jsonify([]), 200
        
        songs_list = []
        for song in songs:
            try:
                song_data = {
                    "name": song.get("title", "Untitled"),
                    "originalPrompt": song.get("originalPrompt", song.get("title", "Untitled")),
                    "image": "default-image.jpg",
                    "audio": f'http://localhost:5000/download-music/{song["title"]}',
                    "metadata": {
                        "createdAt": song.get("metadata", {}).get("createdAt", datetime.now()).isoformat(),
                        "duration": song.get("metadata", {}).get("duration", 0),
                        "sampleRate": song.get("metadata", {}).get("sampleRate", 0),
                    }
                }
                songs_list.append(song_data)
            except Exception as e:
                logger.error(f"Error processing song {song.get('title', 'Unknown')}: {str(e)}")
                continue
        
        logger.info(f"Successfully processed {len(songs_list)} songs")
        return jsonify(songs_list), 200
        
    except Exception as e:
        logger.error(f"Error fetching songs: {str(e)}", exc_info=True)
        return jsonify({
            'error': "Error fetching songs",
            'details': str(e)
        }), 500

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
        audio_title = prompt.replace(" ", "_")
        
        # Use BytesIO buffer for in-memory storage
        buffer = io.BytesIO()
        torchaudio.save(buffer, res.cpu()[0], sample_rate=32000, format="wav")
        buffer.seek(0)

        # Convert buffer to binary for MongoDB storage
        binary_audio = Binary(buffer.read())

        # Store in MongoDB
        audio_doc = {
            "title": audio_title,
            "originalPrompt": prompt,
            "audioData": binary_audio,
            "metadata": {
                "duration": 2,
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
            as_attachment=False,
            download_name=f"{title}.wav"
        )
    except Exception as e:
        logger.error(f"Error sending file: {str(e)}", exc_info=True)
        return jsonify({'error': f"Error sending file: {str(e)}"}), 500

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    try:
        playlists = list(playlist_collection.find())
        # Convert ObjectId to string for JSON serialization
        for playlist in playlists:
            playlist['_id'] = str(playlist['_id'])
        return jsonify(playlists), 200
    except Exception as e:
        logger.error(f"Error fetching playlists: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/playlists', methods=['POST'])
def create_playlist():
    try:
        data = request.get_json()
        playlist_name = data.get('name')
        
        if not playlist_name:
            return jsonify({'error': 'Playlist name is required'}), 400
        
        new_playlist = {
            'name': playlist_name,
            'songs': [],
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        result = playlist_collection.insert_one(new_playlist)
        
        return jsonify({
            'message': 'Playlist created successfully',
            'playlist_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating playlist: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/playlists/<playlist_id>/songs', methods=['POST'])
def add_song_to_playlist(playlist_id):
    try:
        data = request.get_json()
        song_title = data.get('songTitle')
        
        if not song_title:
            return jsonify({'error': 'Song title is required'}), 400
            
        # Find song by title or original prompt
        song = audio_collection.find_one({
            '$or': [
                {'title': song_title},
                {'originalPrompt': song_title}
            ]
        })
        
        if not song:
            return jsonify({'error': 'Song not found'}), 404
            
        # Update playlist with song data
        result = playlist_collection.update_one(
            {'_id': ObjectId(playlist_id)},
            {
                '$addToSet': {'songs': song_title},
                '$set': {'updated_at': datetime.now()}
            }
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Playlist not found or song already in playlist'}), 404
            
        return jsonify({'message': 'Song added to playlist successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error adding song to playlist: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/playlists/<playlist_id>/songs', methods=['GET'])
def get_playlist_songs(playlist_id):
    try:
        playlist = playlist_collection.find_one({'_id': ObjectId(playlist_id)})
        if not playlist:
            return jsonify({'error': 'Playlist not found'}), 404
            
        # Get all songs in the playlist
        song_titles = playlist.get('songs', [])
        songs = []
        
        for title in song_titles:
            song = audio_collection.find_one({
                '$or': [
                    {'title': title},
                    {'originalPrompt': title}
                ]
            })
            if song:
                songs.append({
                    'name': song.get('title', 'Untitled'),
                    'originalPrompt': song.get('originalPrompt'),
                    'audio': f'http://localhost:5000/download-music/{song["title"]}',
                    'metadata': song.get('metadata', {})
                })
                
        return jsonify(songs), 200
        
    except Exception as e:
        logger.error(f"Error fetching playlist songs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/playlists/<playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    try:
        result = playlist_collection.delete_one({'_id': ObjectId(playlist_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Playlist not found'}), 404
            
        return jsonify({'message': 'Playlist deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting playlist: {str(e)}")
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)