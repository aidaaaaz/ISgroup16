const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb'); // Import ObjectId
//const port = 2000;

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const MongoURI = process.env.MONGODB_URI

const port = process.env.PORT || 2000 ; 

app.use(bodyParser.json());

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.1.0',
    info: {
      title: 'Apartment Visitor Management API',
      version: '1.0.0',
      description: 'API documentation for Apartment Visitor Management',
    },
    servers: [
      {
        url: `https://ishostel.azurewebsites.net/`, // Update the server URL
        description: 'Visitor Management',
      },
    ],
    components: {
      securitySchemes: {
        jwt: {
          type: 'http',
          scheme: 'bearer',
          in: 'header',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        jwt: [],
      },
    ],
  },
  apis: ['./index.js'], // Update this to match your actual route files
};


const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

///connect to Mondodb
//const { MongoClient, ServerApiVersion, Admin } = require('mongodb');
const uri = "mongodb+srv://aida:test123@cluster0.bx9feas.mongodb.net/";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer TOKEN_STRING"

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Failed to authenticate token' });
  }
};

// Middleware to log raw request body
app.use((req, res, next) => {
  let data = '';

  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    console.log('Raw Request Body:', data);
    next();
  });
});

// Secret key for JWT signing and encryption
const secret = 'your-secret-key'; // Store this securely

app.use(bodyParser.json());


async function run() {
    try {
      // Connect the client to the server (optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("ApartmentVisitorManagement").command({ ping: 1 });
      console.log("MongoDB is connected");
    } finally {
      // Ensures that the client will close when you finish/error
      // You should handle the closing of the client here
      // await client.close();
    }
  }
  
  //run().catch(console.dir);
  
run().catch(console.dir);

const db = client.db("ApartmentVisitorManagement");
const Visitorregistration = db.collection('Visitor');
const adminuser = db.collection('Admin');
const collectionsecurity = db.collection('Security');
const visitorPasses = db.collection('VisitorPass'); // Use the correct collection name

// Serve Swagger UI
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// In-memory data storage (replace with a database in production)
const visitor = [];
const admin = [];

app.use(express.json());

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Operations related to regular users
 *   - name: Admin
 *     description: Operations related to administrators
 *   - name: Visitor
 *     description: Operations related to visitors
 */

/**
 * @swagger
 * /registeradmin:
 *   post:
 *     summary: Register admin
 *     tags:
 *       - Admin
 *     requestBody:
 *       description: Admin information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       '200':
 *         description: Admins registered successfully
 *       '500':
 *         description: Internal Server Error
 */


// post to register admin
app.post('/registeradmin', (req, res) => {
  const admins = req.body;

  console.log('Received request to register admins:', admins);

  adminuser.insertOne(admins, (err, result) => {
      if (err) {
          console.error('Error inserting admins:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      console.log('Admins registered:', result.insertedIds);
      res.send('Admins registered successfully!');
  });
});

/**
 * @swagger
 * /loginadmin:
 *   post:
 *     summary: Admin login
 *     tags:
 *       - Admin
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
 *       '200':
 *         description: Admin authenticated successfully
 *       '401':
 *         description: Invalid username or password
 */


 // Route to login admin
 app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUser = await adminuser.findOne({ username, password }); // Rename variable
  if (adminUser) {
    console.log("Login Successful! Admin User:", adminUser);
    let token1 = generateToken1(adminUser);
    console.log("Token sent:", token1);
    res.send(token1);
  } else {
    console.log("Invalid username or password");
    res.send("Invalid username or password");
  }
});

/**
 * @swagger
 * /registervisitor:
 *   post:
 *     summary: Register a new visitor
 *     description: Register a visitor into MongoDB (requires admin authentication).
 *     tags:
 *       - Visitor
 *     security:
 *       - jwt: []  # Use the correct security scheme name if different
 *     requestBody:
 *       description: Visitor information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Name:
 *                 type: string
 *                 description: Visitor's name
 *               Phone_Number:
 *                 type: string
 *                 description: Visitor's phone number
 *               Address:
 *                 type: string
 *                 description: Visitor's address
 *               Floor_Wing:
 *                 type: string
 *                 description: Floor and wing information
 *               Whom_to_meet:
 *                 type: string
 *                 description: Person the visitor intends to meet
 *               Reason_to_meet:
 *                 type: string
 *                 description: Reason for the visit
 *     responses:
 *       '200':
 *         description: Visitor registered successfully
 *       '500':
 *         description: Internal Server Error
 */

 //to register a visitor into mongodb only admin
 app.post('/registervisitor', verifyToken1, (req, res) => {

  let visitor = {
    Name: req.body.Name,
    Phone_Number: req.body.Phone_Number,
    Address: req.body.Address,
    Floor_Wing: req.body.Floor_Wing,
    Whom_to_meet: req.body.Whom_to_meet,
    Reason_to_meet: req.body.Reason_to_meet
  }; 
 
  Visitorregistration.insertOne(visitor, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Internal Server Error');
    }
    else{
    console.log('Visitor registered:', result.insertedId);
    }
    

  });
  res.send('Visitor registered successfully!');
});

