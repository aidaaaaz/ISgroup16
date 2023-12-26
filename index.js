const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb'); // Import ObjectId
const port = 4000;

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger set up
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hostel Visitor Management API',
      version: '1.0.0',
      description: 'This is a simple CRUD API application made with Express and documented with Swagger',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        jwt:{
					type: 'http',
					scheme: 'bearer',
					in: "header",
					bearerFormat: 'JWT'
        },
      },
    },
		security:[{
			"jwt": []
  }]
},
  apis: ['./index.js'], // path to your API routes

};



const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


//middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length); // "Bearer " is 7 characters
    //... (rest of your verification logic)
  } else {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer TOKEN_STRING"
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ error: 'Failed to authenticate token' });
  }

  next();
};


// Secret key for JWT signing and encryption
const secret = 'your-secret-key'; // Store this securely

app.use(bodyParser.json());


const uri = "mongodb://FifeeZaheed:keima@ac-86lqujp-shard-00-00.cbn8onp.mongodb.net:27017,ac-86lqujp-shard-00-01.cbn8onp.mongodb.net:27017,ac-86lqujp-shard-00-02.cbn8onp.mongodb.net:27017/?replicaSet=atlas-ir7cjs-shard-0&ssl=true&authSource=admin";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("HOSTELVISITORMANAGEMENT").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
let db;
let Visitorregistration;
let adminuser;



// Connect to MongoDB and initialize collections
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db('HOSTELVISITORMANAGEMENT');
    

  // Initialize collections after establishing the connection
  Visitorregistration = db.collection('visitors');
  adminuser = db.collection('admins');


  // Now you can safely start your server here, after the DB connection is established
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});


// In-memory data storage (replace with a database in production)
const visitors = [];
const admins = [];

app.use(express.json());


/**
 * @swagger
 * /registeradmin:
 *   post:
 *     summary: Register a new admin account
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Admin already exists
 */


// Admin Register New Account
app.post('/registeradmin', async (req, res) => {
  const admins = db.collection('admins');
  const { username, password } = req.body;

  const existingAdmin = await admins.findOne({ username });
  if (existingAdmin) {
    return res.status(400).json({ error: 'Admin already exists' });
  }

  await admins.insertOne({ username, password });
  res.status(201).json({ message: 'Admin registered successfully' });
});


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin authenticated successfully
 *       401:
 *         description: Invalid username or password
 */


// Admin Login
app.post('/login', async (req, res) => {
  const admins = db.collection('admins');
  const { username, password } = req.body;

  const admin = await admins.findOne({ username, password });
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Create token if the admin was found
  const token = jwt.sign({ userId: admin._id }, secret, { expiresIn: '1h' });

  res.json({ message: 'Admin authenticated successfully', 
  accessToken: token });
});


/**
 * @swagger
 * /registervisitor:
 *   post:
 *     summary: Register a new visitor
 *     tags: [Visitor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Visitor'
 *     responses:
 *       201:
 *         description: Visitor registered successfully
 *       500:
 *         description: Error occurred while registering the visitor
 */


// Protected route for registering a visitor - token required
app.post('/registervisitor', verifyToken, async (req, res) => {
  try {
    const visitors = db.collection('visitors');
    const { username, password, Name, Age, Gender, Address, Zipcode, Relation } = req.body;

    await visitors.insertOne({ username, password, Name, Age, Gender, Address, Zipcode, Relation });
    res.status(201).json({ message: 'Visitor registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while registering the visitor' });
  }
});

/**
 * @swagger
 * /viewvisitor:
 *   get:
 *     summary: View all visitors
 *     tags: [Visitor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all visitors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Visitor'
 *       500:
 *         description: Error occurred while fetching visitors
 */


// Protected route for viewing visitors - token required
app.get('/viewvisitor', verifyToken, async (req, res) => {
  try {
    const visitors = db.collection('visitors');
    const results = await visitors.find().toArray();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching visitors' });
  }
});


/**
 * @swagger
 * /issuevisitorpass:
 *   post:
 *     summary: Issue a visitor pass
 *     tags: [Pass]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitorId
 *               - issuedBy
 *               - validUntil
 *             properties:
 *               visitorId:
 *                 type: string
 *               issuedBy:
 *                 type: string
 *               validUntil:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Visitor pass issued successfully
 *       500:
 *         description: Error occurred while issuing the pass
 */


