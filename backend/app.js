var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var authRouter = require('./routes/auth');
var uploadRouter = require('./routes/upload');
const session = require('express-session');

var app = express();
var port = 3000;

// Add your frontend URL to CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000', 'http://192.168.5.102:8080', 'http://192.168.5.102:3000', 'http://192.168.5.105:8080'],
  credentials: true
}));

app.use(session({
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: false, // Changed to false for better security
  cookie: { 
    secure: false,
    httpOnly: true, // Added for security
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES - Mount at /api/auth to match your frontend calls
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MedTest AI Backend is running',
    endpoints: ['/auth/check', '/auth/login', '/auth/signup', '/auth/google-login', '/auth/google-signup']
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler - FIXED: Return JSON instead of trying to render
app.use(function(err, req, res, next) {
  console.error('Error occurred:', {
    message: err.message,
    status: err.status,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Return JSON error response instead of res.render()
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    path: req.url,
    ...(req.app.get('env') === 'development' && { stack: err.stack })
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📋 Auth routes available at http://localhost:${port}/auth/`);
});

module.exports = app;