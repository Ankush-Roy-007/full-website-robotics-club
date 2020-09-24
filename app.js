const express=require('express');
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose = require('mongoose');
const session = require('express-session')
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const _ = require("lodash");


const app=express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  secret: "Admin of this page is Ankush.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://AnKuSh-07:qwerasd1234@robotics-club.ux1dt.mongodb.net/Club?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });


const blogSchema=new mongoose.Schema({
  Editor:String,
  Subject:String,
  Date:String,
  Content:String
});

const registerSchema=new mongoose.Schema({
  Authorization:String,
  First_Name:String,
  Last_name:String,
  Registraton_No:String,
  Year:String,
  Branch:String,
  Phone_No:String,
  E_mail:String,
  Domain:String,
  Password:String
});

registerSchema.plugin(passportLocalMongoose);

const blogrentry=new mongoose.model("Blog_data",blogSchema);
const registerentry=new mongoose.model("Member_details",registerSchema);

mongoose.set('useCreateIndex', true);


passport.use(registerentry.createStrategy()); 
passport.serializeUser(registerentry.serializeUser());
passport.deserializeUser(registerentry.deserializeUser());


app.get("/",function(req,res){
  res.sendFile(__dirname+"/index.html");
});

app.get("/login",function(req,res){
  if(req.isAuthenticated()){
    res.redirect("add");
  }
  else{
  res.render("login");    
  }
});

app.get("/not-registered",function(req,res){
  res.render("not-registered");    
});

// app.post('/login',function(req,res){
//   const user =new registerentry({
//     username:req.body.username,
//     password:req.body.password
//   })
//   req.login(user, function(err) {
//   if (err) {console.log(err); }
//   else{
//     passport.authenticate('local', { successRedirect: '/add',
//                                     failureRedirect: '/not-registered' })
//   }
// });
// });


app.post('/login',
  passport.authenticate('local', { successRedirect: '/add',
                                   failureRedirect: '/not-registered' }));

  // loginentry.findOne({ Registraton_No:req.body.regn},function(err,found){
  //   if(found==null){
  //     res.render("not-registered");
  //   }
  //   else{
  //     if(found.Authorization==req.body.authorization){
  //       if(found.Password==req.body.password){
  //         passport.authenticate("local");
  //         res.redirect("/add")
  //       }
  //       else{
  //         res.render("not-registered");
  //       }
  //     }
  //     else{
  //      res.render("not-registered");
  //     }
  //   }
  // });
//});

app.post("/register",function(req,res){
  const done=new registerentry({
    Authorization:req.body.auth,
    First_Name:req.body.fname,
    Last_name:req.body.lname,
    username:req.body.regnno,
    Year:req.body.year,
    Branch:req.body.branch,
    Phone_No:req.body.phn,
    E_mail:req.body.email,
    Domain:req.body.domain
  }); 
         registerentry.register(done, req.body.pass, function(err, user) { 
            if (err) { 
              res.render("register",{
                messagereg:"Already-Registered"
              });
             }
             else{ 
               res.render("register",{
                messagereg:"Successfully Registered"
             });

            } 
          }); 
});

app.get("/add",function(req,res){
  if(req.isAuthenticated()){
    res.render("add",{user_name:req.user.First_Name});
  }
  else{
    res.render("login");
  }
 // res.render("add");
});

app.get("/blog",function(req,res){
 blogrentry.find({},function(err,data){
  if(err){console.log(err)}else{res.render("blog",{
    data:data,
  });}  
 });
});


app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/blog");
});

app.get("/createblog",function(req,res){
  if(req.isAuthenticated()){
    res.render("createblog",{user_name:req.user.First_Name});
  }
  else{
    res.redirect("/login");
  }
});

app.post("/createblog",function(req,res){
  const blogdone=new blogrentry({
  Editor:req.user.username,
  Subject:req.body.blogsubject,
  Date:req.body.blogdate,
  Content:req.body.blogcontent
  });
  blogdone.save();
  res.redirect("/createblog");
});

app.get("/blog/:find",function(req,res){  
    blogrentry.findOne({_id:req.params.find},function(err,found){
  if(err){
    console.log("good");
  }
  else{
  // console.log(found);
  res.render("single",{found:found});
}
});
});

app.get("/t",function(req,res){
  registerentry.find({},function(err,tabledata){
    if(err){
      console.log(err);
    }
    else{
     res.render("tableadm",{
        tabledata:tabledata
      });
    }
  });
});

app.get("/m",function(req,res){
  registerentry.find({},function(err,tabledata){
    if(err){
      console.log(err);
    }
    else{
     res.render("tablemem",{
        tabledata:tabledata
      });
    }
  });
});

app.get("/a",function(req,res){
  registerentry.find({},function(err,tabledata){
    if(err){
      console.log(err);
    }
    else{
     res.render("tableall",{
        tabledata:tabledata
      });
    }
  });
});

app.get("/update/:memberid",function(req,res){
  registerentry.findOne({username:req.params.memberid},function(err,idfound){
    if(err){
      console.log(err);
    }
    else{
     res.render("update",{
      idfound:idfound
     });
    }
  });
});

app.post("/updatedone/:memberid",function(req,res){
  registerentry.updateOne({username:req.params.memberid},{
    Authorization:req.body.auth,
    First_Name:req.body.fname,
    Last_name:req.body.lname,
    Year:req.body.year,
    Branch:req.body.branch,
    Phone_No:req.body.phn,
    E_mail:req.body.email,
    Domain:req.body.domain
  },function(err){
    if(err){
      console.log(err);
    }
    else{
     res.redirect("/t");
    }
  });
});

app.get("/delete/:memberid",function(req,res){
  registerentry.deleteOne({username:req.params.memberid},function(err){
    if(err){
      console.log(err);
    }
    else{
     res.redirect("/t");
    }
  });
});


app.listen(3000,function(){
	console.log("Server Started at port 3000");
});


// <h1><%= found.Subject %> </h1>
// <h5> <%= found.Date %> </h5>
// <p> <%= found.Content %></p>