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

mongoose.connect("mongodb+srv://aitcear:aitrobotics@1234@robotics-club-website-d.wkwhk.mongodb.net/Club?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });


const blogSchema=new mongoose.Schema({
  Editor:String,
  Subject:String,
  Date:String,
  Content:String,
  Approval:String,
  ApprovedBy:String
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
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
    res.redirect("/add");
  }
  else if(req.isAuthenticated()&&req.user.Authorization=="Member"){
    res.redirect("/memberfirstpage");
  }
  else{
  res.render("login");    
  }
});

app.get("/not-registered",function(req,res){
  res.render("not-registered");    
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/check',
                                   failureRedirect: '/not-registered' }));

app.get("/check",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
    res.redirect("/add");
  }
  else if(req.isAuthenticated()&&req.user.Authorization=="Member"){
    res.redirect("/memberfirstpage");
  }
});

app.get("/memberfirstpage",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Member"){
    res.render("memberfirstpage",{
      user_name:req.user.First_Name,
      memberuser:req.user
    });
  }
  else{
    res.redirect("/login");
  }
});


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
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
    res.render("add",{user_name:req.user.First_Name});
  }
  else{
    res.redirect("/login");
  }
});

app.get("/blog",function(req,res){
 blogrentry.find({Approval:"Approved"},function(err,data){
  if(err){
    res.render("register",{
      messagereg:"Error 404 !"
    });
  }
  else if(data.length==0){
    res.render("register",{
      messagereg:"No blog posted !"
    });
  }
  else{res.render("blog",{
    data:data,
  });}  
 });
});


app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/createblog",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
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
  Content:req.body.blogcontent,
  Approval:"Not-Approved"
  });
  blogdone.save();
  res.render("register",{
    messagereg:"Request Admin for approval !"
  });
});

app.get("/approval",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  blogrentry.find({Approval:"Not-Approved"},function(err,data){
  if(err){
    res.render("register",{
      messagereg:"Error 404 !"
    });
  }
  else if(data.length==0){
    res.render("register",{
      messagereg:"No approval pending !"
    });
  }
  else{res.render("approval",{
    data:data,
    user_name:req.user.First_Name
  });}  
 });
}
else{
  res.redirect("/login");
}
});

app.get("/approveornot/:find",function(req,res){  
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
    blogrentry.findOne({_id:req.params.find},function(err,found){
  if(err){
    res.render("register",{
      messagereg:"Blog not found !"
    })
  }
  else{
  res.render("approvalsingle",{
    found:found,
    user_name:req.user.First_Name
  });
}
});
  }
  else{
    res.redirect("/login");
  }
});

app.get("/approvedone/:approveid",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  blogrentry.updateOne({_id:req.params.approveid},{
    Approval:"Approved"
  },function(err){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.redirect("/approval");
    }
  });
}
else{
  res.redirect("/login");
}
});

app.get("/approvedecline/:approveid",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  registerentry.deleteOne({username:req.params.approveid},function(err){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.render("register",{
      messagereg:"Declined !"
    })
   }
  });
}
else{
  res.redirect("/login");
}
});

app.get("/blog/:find",function(req,res){  
    blogrentry.findOne({_id:req.params.find},function(err,found){
  if(err){
    res.render("register",{
      messagereg:"Blog not found !"
    })
  }
  else{
  res.render("single",{found:found});
}
});
});

app.get("/admin",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  registerentry.find({},function(err,tabledata){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.render("tableadm",{
        tabledata:tabledata,
        user_name:req.user.First_Name
      });
    }
  });
}
else{
  res.redirect("/login");
}
});

app.get("/member",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  registerentry.find({},function(err,tabledata){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.render("tablemem",{
        tabledata:tabledata,
        user_name:req.user.First_Name
      });
    }
  });
}
else{
  res.redirect("/login")
}
});

app.get("/all",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  registerentry.find({},function(err,tabledata){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.render("tableall",{
        tabledata:tabledata,
        user_name:req.user.First_Name
      });
    }
  });
}
else{
  res.redirect("/login");
}
});

app.get("/update/:memberid",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  registerentry.findOne({username:req.params.memberid},function(err,idfound){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.render("update",{
      idfound:idfound,
      user_name:req.user.First_Name
     });
    }
  });
}
else{
  res.redirect("/login");
}
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
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.redirect("/all");
    }
  });
});

app.get("/delete/:memberid",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  registerentry.deleteOne({username:req.params.memberid},function(err){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     res.render("register",{
      messagereg:"Deleted Successfully !"
    })
   }
  });
}
else{
  res.redirect("/login");
}
});

app.get("/updatepasswordmember",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Member"){
    res.render("updatepasswordmember",{
      user_name:req.user.First_Name,
      memberuser:req.user
    });
}
 if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
    res.render("updatepasswordadmin",{
      user_name:req.user.First_Name,
      memberuser:req.user
    });
}
else{
  res.redirect("/login");
}
});

app.post("/updatepassword/:id",function(req,res){
  if(req.isAuthenticated()){
  registerentry.findOne({_id:req.params.id},function(err,tabledata){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
     tabledata.changePassword(req.body.oldpass, req.body.pass,function(err,done){
      if(err){
        res.render("register",{
        messagereg:"Error 404 !"
      })
      }
      else{
      done.save();
      if(req.user.Authorization=="Admin"){
         res.redirect("/add");
      }
     else if(req.user.Authorization=="Member"){
      res.redirect("/memberfirstpage");
     }
    }
     })
    }
  });
 }
else{
  res.redirect("/login");
}
});


app.listen(process.env.PORT||3000,function(){
  console.log("Server Started at port 3000");
});
