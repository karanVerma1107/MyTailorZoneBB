import mongoose from 'mongoose';


const connectDB = async () => {
  try {
    // Fetch the MongoDB URI from environment variables
    const mongoURI = process.env.DB_URI;
    console.log("url of db is:", mongoURI);

    if (!mongoURI) {
      console.error('MongoDB URI is not defined in the environment variables.');
      process.exit(1); // Exit if no URI is found
    }

    // Connect to MongoDB using Mongoose
    await mongoose.connect(mongoURI);

    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process with failure code if the connection fails
  }
};

export default connectDB;
