require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var authRouter = require('./routes/auth');
var uploadRouter = require('./routes/upload');
var JiraRouter = require('./routes/Integrations/jira');
const session = require('express-session');

var app = express();
var port = process.env.PORT || 3000;

// ✅ IMPORTANT: Move session BEFORE CORS
app.use(cookieParser()); // Cookie parser should come before session

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key_here_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax' // ✅ ADDED: Important for cross-origin requests
  }
}));

// ✅ CORS should come after session
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:8080', 
    'http://localhost:3000', 
    'http://192.168.5.102:8080', 
    'http://192.168.5.102:3000', 
    'http://192.168.5.105:8080'
  ],
  credentials: true // This allows cookies to be sent
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/integrations', JiraRouter);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MedTest AI Backend is running',
    endpoints: [
      '/auth/check', 
      '/auth/login', 
      '/auth/signup', 
      '/auth/google-login', 
      '/auth/google-signup',
      '/integrations/jira',
      '/integrations/jira/callback'
    ]
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error('Error occurred:', {
    message: err.message,
    status: err.status,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    path: req.url,
    ...(req.app.get('env') === 'development' && { stack: err.stack })
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;