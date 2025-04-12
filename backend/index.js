const express = require('express');
const mongoose = require('mongoose');
const app = express();
const { v4: uuidv4 } = require('uuid');
app.use(express.json()); // So Express know you're using JSON

const uri = "mongodb+srv://vatsalkpr:GetTogether%40Hackabull25@gettogether.zlhzkty.mongodb.net/?appName=GetTogether";

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('MongoDB connection error:', err));

const GroupSchema = new mongoose.Schema({
    inviteCode: { type: String, required: true, unique: true },
    groupName: { type: String, required: true },
    members: [String], // Array of member names
  });



const Group = mongoose.model('Group', GroupSchema);



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
    const { inviteCode, name } = req.body;
  
    try {
      const group = await Group.findOne({ inviteCode });
  
      if (!group) {
        return res.status(404).json({ error: 'Invalid invite code' });
      }
  
      group.members.push(name); // Add new member
      await group.save(); // Save updated document
  
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
  });
  