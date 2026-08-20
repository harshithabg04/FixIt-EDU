const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://akashdokala7_db_user:Akash1255@cluster0.cd2sl2g.mongodb.net/fixitDB?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI); // ✅ Use the constant directly
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
