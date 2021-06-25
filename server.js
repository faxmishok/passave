const express = require('express');
const app = express();
const routeConf = require('./src/config/RouteConf');
const dbConf = require('./src/config/DBConf');
const errorHandler = require('./src/middleware/errorHandler');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { protect } = require('./src/middleware/protect');
const { PERMISSIONS } = require('./src/constants/permissions');
const jwt = require('jsonwebtoken');

// Set env variables
require('dotenv').config();

// Middleware to parse json body and url
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set cookie parser
app.use(cookieParser());

// Enable CORS Policy
app.use(cors());

// Start the server and set the port
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));

// Set all routes
routeConf(express, app);

//Serve public folder statically
app.use('/static', express.static(path.join(__dirname, 'public')));

// Set view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set views for routes
app.get('/', (req, res, next) => {
  if (req.cookies.token) {
    res.redirect('/dashboard');
  } else {
    res.render('index', { title: 'Passave | Password Manager' });
  }
});

app.get('/dashboard', protect(PERMISSIONS.ONLY_USERS), (req, res, next) => {
  res.render('dashboard', { title: 'Passave | Dashboard' });
});

app.get('/sign-in', (req, res, next) => {
  if (req.cookies.token) {
    res.redirect('/dashboard');
  } else {
    res.render('sign-in', { title: 'Passave | Sign In' });
  }
});

app.get('/sign-up', (req, res, next) => {
  if (req.cookies.token) {
    res.redirect('/dashboard');
  } else {
    res.render('sign-up', { title: 'Passave | Sign Up' });
  }
});

app.get('/faq', (req, res, next) => {
  res.render('faq', { title: 'Passave | F.A.Q' });
});

app.get('/terms', (req, res, next) => {
  res.render('terms', { title: 'Passave | Terms & Conditions' });
});

app.get('/forgot', (req, res, next) => {
  if (req.cookies.token) {
    res.redirect('/dashboard');
  } else {
    res.render('forgot', { title: 'Passave | Forgot Password?' });
  }
});

app.get('/404', (req, res, next) => {
  res.render('404', { title: 'Passave | 404 Error' });
});

app.get('*', (req, res, next) => {
  res.redirect('/404');
});

// Set custom error middleware
app.use(errorHandler);

//Handle unhandled promise errors
process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Error: ${err}`);
  process.exit(1);
});

// Establish database Connection
dbConf();
