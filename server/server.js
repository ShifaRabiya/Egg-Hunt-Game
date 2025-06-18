require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.DB)
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error'));

// Schema & Model
const scoreSchema = new mongoose.Schema({ highScore: Number });
const Score = mongoose.model('Score', scoreSchema);

// API to get highest score
app.get('/highscore', async (req, res) => {
  let scoreDoc = await Score.findOne();
  if (!scoreDoc) {
    scoreDoc = await Score.create({ highScore: 0 });
  }
  res.json({ highScore: scoreDoc.highScore });
});

// API to update high score
app.post('/highscore', async (req, res) => {
  const { score } = req.body;
  let scoreDoc = await Score.findOne();
  if (!scoreDoc) {
    scoreDoc = await Score.create({ highScore: score });
  } else if (score > scoreDoc.highScore) {
    scoreDoc.highScore = score;
    await scoreDoc.save();
  }
  res.json({ highScore: scoreDoc.highScore });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
