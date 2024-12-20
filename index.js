// Importing required modules
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './mongooseConnect.js';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser'
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from o.env file
dotenv.config({ path: 'o.env' });

// Initialize the Express app
const app = express();

//connectDb function call
connectDB();

// Middleware
app.use(cors()); // Enable Cross-Origin Request Sharing (CORS)
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser());//To access the cookies






// Define the path to the 'uploads' folder
const __filename = fileURLToPath(import.meta.url); // Get the file name
const __dirname = path.dirname(__filename); // Get the directory name

// Ensure the uploads folder is in the correct location
const uploadPath = path.join(__dirname, 'uploads');

// Serve files from the 'uploads' directory as static files
app.use('/uploads', express.static(uploadPath));




// User Routes with a versioned API prefix
import Userrouter from './Routes/userRoute.js';
app.use('/api/v1',Userrouter ); // Prefix all auth routes with /api/v1/auth


//Product Routes with a versioned API prefix
import ProductRoute from './Routes/productRoute.js';
app.use('/api/v1', ProductRoute);


//Discount Routes with a versioned API prefix
import Disroute from './Routes/discountRoute.js';
app.use('/api/v1', Disroute);





//to write mistake in json form
import errorHandler from './Middleware/errorhandler.js';
app.use(errorHandler);



// Define a route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Set the port
const PORT = process.env.PORT || 5000; // Default to port 5000 if not defined in o.env

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
