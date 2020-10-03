const express=require('express');
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose = require('mongoose');
const session = require('express-session')
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const _ = require("lodash");
const multer=require("multer");
const path=require("path");
const fs=require("fs");


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


app.get("/managertestemonialcreate",function(req,res){
  res.render("managertestemonialcreate");
});

const testemonialuploadSchema=new mongoose.Schema({
  Editor_name:String,
  Member_firstname:String,
  Member_Regn_No:String,
  Member_Year:String,
  Member_Branch:String,
  Member_Domain:String,
  Member_Phone_no:String,
  Member_Email:String,
  Image_name:String,
  contentType:String,
  path:String,
  Imagetestemonial:Buffer,
});

const testemonialupload=new mongoose.model("testemonials",testemonialuploadSchema);
const storagetestemonial=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'public/uploadstestemonial');
  },
  filename:function(req,file,cb){
    cb(null,file.fieldname + '-'+Date.now()+path.extname(file.originalname));
  }
})
    const uploadimg=multer({
      storage:storagetestemonial
    });
app.post("/uploadtestemonial",uploadimg.single("testemonialimg"),function(req,res){
  testemonialupload.findOne({Member_Regn_No:req.body.testemonialregn},function(err,deletefound){
    console.log(deletefound);
    if(deletefound!=null){
      console.log(req.file.path);
      fs.unlinkSync("public/uploadstestemonial/"+deletefound.Image_name);
      console.log("deleted photo");
      testemonialupload.deleteOne({Member_Regn_No:req.body.testemonialregn},function(err){
        if(err){
          console.log("image delete error");
        }
      });
    }
  });
  registerentry.findOne({ username:req.body.testemonialregn},function(err,found){

    if(err){
      console.log("error")
    }
    else{
      const img=fs.readFileSync(req.file.path);
const encode_image=img.toString("base64");
    const done=new testemonialupload({
  Editor_name:req.body.username,
  Member_firstname:found.First_Name+" "+found.Last_name,
  Member_Regn_No:found.username,
  Member_Year:found.Year,
  Member_Branch:found.Branch,
  Member_Domain:found.Domain,
  Member_Phone_no:found.Phone_No,
  Member_Email:found.E_mail,
  Image_name:req.file.filename,
    })
    done.save();
    res.send("successfully saved")

  }
});
});

app.get("/show",function(req,res){
  testemonialupload.find({},function(err,found){
    if(err){
      console.log("bad")
    }
    else{
      res.render("gallary",{
        found:found 
      });
      
    }
    
  });
});


app.get("/updatemember",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Memmber"){
  res.render("updatemember",{
    user_name:req.user.First_Name,
      idfound:req.user
  })
}
});

///////////////////////////////////////////////////
app.get("/albumcreate",function(req,res){
  res.render("albumcreate");
});

const AlbumphotoSchema=new mongoose.Schema({
  Editor_name:String,
  Editor_Regn_no:String,
  Date:String,  
  Image_name:String,
  Approval:String,
});

const Albumphotoupload=new mongoose.model("albumphoto",AlbumphotoSchema);
const storagealbum=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'public/uploadsalbum');
  },
  filename:function(req,file,cb){
    cb(null,file.fieldname + '-'+Date.now()+path.extname(file.originalname));
  }
})
    const uploadalbumimg=multer({
      storage:storagealbum
    });
app.post("/uploadalbumimg",uploadalbumimg.single("albumimg"),function(req,res){
  const done=new Albumphotoupload({
  Editor_name:req.user.First_Name+" "+req.user.Last_name,
  Editor_Regn_no:req.user.username,
  Date:req.body.uploadimgalbumdate,  
  Image_name:req.file.filename,
  Approval:"Not-Approved",
});
  done.save();
  res.redirect("register",{
    messagereg:"Request Admin for Approval !"
  });
});

app.get("/show",function(req,res){
  testemonialupload.find({},function(err,found){
    if(err){
      console.log("bad")
    }
    else{
      res.render("gallary",{
        found:found 
      });
      
    }
    
  });
});


app.get("/df",function(req,res){
  
  res.render("imageapproval");

});
const send=require(__dirname+"/mail");

app.get("/snd",function(req,res){ 
var x=send("royankush399@gmail.com","You have sucessfully implemented this..!","Ankush");
console.log(x);
})


app.get("/s",function(req,res){
  res.render("mailsend",{
    messagereg:"success"
  })
})


  app.get("/b",function(req,res){
    blogrentry.find({Approval:"Approved"},function(err,found){
      if(err){
        console.log(err);
      }
      else{
        res.render("approvedblogs",{
          found:found
        });
      }
    });
  })


app.listen(3000,function(){
	console.log("Server Started at port 3000");
});


// <h1><%= found.Subject %> </h1>
// <h5> <%= found.Date %> </h5>
// <p> <%= found.Content %></p>