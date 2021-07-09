var express = require("express");
var app = express();
const port = 3000;
require('dotenv').config();

var path = require("path");
var session = require("express-session");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({
        secret : process.env.session_secret,
        resave : false,
        saveUninitialized : true,
        maxAge : 3600000,
    })
)

var login = require('./routes/login');
app.use("/", login);

var main = require('./routes/main');
app.use("/board", main);


app.listen(3000, function(){
    console.log("Web server start on post 3000");
})

// var port = 3000;
// app.listen(port, function(){
//     console.log("웹 서버 시작", port, moment().format('HH:mm:ss')); ->24시 표현
// });