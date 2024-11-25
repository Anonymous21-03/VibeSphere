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

def analyze_face(image_file):
    try:
        # Load the image
        image = Image.open(image_file)
        frame = cv.cvtColor(np.array(image), cv.COLOR_RGB2BGR)

        h, w, _ = frame.shape
        logger.info(f"Image dimensions: {w}x{h}")

        with mp_facemesh.FaceMesh(max_num_faces=1, min_detection_confidence=0.5, min_tracking_confidence=0.5) as face_mesh:
            rgb_frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
        
            if not results.multi_face_landmarks:
                logger.warning('No face detected in the image')
                return 'No face detected', None

            # Extract face landmarks
            face_coords = [
                (int(point.x * w), int(point.y * h))
                for point in results.multi_face_landmarks[0].landmark
            ]

            x_min, y_min = max(0, min(x for x, _ in face_coords)), max(0, min(y for _, y in face_coords))
            x_max, y_max = min(w, max(x for x, _ in face_coords)), min(h, max(y for _, y in face_coords))
            logger.debug(f"Face coordinates: x_min={x_min}, y_min={y_min}, x_max={x_max}, y_max={y_max}")
            
            face_roi = frame[y_min:y_max, x_min:x_max]

            if face_roi.size > 0:
                # Optionally resize ROI for faster analysis
                face_roi_rgb = cv.cvtColor(face_roi, cv.COLOR_BGR2RGB)
                face_roi_resized = cv.resize(face_roi_rgb, (224, 224))

                analysis = DeepFace.analyze(face_roi_resized, actions=['emotion'], enforce_detection=False)
                emotion = analysis[0]['dominant_emotion']
                logger.info(f'Emotion analysis completed. Dominant emotion: {emotion}')
                return 'Success', emotion
            else:
                logger.warning('Face ROI is empty')
                return 'Face detected, but ROI is empty', None
    except Exception as e:
        logger.error(f'Error in emotion analysis: {str(e)}', exc_info=True)
        return f'Error in emotion analysis: {str(e)}', None
