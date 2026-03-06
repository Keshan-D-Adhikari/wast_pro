const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); // ✅ NEW

const app = express();

app.use(cors());
app.use(express.json());

/* MongoDB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log(err));

/* Routes */
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // ✅ NEW

app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});
