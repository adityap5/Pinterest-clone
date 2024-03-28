var express = require('express');
var router = express.Router();
var userModel = require('./users');
var postModel = require('./post');
const localStrategy = require('passport-local');
const upload = require('./multer');

const passport = require('passport');
passport.use(new localStrategy(userModel.authenticate()));


router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/profile', isLoggedin,async function(req, res, next) {
  const user = await userModel.findOne({
   username : req.session.passport.user
  })
  .populate('posts')
  console.log(user);
  res.render('profile',{user});
});
router.get('/login', function(req, res, next) {
res.render('login',{ error: req.flash('error')} );
});
router.get('/feed', function(req, res, next) {
  res.render('feed');
});
router.post('/register', function(req, res) {
  const{username , email , fullname } = req.body;
  const userdata = new userModel({username, email,fullname});
    
  console.log("done");
  userModel.register(userdata,req.body.password)
  .then(function() {
    passport.authenticate("local")(req, res,function(){
      res.redirect('/profile');
    })
  })
});

router.post('/login',passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true
}) ,function(res,req){});

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

router.post('/upload', isLoggedin,upload.single('file') , async function(req, res, next){
  if(!req.file){
    return res.status(404).send("No files were uploaded")
  }
  const user = await userModel.findOne({username:req.session.passport.user})
  const post = await postModel.create({
    image:req.file.filename,
    posttext:req.body.filecaption,
    user:user._id
  })
   
  user.posts.push(post._id)
  await user.save()
  res.redirect("/profile");
});

function isLoggedin(req,res,next){
if(req.isAuthenticated()){
  return next();}
  res.redirect('/login');
}


module.exports = router;
