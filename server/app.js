import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";

import userRoute from "./routes/userRoute.js"
import playlistRoutes from './routes/playlistRoutes.js';
import mlRoutes from './routes/mlRoutes.js';


const app = express();
dotenv.config();
const PORT = process.env.PORT || 8000;
const CONNECTION_URL  = process.env.CONNECTION_URL;

// Middleware
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  // methods: ['GET', 'POST', 'OPTIONS'], 
  // allowedHeaders: ['Content-Type', 'Authorization'], 
};
app.use(cors(corsOptions)); 
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/auth',userRoute);
app.use('/ml', mlRoutes);
app.use('/playlist',playlistRoutes);


// MongoDB Setup
const connectDB = async () => {
  try {
    await mongoose.connect(CONNECTION_URL);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

// Define Schemas
// const audioSchema = new mongoose.Schema({
//   title: String,
//   originalPrompt: String,
//   audioData: Buffer,
//   metadata: {
//     duration: Number,
//     sampleRate: Number,
//     format: String,
//     createdAt: Date,
//     generationParams: Object,
//   },
// });

// const playlistSchema = new mongoose.Schema({
//   name: String,
//   songs: [String],
//   created_at: Date,
//   updated_at: Date,
// });

// Define Models
// const Audio = mongoose.model('Audio', audioSchema);
// const Playlist = mongoose.model('Playlist', playlistSchema);

// Routes

// Get all songs
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Audio.find();
    const songsList = songs.map(song => ({
      name: song.title || 'Untitled',
      originalPrompt: song.originalPrompt || song.title || 'Untitled',
      image: 'default-image.jpg',
      audio: `http://localhost:5000/download-music/${song.title}`,
      metadata: song.metadata,
    }));
    res.json(songsList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching songs', details: err.message });
  }
});

// Generate music by forwarding the request to Flask
app.post('/generate-music', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const flaskResponse = await axios.post('http://localhost:5000/generate-music', { prompt });
    const { audio_url } = flaskResponse.data;

    res.json({ audio_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating music', details: err.message });
  }
});

// Download music
app.get('/download-music/:title', async (req, res) => {
  const { title } = req.params;

  try {
    const audio = await Audio.findOne({ title });
    if (!audio) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    res.contentType('audio/wav').send(audio.audioData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error downloading music', details: err.message });
  }
});

// Get all playlists
app.get('/api/playlists', async (req, res) => {
  try {
    const playlists = await Playlist.find();
    res.json(playlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching playlists', details: err.message });
  }
});

// Create a new playlist
app.post('/api/playlists', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }

  try {
    const newPlaylist = new Playlist({
      name,
      songs: [],
      created_at: new Date(),
      updated_at: new Date(),
    });
    const savedPlaylist = await newPlaylist.save();
    res.status(201).json({ message: 'Playlist created successfully', playlist_id: savedPlaylist._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating playlist', details: err.message });
  }
});

// Add a song to a playlist
app.post('/api/playlists/:playlist_id/songs', async (req, res) => {
  const { playlist_id } = req.params;
  const { songTitle } = req.body;

  if (!songTitle) {
    return res.status(400).json({ error: 'Song title is required' });
  }

  try {
    const song = await Audio.findOne({ $or: [{ title: songTitle }, { originalPrompt: songTitle }] });

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const playlist = await Playlist.findByIdAndUpdate(
      playlist_id,
      {
        $addToSet: { songs: songTitle },
        $set: { updated_at: new Date() },
      },
      { new: true }
    );

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or song already in playlist' });
    }

    res.json({ message: 'Song added to playlist successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding song to playlist', details: err.message });
  }
});



// Start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Node.js server running on http://localhost:${PORT}`);
  });
});
