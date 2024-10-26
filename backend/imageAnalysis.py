import cv2 as cv
import mediapipe as mp
from deepface import DeepFace
import numpy as np
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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