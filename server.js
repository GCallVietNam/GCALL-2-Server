const express=require('express');
const app=express();
const server=require('http').createServer(app);
const bodyParser=require('body-parser');
const cookieParser=require('cookie-parser');
const session=require('express-session');
const morgan=require('morgan');

// Utilities
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan(':method :url :response-time :date[web]'));

// Schedulers
require('./lib/scheduleCalculatingCalls');
require('./lib/scheduleCheckingHotline');

// Template
app.set('view engine','ejs');

// Static
app.use(express.static(__dirname+'/static'));

// Middlewares
require('./route/index')(app);
require('./route/token')(app);
require('./route/user')(app);
require('./route/calllog')(app);
require('./route/group')(app);
require('./route/controller')(app);

// Listening
app.listen(3000,function(){
	console.log('Gcall server listening...');
});