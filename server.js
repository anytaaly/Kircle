const express = require('express');
const connectDB = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;

//Connect  Database
connectDB();

//Init Middleware
app.use(express.json({ extended: false }));

const customerMiddleware = (req, res, next) => {
  console.log('middleware executed!');
  next();
};
//Middleware is a function that runs before the requests get to our app
//we can use it in app request or use it on request by the below command
//app.use(customerMiddleware);
//Or by this command

app.get('/', (req, res) => {
  console.log('home page');
  res.send('Hello World');
});

// app.get('/home', customerMiddleware, (req, res) => {
//   console.log('home with customerMiddleware');
//   res.send('Hello World');
// });

//define Routes
app.use('/api/users', require('./routes/api/users'));
// app.use('/api/profile', require('./routes/api/profile'));
// app.use('/api/auth', require('./routes/api/auth'));
// app.use('/api/posts', require('./routes/api/posts'));

app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});
