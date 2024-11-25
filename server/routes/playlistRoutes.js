import express from 'express';
import { Playlist } from '../models/Playlist.js';
import { Audio } from '../models/Audio.js';
import { authMiddleware } from '../controllers/userController.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all playlists for a user
router.get('/playlists', async (req, res) => {
  // console.log(req.query.userId);
  // console.log(" yahan tak toh cha rha");
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    // console.log({ objectId });
    const playlists = await Playlist.find({ userId: objectId });
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: error.message });
  }
});

//get all songs
router.get('/songs', async (req, res) => {

  const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    console.log('Fetching all songs from the database...');
    const objectId = new mongoose.Types.ObjectId(userId);

    
    const songs = await Audio.find({ userId: objectId });

    console.log(`Found ${songs.length} songs in the database`);
    if (!songs.length) {
      console.log('No songs found in the database');
      return res.status(200).json([]);
    }

    const songsList = songs.map((song) => ({
      name: song.title || 'Untitled',
      originalPrompt: song.originalPrompt || song.title || 'Untitled',
      image: 'default-image.jpg',
      audio: `http://localhost:5000/download-music/${song.title}`,
      metadata: song.metadata || {},
    }));
    res.status(200).json(songsList);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Error fetching songs', details: error.message });
  }
});

// download a song
router.get('/download-music/:title', async (req, res) => {
  const { title } = req.params;

  try {
    console.log(`Fetching audio file with title: ${title}`);

    // Fetch the audio document from MongoDB
    const audioDoc = await Audio.findOne({ title });
    if (!audioDoc) {
      logger.warn(`Audio file with title "${title}" not found`);
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Get binary data of the audio file
    const binaryData = audioDoc.audioData || audioDoc.audio_data; // Backward compatibility
    if (!binaryData) {
      logger.error('Audio data is missing in the database document');
      return res.status(500).json({ error: 'Audio data is missing' });
    }

    // Create a readable stream from the binary data
    const audioStream = new Readable();
    audioStream.push(binaryData);
    audioStream.push(null); // Signal the end of the stream

    // Set the response headers for audio streaming
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Disposition': `inline; filename="${title}.wav"`,
    });

    // Pipe the audio stream to the response
    audioStream.pipe(res);

    console.log(`Successfully streamed audio file: ${title}`);
  } catch (error) {
    logger.error(`Error sending audio file: ${error.message}`, { error });
    return res.status(500).json({
      error: 'Error sending audio file',
      details: error.message,
    });
  }
});


// router.get('/', async (req, res) => {
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'User ID is required' });

//     try {
//         const playlists = await Playlist.find({ userId }).populate('songs.songId');
//         res.json(playlists);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });


// Create a playlist for a user
router.post('/playlists', async (req, res) => {
  const { userId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'User ID and playlist name are required.' });
  }

  try {
    const newPlaylist = new Playlist({
      userId,
      name,
      songs: [],
      created_at: new Date(),
      updated_at: new Date(),
    });
    const savedPlaylist = await newPlaylist.save();
    console.log(`Playlist created with ID: ${savedPlaylist._id}`);
    res.status(201).json({
      message: 'Playlist created successfully',
      playlist_id: savedPlaylist._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a song to a playlist
// router.post('/playlists/:playlistId/songs', async (req, res) => {
//     const { playlistId } = req.params;
//     const { songId, title, metadata } = req.body;

//     if (!songId || !title) {
//         return res.status(400).json({ error: 'Song ID and title are required.' });
//     }

//     try {
//         const playlist = await Playlist.findById(playlistId);
//         if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

//         playlist.songs.push({ songId, title, metadata });
//         playlist.updatedAt = Date.now();
//         await playlist.save();

//         res.json({ message: 'Song added to playlist successfully.', playlist });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
router.post("/playlists/:playlistId/songs", async (req, res) => {
  const { playlistId } = req.params;
  const { songTitle } = req.body;

  if (!songTitle) {
    return res.status(400).json({ error: "Song title is required" });
  }

  try {
    // Find the song by title or originalPrompt
    const song = await Audio.findOne({
      $or: [{ title: songTitle }, { originalPrompt: songTitle }]
    });

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    // Find the playlist and update it
    const result = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $addToSet: { songs: song._id }, // Add the song ID to the playlist (avoid duplicates)
        $set: { updatedAt: new Date() } // Update the `updatedAt` field
      },
      { new: true } // Return the updated playlist
    );

    if (!result) {
      return res.status(404).json({ error: "Playlist not found or song already in playlist" });
    }

    res.status(200).json({ message: "Song added to playlist successfully", playlist: result });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//get songs in the playlist
router.get("/playlists/:playlistId/songs", async (req, res) => {
  const { playlistId } = req.params;

  try {
    // Find the playlist by ID
    const playlist = await Playlist.findById(playlistId).populate("songs.songId");

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Extract songs with metadata
    const formattedSongs = playlist.songs.map(({ songId, addedAt }) => {
      if (!songId) return null; // Skip if the songId reference is broken or null

      return {
        name: songId.title || "Untitled",
        originalPrompt: songId.originalPrompt || songId.title || "Untitled",
        audio: `http://localhost:5000/download-music/${songId.title}`, // Replace with your actual URL
        metadata: {
          ...songId.metadata,
          addedAt, // Include the date the song was added to the playlist
        },
      };
    });

    // Remove null values (in case of broken references)
    const sanitizedSongs = formattedSongs.filter(song => song !== null);

    return res.status(200).json(sanitizedSongs);
  } catch (error) {
    console.error(`Error fetching playlist songs: ${error}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a playlist
// router.delete('/playlists/:playlistId', async (req, res) => {
//     const { playlistId } = req.params;

//     try {
//         const result = await Playlist.findByIdAndDelete(playlistId);
//         if (!result) return res.status(404).json({ error: 'Playlist not found.' });

//         res.json({ message: 'Playlist deleted successfully.' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

router.delete("/playlists/:playlistId", async (req, res) => {
  const { playlistId } = req.params;

  try {
    // Attempt to delete the playlist
    const result = await Playlist.deleteOne({ _id: playlistId });

    // Check if any playlist was deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Successfully deleted
    return res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error(`Error deleting playlist: ${error}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
