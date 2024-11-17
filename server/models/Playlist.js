import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    name: String,
    songs: [String],
    // userId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User', // Reference to the User model
    //     required: true,
    //   },
    created_at: Date,
    updated_at: Date,
  });

const Playlist = mongoose.model('Playlist', playlistSchema);
export {Playlist}