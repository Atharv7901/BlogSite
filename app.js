var bodyParser = require("body-parser");
var express = require("express");
var methodOverride = require("method-override");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models/user");
var app = express();


const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/restful_blog_app",{
  useNewUrlParser:true,
  useUnifiedTopology:true
})
.then(() => console.log("Connected to db!!"))
.catch(error => console.log(error.message));

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	next();
});

//PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret:"BLOG PAGE",
  resave:false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//MONGOOOSE SCHEMA
var blogSchema = new mongoose.Schema({
  title:String,
  image:String,
  body:String,
  created:{type:Date,default:Date.now}
});
var Blog = mongoose.model("Blog",blogSchema);
//home page
app.get("/",function(req,res){
  res.redirect("/home");
});
app.get("/blogs", isLoggedIn ,function(req,res){
  Blog.find({},function(err,blogs){
    if(err){
      console.log(err);
    }else{
      res.render("index",{blogs:blogs,user: req.user});
    }
  });
});
app.get("/home",function(req,res){
  res.render("home");
});

//new blog when need to be added
app.get("/blogs/new", isLoggedIn ,function(req,res){
  res.render("new",{user: req.user});
});
// create new blog
app.post("/blogs",function(req,res){
  Blog.create(req.body.blog,function(err, newBlog){
    if(err){
      res.render("new",{user: req.user});
    }else{
      res.redirect("/blogs");
    }
  });
});
//show page
app.get("/blogs/:id",function(req,res){
  Blog.findById(req.params.id,function(err, foundBlog){
    if(err){
      res.redirect("/blogs",{user: req.user});
    }else{
      res.render("show",{blog:foundBlog, user: req.user});
    }
  });
});
//edit page
app.get("/blogs/:id/edit",function(req,res){
  Blog.findById(req.params.id,function(err, foundBlog){
    if(err){
      res.redirect("/blogs");
    }else{
      res.render("edit",{blog:foundBlog, user: req.user});
    }
  });
});
//update page
app.put("/blogs/:id",function(req,res){
  Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err, updatedBlog){
    if(err){
      res.redirect("/blogs");
    }else{
      res.redirect("/blogs/"+req.params.id);
    }
  });
});
//delete page
app.delete("/blogs/:id", isLoggedIn ,function(req,res){
  Blog.findByIdAndRemove(req.params.id, function(err){
    if(err){
      res.redirect("/blogs");
    }else{
      res.redirect("/blogs");
    }
  });
});
//register page
app.get("/register",function(req,res){
  res.render("register");
});
app.post("/register",function(req,res){
  var newUser = new User({username:req.body.username});
  User.register(newUser, req.body.password, function(err,user){
    if(err){
      console.log(err);
      return res.render("register")
    }
      passport.authenticate("local")(req,res, function(){
        res.redirect("/blogs");
      });
  });
});
//Login page
app.get("/login",function(req,res){
  res.render("login");
});
app.post("/login",passport.authenticate("local",{
  successRedirect:"/blogs",
  failureRedirect:"/login"
}),function(req,res){});
//LOGOUT
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

//function to check if logged in or not
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

//port listen
app.listen(3000,function(){
  console.log("BLOG DERVER IS LIVE!!!");
});
