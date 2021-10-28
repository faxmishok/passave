const mongoose = require('mongoose');

const dbConf = async () => {
  await mongoose
    .connect(process.env.MONGO_LOCAL_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then(() => console.log(`MongoDB connected: ${mongoose.connection.host}`))
    .catch((err) => {
      console.log(`MongoDB connection failed: ${err}`);
      process.exit(1);
    });
};

module.exports = dbConf;