/**
 * @swagger
 * /viewvisitor:
 *   get:
 *     summary: Retrieve all visitor information
 *     description: Retrieve information about all visitors (requires admin authentication).
 *     tags:
 *       - Visitor
 *     security:
 *       - jwt: []  # Use the correct security scheme name if different
 *     responses:
 *       '200':
 *         description: Successfully retrieved visitor information
 *       '500':
 *         description: Internal Server Error
 */
app.get('/viewvisitor', verifyToken, (req, res) => {
  // Implementation details...
});


// Updated /viewvisitor endpoint
app.get('/viewvisitor', verifyToken, (req, res) => {
  Visitorregistration.find().toArray()
    .then(Visitor => {
      res.json(Visitor);
    })
    .catch(error => {
      console.error('Error retrieving visitor information:', error);
      res.status(500).send('An error occurred while retrieving visitor information');
    });
});


/**
 * @swagger
 * /issuevisitorpass:
 *   post:
 *     summary: Issue a visitor pass
 *     description: Issue a visitor pass and record the information in the VisitorPass collection (requires admin authentication).
 *     tags:
 *       - Visitor
 *     security:
 *       - jwt: []  # Use the correct security scheme name if different
 *     requestBody:
 *       description: Information required to issue a visitor pass
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitorId:
 *                 type: string
 *                 description: ID of the visitor for whom the pass is issued
 *               validUntil:
 *                 type: string
 *                 format: date
 *                 description: Date until which the pass is valid
 *     responses:
 *       '201':
 *         description: Visitor pass issued successfully
 *       '500':
 *         description: Internal Server Error
 */

// Admin issue visitor pass
app.post('/issuevisitorpass', verifyToken, async (req, res) => {
    const { visitorId, validUntil } = req.body;

    try {
        const db = client.db("ApartmentVisitorManagement");
        const visitorPasses = db.collection('VisitorPass'); // Use the correct collection name

        // Get user information from the token
        const { username } = req.user;
        
        console.log('Issued By:', username);

        const newPass = {
            visitorId,
            issuedBy: username, // Set issuedBy based on the user from the token
            validUntil,
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
 *     summary: Retrieve visitor pass information
 *     description: Retrieve information about a visitor's pass based on the visitor ID.
 *     tags:
 *       - Visitor
 *     parameters:
 *       - name: visitorId
 *         in: path
 *         required: true
 *         description: ID of the visitor for whom to retrieve the pass information
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved visitor pass information
 *       '404':
 *         description: No pass found for this visitor
 *       '500':
 *         description: Internal Server Error
 */

// Visitor Retrieve Their Pass
app.get('/retrievepass/:visitorId', async (req, res) => {
    const visitorId = req.params.visitorId;
  
    try {
      const db = client.db("ApartmentVisitorManagement");
      const visitorPasses = db.collection('VisitorPass'); // Use the correct collection name
  
      const pass = await visitorPasses.findOne({ visitorId }, { projection: { issuedAt: 0 } });
      // The projection: { issuedAt: 0 } excludes the issuedAt field from the response
  
      if (!pass) {
        return res.status(404).json({ error: 'No pass found for this visitor' });
      }
  
      res.json(pass);
    } catch (error) {
      console.error('Retrieve Pass Error:', error.message);
      res.status(500).json({ error: 'An error occurred while retrieving the pass', details: error.message });
    }
});



//function generate token1 for admin
function generateToken1(adminData)
{
  let token1 = jwt.sign
  (
    adminData,
    'admin',
    {expiresIn: '1h'}
  );
  return token1
}


//function verifytoken1 (admin)
function verifyToken1(req, res, next) {
   let header = req.headers.authorization;
 
   if (!header) {
     return res.status(401).send("Authorization header missing");
   }
 
   let token1 = header.split(' ')[1];
 
   jwt.verify(token1, 'admin', function (err, decoded) {
     if (err) {
       return res.status(403).send("Invalid Token");
     }
 
     req.user = decoded;
     next();
   });
 }



///////////
///////////////////
////////////////





 
  // app.listen(port, () => {
  //   console.log(`Example app listening on port ${port}`)
  // });

  app.put('/users/:id', verifyToken1, (req, res) => {
   const userId = req.params.id;
   const visitor = req.body;
 
   Visitorregistration.updateOne({ _id: new ObjectId(userId) }, { $set: visitor }, (err, result) => {
     if (err) {
       console.error('Error updating visitor:', err);
       res.status(500).send('Internal Server Error');
     } else {
       res.send('Visitor updated successfully');
     }
   });
 });
 
// Delete a visitor (admin only)
app.delete('/DeleteVisitor/:id', verifyToken1, (req, res) => {
  const userId = req.params.id;

  Visitorregistration
    .deleteOne({ _id: new ObjectId(userId) })
    .then(() => {
      res.send('Visitor data deleted successfully');
    })
    .catch((error) => {
      console.error('Error deleting visit detail:', error);
      res.status(500).send('An error occurred while deleting the visit detail');
    });
});


//database for mainadmin
adminuser
// Example data in the Admin collection
[
    {
      username: "aidazainuddin",
      password: "123456"
    }
  ]

//const port = 2000; // Declare the port here

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
