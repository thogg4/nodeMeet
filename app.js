/**
 * Module dependencies.
 */
var express = require('express')
var passport = require('passport')
var localStrategy = require('passport-local').Strategy
var crypto = require("crypto")
var http = require("http")

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard mouse' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
  app.use(express.logger());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});



//db stuff
var collections = ["users"]
var db = require("mongojs").connect("nodemeet", collections)




// authentication
db.authorize = function (req, res, next) {

  // is there a user logged in?
  if (req.session && req.session.auth == true) {
    next()
    return
  }

  // do work
  db.users.find({
    username: req.param("username"),
    password: db.encodePassword(req.param('password'))
  }).limit(1).forEach(function(err, user) {
    if (user) {
      req.session.auth = true
      req.session.username = user.username
      next()
    } else {

    }
  })

}

db.logout = function(req, res, next) {
  req.session.auth = false
  req.session.username = null
  next()
  return
}
db.encodePassword = function(password) {
  var hash = crypto.createHash('sha256')

  var salt = 'phyllostachys'

  hash.update(salt)
  hash.update(password)

  var remainingLength = 200 - salt.length - password.length

  if (remainingLength > 0) {
    for (var i = 0; i < remainingLength; i++) {
      hash.update('z')
    }
  }

  return(hash.digest('hex'))
}


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
});

app.configure('production', function(){
  app.use(express.errorHandler())
});



// routes
app.get("/", function(req, res) {
  console.log(req.flash)
  res.render("index", {
    request: req,
    response: res,
    locals: {
      flash: req.flash()
    }
  })
})


// user routes
app.get("/login", function(req, res) {
  res.render("users/login", {
    request: req,
    response: res
  })
})
app.post("/login", function(req, res) {
  try {
    db.authorize(req, res, function() {
      req.flash("success", "logged in")
      res.redirect("/account")
    })
  } catch(e) {
    console.log("The user was not logged in")
    console.log(e)
  }
})
app.get("/logout", function(req, res) {
  db.logout(req, res, function() {
    req.flash("success", "logged out")
    res.redirect("/")
  })
})

app.get("/signup", function(req, res) {
  res.render("users/signup", {
    request: req,
    response: res,
  })
})
app.post("/signup", function(req, res) {
  try {
    db.users.find({
      username: req.param("username")
    }, function(err, docs) {
      if (docs.length < 1) {
        
        db.users.save({
          username: req.param("username"),
          email: req.param("email"),
          password: db.encodePassword(req.param("password"))
      
        }, function(err, saved) {
          if ( err || !saved ) {
            req.flash("error", "User not saved, for some unknown reason")
            res.redirect("/")
          } else { 
            req.flash("success", "User saved")
            res.redirect("/") 
          }
        })
        
      } else {
        req.flash("error", "Username is in use")
        res.redirect("/signup")
      }
    })    
    
  } catch(e) {
    
  } 
  
})
app.get("/account", function(req, res) {
  db.users.find({"username": req.session.username}, function(err, user) {
    if (err) {
      return
    } else {
      
      options = {
        host: "api.meetup.com",
        path: "/2/events?key=6d45643a7e7a5636d2844e5d506871&sign=true&group_urlname=NodeMeet",
        method: "GET"
      }
      
      meetupCall = http.request(options, function(res) {
        res.on('data', function (chunk) {
          console.log('BODY: ' + chunk)
        })
      })
      meetupCall.on('error', function(e) {
        console.log('problem with request: ' + e.message)
      })
      meetupCall.end();
      
      res.render("users/account", {
        request: req,
        response: res,
        user: user[0],
        locals: {
          flash: req.flash()
        }
      })
    }
  })
})




// event routes
app.post("/new-event", function(req, res) {
  options = {
    host: "api.meetup.com",
    path: "/2/events?key=6d45643a7e7a5636d2844e5d506871",
    method: "POST"
  }
  
  console.log(options)
  console.log(req.body)
  // console.log(req.param(meridian))
  // console.log(req.param(something-then))
  // console.log(req.param(handicap))
  
  //TODO: create meetup group, and connect here
  
  res.send("worked")
  
})










app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env)
