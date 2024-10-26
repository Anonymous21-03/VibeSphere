import cv2 as cv
import numpy as np
from imageAnalysis import analyze_face
import io
import tempfile

def analyze_video(video_file):
    # Save video file to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        video_file.save(temp_file.name)
        temp_file_path = temp_file.name

    # Open the temporary video file using OpenCV
    cap = cv.VideoCapture(temp_file_path)

    if not cap.isOpened():
        return 'Error loading video', None

    emotions = []
    emotion_updates = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break  # Exit when no more frames are available

        # Analyze each frame as if it were an image
        frame_rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        try:
            status, emotion = analyze_face(io.BytesIO(cv.imencode('.jpg', frame_rgb)[1]))
            if status == 'Success':
                emotions.append(emotion)
                emotion_updates.append({'frame': frame, 'emotion': emotion})
            else:
                emotion_updates.append({'frame': frame, 'emotion': 'No face detected'})
        except Exception as e:
            print(f"Error during emotion analysis: {e}")
            emotion_updates.append({'frame': frame, 'emotion': 'Error during analysis'})

    cap.release()

    # Analyze emotions over the entire video (you could return the most frequent emotion, average, etc.)
    if emotions:
        dominant_emotion = max(set(emotions), key=emotions.count)
        return 'Success', {'dominant_emotion': dominant_emotion, 'emotion_updates': emotion_updates}
    else:
        return 'No emotions detected', None