// Admin issue visitor pass
// Admin Issue Visitor Pass
app.post('/issuevisitorpass', verifyToken, async (req, res) => {
  const { visitorId, issuedBy, validUntil } = req.body;

  try {
    const visitorPasses = db.collection('visitorpasses');

    const newPass = {
      visitorId,
      issuedBy,
      validUntil,
      issuedAt: new Date(),
    };

    await visitorPasses.insertOne(newPass);
    res.status(201).json({ message: 'Visitor pass issued successfully' });
  } catch (error) {
    console.error('Issue Pass Error:', error.message);
    res.status(500).json({ error: 'An error occurred while issuing the pass', details: error.message });
  }
});

/**
 * @swagger
 * /retrievepass/{visitorId}:
 *   get:
 *     summary: Retrieve a visitor pass
 *     tags: [Pass]
 *     parameters:
 *       - in: path
 *         name: visitorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The visitor ID
 *     responses:
 *       200:
 *         description: Visitor pass details
 *       404:
 *         description: No pass found for this visitor
 *       500:
 *         description: Error occurred while retrieving the pass
 */


//Visitor to Retrieve Their Pass
// Visitor Retrieve Pass
app.get('/retrievepass/:visitorId', async (req, res) => {
  const visitorId = req.params.visitorId;

  try {
    const visitorPasses = db.collection('visitorpasses');
    const pass = await visitorPasses.findOne({ visitorId });

    if (!pass) {
      return res.status(404).json({ error: 'No pass found for this visitor' });
    }

    res.json(pass);
  } catch (error) {
    console.error('Retrieve Pass Error:', error.message);
    res.status(500).json({ error: 'An error occurred while retrieving the pass', details: error.message });
  }
});


/**
 * @swagger
 * /updatevisitor/{visitorId}:
 *   patch:
 *     summary: Update visitor details
 *     tags: [Visitor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The visitor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VisitorUpdate'
 *     responses:
 *       200:
 *         description: Visitor updated successfully
 *       404:
 *         description: No visitor found with this ID
 *       500:
 *         description: Error occurred while updating the visitor
 */


//Update visitor
app.patch('/updatevisitor/:visitorId', verifyToken, async (req, res) => {
  const visitorId = req.params.visitorId;
  const updateData = req.body;

  try {
    const updatedVisitor = await db.collection('visitors').updateOne(
      { _id: new ObjectId(visitorId) }, // Use 'new' with ObjectId
      { $set: updateData }
    );

    if (updatedVisitor.matchedCount === 0) {
      return res.status(404).json({ message: 'No visitor found with this ID' });
    }

    res.json({ message: 'Visitor updated successfully', updatedVisitor });
  } catch (error) {
    console.error('Update error:', error); // Log the entire error object
    res.status(500).json({ error: 'An error occurred while updating the visitor', details: error.toString() });
  }
});

/**
 * @swagger
 * /deletevisitor/{visitorId}:
 *   delete:
 *     summary: Delete a visitor
 *     tags: [Visitor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The visitor ID
 *     responses:
 *       200:
 *         description: Visitor deleted successfully
 *       404:
 *         description: No visitor found with this ID
 *       500:
 *         description: Error occurred while deleting the visitor
 */


// Delete visitor
app.delete('/deletevisitor/:visitorId', verifyToken, async (req, res) => {
  const visitorId = req.params.visitorId;

  try {
    const deletionResult = await db.collection('visitors').deleteOne(
      { _id: new ObjectId(visitorId) } // Use 'new' with ObjectId
    );

    if (deletionResult.deletedCount === 0) {
      return res.status(404).json({ message: 'No visitor found with this ID' });
    }

    res.json({ message: 'Visitor deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error); // Log the entire error object
    res.status(500).json({ error: 'An error occurred while deleting the visitor', details: error.toString() });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Visitor:
 *       type: object
 *       required:
 *         - Name
 *         - Age
 *         - Gender
 *         - Address
 *         - Zipcode
 *         - Relation
 *       properties:
 *         Name:
 *           type: string
 *         Age:
 *           type: integer
 *         Gender:
 *           type: string
 *         Address:
 *           type: string
 *         Zipcode:
 *           type: string
 *         Relation:
 *           type: string
 *     VisitorUpdate:
 *       type: object
 *       properties:
 *         Name:
 *           type: string
 *         Age:
 *           type: integer
 *         Gender:
 *           type: string
 *         Address:
 *           type: string
 *         Zipcode:
 *           type: string
 *         Relation:
 *           type: string
 */

