//模块依赖
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
var mysql = require('mysql');
var settings = require('./settings');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var flash = require('connect-flash');
var moment = require('moment');
var RateLimit = require('express-rate-limit');

var connection = mysql.createConnection({
  host: settings.host,
  port: settings.port,
  user: settings.user,
  password: settings.password,
  database: settings.db
});
var sessionStore = new MySQLStore({}/* session store options */, connection);

var app = express();

//ejs渲染moment
app.locals.moment = moment; 

// view engine setup
//设置端口号
app.set('port', process.env.PORT || 3000);

//视图模板引擎设置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());

//加载环境变量
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//注意：放在路由之前
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,
  cookie: {
    maxAge: 6 * 60 * 60 * 1000
  },
  store: sessionStore,
  rolling: true,
  resave: false,
  saveUninitialized: false
}));

app.use(function (req, res, next) {
  // console.log('1111111111111 path', req.path);
  next();
});

app.enable('trust proxy');

var limiter = new RateLimit({
  windowMs: 1*60*1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});
//  apply to all requests
app.use(limiter);

//加载路由
indexRouter(app);
// app.use('/', indexRouter);
// app.use('/users', usersRouter);

//启动及端口
app.listen(app.get('post'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

//加载错误处理解决办法
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//导出app对象
module.exports = app;
