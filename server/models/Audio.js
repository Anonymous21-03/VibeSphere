import mongoose from "mongoose";

const audioSchema = new mongoose.Schema({
    title: String,
    originalPrompt: String,
    audioData: Buffer,
    metadata: {
      duration: Number,
      sampleRate: Number,
      format: String,
      createdAt: Date,
      generationParams: Object,
    },
  });

const Audio = mongoose.model('Audio', audioSchema);
export {Audio}
