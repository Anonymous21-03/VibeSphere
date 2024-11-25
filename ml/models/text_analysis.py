from transformers import pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the emotion analysis pipeline
emotion_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")

def analyze_text(text):
    try:
        # Analyze the text for emotions
        logger.info("Analyzing text for emotions...")
        results = emotion_pipeline(text)
        
        # Extract the top emotion and its score
        dominant_emotion = max(results, key=lambda x: x['score'])
        
        response = {
            'text': text,
            'dominant_emotion': dominant_emotion['label'],
            'confidence': dominant_emotion['score'],
            'all_emotions': {result['label']: result['score'] for result in results}
        }
        logger.info(f"Emotion analysis result: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in text emotion analysis: {str(e)}", exc_info=True)
        return {'error': str(e)}
