import cv2 as cv
from models.image_analysis import analyze_face
import tempfile

def analyze_video(video_file):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        video_file.save(temp_file.name)
        temp_file_path = temp_file.name

    cap = cv.VideoCapture(temp_file_path)
    if not cap.isOpened():
        return 'Error loading video', None

    emotions = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        status, emotion = analyze_face(frame_rgb)
        if status == 'Success':
            emotions.append(emotion)

    cap.release()
    dominant_emotion = max(set(emotions), key=emotions.count) if emotions else 'No emotions detected'
    return 'Success', {'dominant_emotion': dominant_emotion, 'emotions': emotions}
