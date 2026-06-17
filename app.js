require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var ejsLayouts = require('express-ejs-layouts');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pengabdianRouter = require('./routes/pengabdian');
var undanganRouter = require('./routes/undangan');
const { notFoundHandler, errorHandler } = require('./middlewares/error');



var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.set('layout', false); // Matikan layout global — tiap view yang butuh layout set sendiri


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

app.use(session({
  key: 'pengabdian_session',
  secret: process.env.SESSION_SECRET || 'rahasia_session_pengabdian',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 hari
  }
}));

// ─── Global locals: inject user session dan req ke semua EJS views ───
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.userId;
  res.locals.req = req; // Agar views bisa baca req.query
  next();
});

// ─── Routes ───
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/pengabdian', pengabdianRouter);
app.use('/undangan', undanganRouter);


// ─── Error Handlers ───
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
