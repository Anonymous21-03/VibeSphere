import os
import io
import torch
import torchaudio
from flask import Flask, request, jsonify, send_file
from audiocraft.models import musicgen
from pymongo import MongoClient
from bson import Binary, ObjectId
from flask_cors import CORS
import logging
from datetime import datetime
import cv2 as cv
import mediapipe as mp
from deepface import DeepFace
import numpy as np
from PIL import Image
import tempfile
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask App Setup
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# MongoDB Setup
client = MongoClient("mongodb+srv://projmajor76:HZh8KLlnHtg9GfaK@majordb.lv1eb.mongodb.net/")
# db = client["musicDB"]
# audio_collection = db["audio_files"]
# playlist_collection = db["playlists"]

db = client["test"]
audio_collection = db["audios"]
playlist_collection = db["playlists"]

# Initialize MediaPipe Face Mesh
mp_facemesh = mp.solutions.face_mesh
face_mesh = mp_facemesh.FaceMesh(max_num_faces=1, min_detection_confidence=0.5, min_tracking_confidence=0.5)

def analyze_face(image_file):
    try:
        # Load the image
        image = Image.open(image_file)
        frame = cv.cvtColor(np.array(image), cv.COLOR_RGB2BGR)

        rgb_frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            logger.warning('No face detected in the image')
            return 'No face detected', None

        h, w, _ = frame.shape
        face_coords = [(int(point.x * w), int(point.y * h)) for point in results.multi_face_landmarks[0].landmark]
        x_min, y_min = max(0, min(x for x, _ in face_coords)), max(0, min(y for _, y in face_coords))
        x_max, y_max = min(w, max(x for x, _ in face_coords)), min(h, max(y for _, y in face_coords))
        
        face_roi = frame[y_min:y_max, x_min:x_max]

        if face_roi.size > 0:
            # Use the original face_roi for analysis instead of resizing
            face_roi_rgb = cv.cvtColor(face_roi, cv.COLOR_BGR2RGB)
            
            analysis = DeepFace.analyze(face_roi_rgb, actions=['emotion'], enforce_detection=False)
            emotion = analysis[0]['dominant_emotion']
            logger.info(f'Emotion analysis completed. Dominant emotion: {emotion}')
            return 'Success', emotion
        else:
            logger.warning('Face ROI is empty')
            return 'Face detected, but ROI is empty', None
    except Exception as e:
        logger.error(f'Error in emotion analysis: {str(e)}', exc_info=True)
        return f'Error in emotion analysis: {str(e)}', None
@app.route('/upload_video', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        # Save the uploaded file temporarily
        temp_filename = os.path.join(tempfile.gettempdir(), file.filename)
        file.save(temp_filename)

        # Open the video file using the saved path
        video = cv.VideoCapture(temp_filename)
        emotions = []
        frame_count = 0

        while True:
            ret, frame = video.read()
            if not ret:
                break

            frame_count += 1
            
            # Process every 10th frame to optimize performance
            if frame_count % 10 == 0:
                # Convert frame to PIL Image
                pil_image = Image.fromarray(cv.cvtColor(frame, cv.COLOR_BGR2RGB))
                
                # Create a temporary file-like object in memory
                img_byte_arr = io.BytesIO()
                pil_image.save(img_byte_arr, format='PNG')
                img_byte_arr.seek(0)

                # Reuse existing face analysis function
                result, emotion = analyze_face(img_byte_arr)
                
                if result == 'Success' and emotion:
                    emotions.append(emotion)

        video.release()

        # Remove the temporary file
        os.unlink(temp_filename)

        # Determine dominant emotion
        if emotions:
            from collections import Counter
            dominant_emotion = Counter(emotions).most_common(1)[0][0]

            return jsonify({
                'emotion': dominant_emotion,
                'detected_emotions': emotions
            }), 200
        else:
            return jsonify({"error": "No emotions detected"}), 400

    except Exception as e:
        # Ensure temporary file is deleted even if an error occurs
        if 'temp_filename' in locals() and os.path.exists(temp_filename):
            os.unlink(temp_filename)
        
        logger.error(f'Video analysis error: {str(e)}', exc_info=True)
        return jsonify({
            'error': f'Video analysis failed: {str(e)}'
        }), 500
        
# Music Generation Routes
@app.route('/generate-music', methods=['POST'])
def generate_music():
    data = request.get_json()
    prompt = data.get('prompt')
    username = data.get('username')  # Extract username from request

    # Check if username is provided and not null
    if not username:
        return jsonify({'error': 'User must be logged in to generate music'}), 401

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

        # Store in MongoDB with username
        audio_doc = {
            "title": audio_title,
            "originalPrompt": prompt,
            "username": username,  # Add username to the document
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
        binary_data = audio_doc.get("audioData") or audio_doc.get("audio_data")

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

# Songs Routes
@app.route('/api/songs', methods=['GET'])
def get_all_songs():
    try:
        # Optional username filter
        username = request.args.get('username')
        
        # Build query based on username if provided
        query = {'username': username} if username else {}
        
        logger.info(f"Fetching songs with query: {query}")
        
        songs = list(audio_collection.find(query))
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
                    "username": song.get("username"),  # Include username in response
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
        
# Playlist Routes
@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    try:
        playlists = list(playlist_collection.find())
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

# Image Analysis Route
@app.route('/ml/analyze-image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        result, emotion = analyze_face(file)
        
        if result == 'Success':
            return jsonify({"emotion": emotion})
        else:
            return jsonify({"error": result}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)