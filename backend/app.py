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

@app.route('/generate-music', methods=['POST'])
def generate_music():
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400

    try:
        # Set PyTorch memory allocation strategy
        os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:32'

        # Check if CUDA is available
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model = musicgen.MusicGen.get_pretrained('small', device=device)
        model.set_generation_params(duration=30)

        # Generate music based on the prompt
        res = model.generate([prompt], progress=True)

        # Save the generated audio
        output_path = "generated_music.wav"
        torchaudio.save(output_path, res.cpu()[0], sample_rate=32000)

        return jsonify({'audio_url': f'http://localhost:5000/download-music'}), 200
    except Exception as e:
        logger.error(f"Error generating music: {str(e)}", exc_info=True)
        return jsonify({'error': f"Error generating music: {str(e)}"}), 500

@app.route('/download-music', methods=['GET'])
def download_music():
    try:
        return send_file('generated_music.wav', as_attachment=True)
    except Exception as e:
        logger.error(f"Error sending file: {str(e)}", exc_info=True)
        return jsonify({'error': f"Error sending file: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
