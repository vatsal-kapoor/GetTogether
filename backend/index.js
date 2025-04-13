const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
app.use(express.json()); 


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
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    groups: [{ type: String }], // Array of group invite codes
    createdAt: { type: Date, default: Date.now }
});

// Remove any existing indexes first
mongoose.connection.on('connected', async () => {
    try {
        // Drop the old username index if it exists
        await mongoose.connection.db.collection('users').dropIndex('username_1').catch(() => {});
        
        // Create new indexes
        await User.createIndexes();
        console.log('Indexes created successfully');
    } catch (error) {
        console.error('Error setting up indexes:', error);
    }
});

const User = mongoose.model('User', UserSchema);

const GroupSchema = new mongoose.Schema({
    inviteCode: { type: String, required: true, unique: true },
    groupName: { type: String, required: true },
    members: [{ type: String, ref: 'User' }], // Array of member UIDs
    createdAt: { type: Date, default: Date.now }
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
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const uid = uuidv4();
        
        const newUser = new User({
            uid,
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();
        
        const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ 
            token,
            user: {
                uid: newUser.uid,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 11000) {
            // Handle duplicate key error
            if (error.keyPattern && error.keyPattern.email) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            if (error.keyPattern && error.keyPattern.uid) {
                return res.status(500).json({ error: 'Error creating user. Please try again.' });
            }
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Sign In endpoint
app.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token with uid
        const token = jwt.sign({ uid: user.uid }, JWT_SECRET);

        res.json({
            message: 'Sign in successful',
            token,
            user: { 
                uid: user.uid,
                name: user.name,
                email: user.email
            }
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

app.post('/create-group', authenticateToken, async (req, res) => {
    const { groupName } = req.body;
    const creatorUid = req.user.uid;
    const inviteCode = uuidv4().slice(0, 6).toUpperCase();

    try {
        const newGroup = new Group({
            groupName,
            members: [creatorUid],
            inviteCode
        });

        await newGroup.save();

        // Add the group to the creator's groups array
        const creator = await User.findOne({ uid: creatorUid });
        
        creator.groups.push(inviteCode);
        await creator.save();
        

        res.json({ 
            success: true, 
            group: {
                inviteCode: newGroup.inviteCode,
                groupName: newGroup.groupName,
                members: newGroup.members
            }
        });
    } catch (error) {
        console.error('Error saving group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

app.post('/join-group', authenticateToken, async (req, res) => {
    const { inviteCode } = req.body;
    const userUid = req.user.uid;
  
    try {
        const group = await Group.findOne({ inviteCode });
        const user = await User.findOne({ uid: userUid });
  
        if (!group) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        if (group.members.includes(userUid)) {
            return res.status(400).json({ error: 'You are already a member of this group' });
        }
  
        // Add user to group's members
        group.members.push(userUid);
        await group.save();

        // Add group to user's groups
        user.groups.push(inviteCode);
        await user.save();
  
        res.json({ 
            success: true, 
            group: {
                inviteCode: group.inviteCode,
                groupName: group.groupName,
                members: group.members
            }
        });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Add a new endpoint to get user's groups
app.get('/user-groups', authenticateToken, async (req, res) => {
    const userUid = req.user.uid;
    
    try {
        const user = await User.findOne({ uid: userUid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get all groups where the user is a member
        const groups = await Group.find({ inviteCode: { $in: user.groups } });
        
        res.json({
            success: true,
            groups: groups.map(group => ({
                inviteCode: group.inviteCode,
                groupName: group.groupName,
                members: group.members
            }))
        });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ error: 'Failed to fetch user groups' });
    }
});

// Add a new endpoint to get group details with member information
app.get('/group/:inviteCode', authenticateToken, async (req, res) => {
    const { inviteCode } = req.params;
    
    try {
        const group = await Group.findOne({ inviteCode });
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Get member details
        const members = await User.find({ uid: { $in: group.members } }, 'uid name email');
        
        res.json({
            success: true,
            group: {
                inviteCode: group.inviteCode,
                groupName: group.groupName,
                members: members.map(member => ({
                    uid: member.uid,
                    name: member.name,
                    email: member.email
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Failed to fetch group details' });
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

// Token verification endpoint
app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${3000}`);
  });
