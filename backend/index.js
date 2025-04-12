const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
app.use(express.json()); 
app.use(express.json()); // So Express know you're using JSON
const cors = require('cors');
app.use(cors());

const uri = "mongodb+srv://vatsalkpr:GetTogether%40Hackabull25@gettogether.zlhzkty.mongodb.net/?appName=GetTogether";

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const GroupSchema = new mongoose.Schema({
    inviteCode: { type: String, required: true, unique: true },
    groupName: { type: String, required: true },
    members: [String], // Array of member names
});

const Group = mongoose.model('Group', GroupSchema);

// JWT Secret Key
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Sign Up endpoint
app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ username: newUser.username }, JWT_SECRET);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { username: newUser.username }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Sign In endpoint
app.post('/signin', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ username: user.username }, JWT_SECRET);

        res.json({
            message: 'Sign in successful',
            token,
            user: { username: user.username }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/', (req, res) => {
    console.log("req received");
    res.send('Hello World!');
});

// POST a JSON object and get it back
app.post('/demo-object', (request, response) => {

  const body = request.body;

  return body;
});

app.post('/create-group/:groupName/:creatorName', async (req, res) => {
    const { groupName, creatorName } = req.params;
    const inviteCode = uuidv4().slice(0, 6).toUpperCase();

    const newGroup = new Group({
        groupName,
        members: [creatorName],
        inviteCode
    });

    try {
        await newGroup.save();
        res.json({ inviteCode });
    } catch (error) {
        console.error('Error saving group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

app.post('/join-group', async (req, res) => {
    const { inviteCode, userName } = req.body;
  
    try {
      const group = await Group.findOne({ inviteCode });
  
      if (!group) {
        return res.status(404).json({ error: 'Invalid invite code' });
      }
  
      group.members.push(userName);
      await group.save();
  
      res.json({ success: true, group });
    } catch (error) {
      console.error('Error joining group:', error);
      res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET with the id and get it back
app.get('/demo-object/:id', (request, response) => {
  
  const params = request.params;

  response.json(params);
});

// GET with query in the URI and get it back
app.get('/demo-object', (request, response) => {
  
  const params = request.query;

  response.json(query);
});

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${3000}`);

// New endpoint to find nearby places
app.get('/api/nearby-places', async (req, res) => {
    try {
        const { lat = 37.7749, lng = -122.4194, radius = 1500 } = req.query;
        const apiKey = 'AIzaSyBkP7i-whASB7_Db9q8E9zSsNqCl2wpdYI';
        
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
                location: `${lat},${lng}`,
                radius: radius,
                type: 'establishment',
                key: apiKey
            }
        });

        // Process the response to include only relevant information
        const places = response.data.results.map(place => ({
            name: place.name,
            address: place.vicinity,
            location: place.geometry.location,
            rating: place.rating,
            types: place.types,
            place_id: place.place_id
        }));

        res.json({
            status: 'success',
            results: places
        });
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch nearby places'
        });
    }
});



app.listen(8080, () => {
    console.log(`Server is running on http://localhost:${8080}`);
  });
  