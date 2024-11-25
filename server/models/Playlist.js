// import mongoose from "mongoose";

// const playlistSchema = new mongoose.Schema({
//     name: String,
//     songs: [String],
//     // userId: {
//     //     type: mongoose.Schema.Types.ObjectId,
//     //     ref: 'User', // Reference to the User model
//     //     required: true,
//     //   },
//     created_at: Date,
//     updated_at: Date,
//   });

// const Playlist = mongoose.model('Playlist', playlistSchema);
// export {Playlist}

import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to User
    name: { type: String, required: true },
    songs: [
        {
            songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio' },
            addedAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export {Playlist};
