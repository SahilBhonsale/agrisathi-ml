require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisathi')
  .then(() => {
    const email = process.argv[2];
    if (!email) {
      console.error('Please provide an email: node makeAdmin.js user@example.com');
      process.exit(1);
    }

    User.findOneAndUpdate(
      { email},
      { isAdmin: true },
      { new: true }
    )
    .then(user => {
      if (user) {
        console.log(`${user.email} is now admin`);
      } else {
        console.log('User not found');
      }
      process.exit();
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });