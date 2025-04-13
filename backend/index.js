const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getNearbyPlaces, getCentroid } = require('./suggestor');

const app = express();
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
    address: { type: String }, // Optional
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    groups: [{ type: String }],
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

// Group Schema
const GroupSchema = new mongoose.Schema({
    inviteCode: { type: String, required: true, unique: true },
    groupName: { type: String, required: true },
    admin: { type: String, required: true },
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
    const { name, email, password, address, lat, lng } = req.body;
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const uid = uuidv4();
  
      const newUser = new User({
        uid,
        name,
        email,
        password: hashedPassword,
        address,
        location: {
          lat,
          lng
        }
      });
  
      await newUser.save();
  
      const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: '24h' });
      res.json({
        token,
        user: {
          _id: newUser._id,
          uid: newUser.uid,
          name: newUser.name,
          email: newUser.email,
          address: newUser.address,
          location: newUser.location
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        if (error.keyPattern?.uid) {
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
                _id: user._id,
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
    const { groupName, createdBy} = req.body;

    
    const inviteCode = uuidv4().slice(0, 6).toUpperCase();

    try {
        const newGroup = new Group({
            groupName,
            admin: createdBy,
            members: [createdBy],
            inviteCode
        });

        await newGroup.save();

        // Add the group to the creator's groups array
        const creator = await User.findById(createdBy);
        
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
    const { inviteCode, _id} = req.body;
    
  
    try {
        const group = await Group.findOne({ inviteCode });
        const user = await User.findById(_id);
  
        if (!group) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        if (group.members.includes(_id)) {
            return res.status(400).json({ error: 'You are already a member of this group' });
        }
  
        // Add user to group's members
        group.members.push(_id);
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
                _id: group._id,
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

// Add a new endpoint to get group information by group ID
app.get('/group-by-id/:groupId', authenticateToken, async (req, res) => {
    const { groupId } = req.params;

    
    try {
        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Get member details
        const members = await User.find({ _id: { $in: group.members } }, 'uid name email');

        res.json({
            success: true,
            group: {
                _id: group._id,
                inviteCode: group.inviteCode,
                groupName: group.groupName,
                admin: group.admin,
                members: members.map(member => ({
                    _id: member._id,
                    name: member.name,
                    email: member.email
                })),
                createdAt: group.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching group by ID:', error);
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
app.post('/grouplocations',async(req,res)=>{
    const { groupId } = req.body;
    try {
        // 1. Find the group by its ID
        const group = await Group.findById(groupId);
        if (!group) {
          return res.status(404).json({ error: 'Group not found' });
        }
    
        // 2. Get all user locations based on group members
        const users = await User.find({ _id: { $in: group.members } }, 'location');
    
        // 3. Extract valid lat/lng coordinates
        const locations = users
          .filter(user => user.location && user.location.lat !== undefined && user.location.lng !== undefined)
          .map(user => ({
            lat: user.location.lat,
            lng: user.location.lng
          }));
    
        if (locations.length === 0) {
          return res.status(400).json({ error: 'No valid user locations found' });
        }
        res.json(locations);
    }catch{
        res.status(500).json({ error: 'Server error while fetching locations.' });
    }
})
app.post('/suggestions', async (req, res) => {
    const { groupId } = req.body;
    console.log(groupId);
  
    try {
      // 1. Find the group by its ID
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
  
      // 2. Get all user locations based on group members
      const users = await User.find({ _id: { $in: group.members } }, 'location');
  
      // 3. Extract valid lat/lng coordinates
      const locations = users
        .filter(user => user.location && user.location.lat !== undefined && user.location.lng !== undefined)
        .map(user => ({
          lat: user.location.lat,
          lng: user.location.lng
        }));
  
      if (locations.length === 0) {
        return res.status(400).json({ error: 'No valid user locations found' });
      }
  
      // 4. Calculate centroid
      const centroid = getCentroid(locations);
  
      // 5. Fetch nearby places
      const places = await getNearbyPlaces(centroid);
  
      res.json({ success: true, places, centroid });
    } catch (error) {
      console.error('Error in /suggestions:', error);
      res.status(500).json({ error: 'Server error while fetching suggestions' });
    }
  });



// Token verification endpoint
app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${3000}`);
});
