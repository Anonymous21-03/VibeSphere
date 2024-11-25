import mongoose from 'mongoose';

const AudioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalPrompt: { type: String, required: true },
  audioData: { type: Buffer, required: true },
  metadata: {
    duration: { type: Number, required: true }, // Duration in seconds
    sampleRate: { type: Number, required: true }, // Audio sample rate
    format: { type: String, required: true }, // Format of the audio file (e.g., "wav")
    createdAt: { type: Date, default: Date.now }, // Timestamp for creation
    generationParams: {
      model: { type: String }, // Model used for generation
      device: { type: String } // Device used (e.g., "cpu", "cuda")
    }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
});

const AudioModel = mongoose.model('Audio', AudioSchema);
export { AudioModel as Audio };
