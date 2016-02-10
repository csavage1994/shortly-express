var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var session = require('express-session');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'secret_string',
  resave: false,
  saveUninitialized: false
}));

app.get('/', function(req, res) {
  //if current session
  if(!req.session.loggedIn){
    res.render('login');
  } else{
    res.render('index');
  }
  
  //else
    //redirect to login
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.get('/create',
  function(req, res){
    if(req.session.loggedIn){
      res.render('create');
    }else{
      res.redirect('/login')
    //console.log(req.body);
    }
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
/*app.post('/create', function(req, res){
  console.log('hello');
});*/

// app.post('/login', function(req, res){  

  /*redirect('index');
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });*/
  //encrypt password
  //check info against database
  //if match
    //set session login to true
    //redirect to index
  //else
    //print login error
// });
app.post('/signup', function(req, res){
  var credentials = req.body;
  if( !credentials.password || !credentials.username ){
    //return res.end();    
  }else{
    new User({ username: credentials.username }).fetch().then(function(found) {
        if(found){
          //login user
          console.log('Account already exists');
          res.render('login');
        }else{
          //create new user
          
          // newUser.password = newUser.encryptPassword(credentials.password);
          bcrypt.hash(credentials.password, req.session.secret, null, function(err, hash){
            var newUser = new User({
              username: credentials.username,
              password: hash      
            });
            newUser.save().then(function(err, newUser){
              Users.add(newUser);
              res.send(200, newUser);
            });
            util.createSession(req, res, newUser);
            req.session.loggedIn = true;
            res.render('index');
          })
          //add user to db
          //login user
        }

      //set up listener?
    
      });
  }
});

app.post('/login', function(req, res){
  var credentials = req.body;
  console.log('here');
  if( !credentials.password || !credentials.username ){
    //return res.end();    
  }
  new User({ username: credentials.username }).fetch().then(function(found) {
    if(!found){

      console.log('Account does not exist');
      res.render('login');
    } else{
      console.log(found.get('password'));
      res.send(200, found);
      // bcrypt.compare(credentials.password,  ,function(err, result){
      //   util.createSession(req, res, newUser);
      //   req.session.loggedIn = true;
      //   res.render('index');
      // })
    }  
  });

});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
