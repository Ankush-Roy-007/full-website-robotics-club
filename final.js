require('dotenv').config()
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
const send=require(__dirname+"/mail");


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

mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true });


const blogSchema=new mongoose.Schema({
  Editor_Name:String,
  Editor_Regn:String,
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

const testemonialuploadSchema=new mongoose.Schema({
  Editor_name:String,
  Member_firstname:String,
  Member_Regn_No:String,
  Member_Year:String,
  Member_Branch:String,
  Member_Domain:String,
  Member_Phone_no:String,
  Member_Email:String,
  Member_Facebook:String,
  Member_Instagram:String,
  Image_name:String,
  contentType:String,
  path:String,
  Imagetestemonial:Buffer,
});

registerSchema.plugin(passportLocalMongoose);

const blogrentry=new mongoose.model("Blog_data",blogSchema);
const registerentry=new mongoose.model("Member_details",registerSchema);
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
    var x=send(req.user.E_mail,"Security","You have just logged in.!",req.user.First_Name);
    res.redirect("/add");
  }
  else if(req.isAuthenticated()&&req.user.Authorization=="Member"){
    var x=send(req.user.E_mail,"Security","You have just logged in.!",req.user.First_Name);
    res.redirect("/memberfirstpage");
  }
  else{
    res.render("/login");
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
              var x=send(req.body.E_mail,"Congratulations..!","Now you are a member of AIT-CEAR.Your Username is "+req.body.regnno+" and Password is "+req.body.pass,req.body.fname);
                registerentry.find({Authorization:"Admin"},function(err,everyone){
        if(err){
          console.log(err)
        }
        else{
          everyone.forEach(function(one){
            var x=send(one.E_mail,"New Member Added..!","A new member is added by "+req.user.First_Name+" ..!",one.First_Name);
          })
        }
      });
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
  Editor_Name:req.user.First_Name+" "+req.user.Last_name,
  Editor_Regn:req.user.username,
  Subject:req.body.blogsubject,
  Date:req.body.blogdate,
  Content:req.body.blogcontent,
  Approval:"Not-Approved",
  ApprovedBy:"none"
  });
  blogdone.save();
  registerentry.find({Authorization:"Admin"},function(err,everyone){
        if(err){
          console.log(err)
        }
        else{
          everyone.forEach(function(one){
            var x=send(one.E_mail,"New Blog Request..!","Blog approval is pending..!",one.First_Name);
          })
        }
      });
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
    Approval:"Approved",
    ApprovedBy:req.user.username
  },function(err){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
      registerentry.find({Authorization:"Admin"},function(err,everyone){
        if(err){
          console.log(err)
        }
        else{
          everyone.forEach(function(one){
            var x=send(one.E_mail,"New Blog Posted..!","This recent blog is approved by "+req.user.First_Name+" ..!",one.First_Name);
          })
        }
      });
      registerentry.find({},function(err,everyone){
        if(err){
          console.log(err)
        }
        else{
          everyone.forEach(function(one){
            var x=send(one.E_mail,"New Blog Posted..!","Please visit our site to read this new blog..!",one.First_Name);
          })
        }
      });
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
  blogrentry.deleteOne({_id:req.params.approveid},function(err,result){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
      console.log(result);
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
        var x=send(req.body.email,"Account Details Updated..!","Your account details has be updated..!",req.body.fname);       
     res.redirect("/all");
    }
  });
});

app.get("/delete/:memberid",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
     testemonialupload.findOne({Member_Regn_No:req.params.idfound},function(err,imgfound){
  if(err){
      console.log("User not Found")
    }
    else{tes
         fs.unlinkSync("public/uploadstestemonial/"+imgfound.Image_name);
    }   
    });  
  testemonialupload.deleteOne({Member_Regn_No:req.params.idfound},function(err){
  if(err){
      console.log("User not Found")
    }   
    })
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
        messagereg:"Old password Mismatch !"
      })
      }
      else{
      done.save();      
      var x=send(req.user.E_mail,"Password changed..!","You have changed you password.Your new password is "+req.body.pass,req.user.First_Name);
          
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


app.get("/managertestemonialcreate",function(req,res){
  if(req.isAuthenticated()){
    if(req.user.Authorization=="Admin"){
  res.render("managertestemonialcreate",{
    user_name:req.user.First_Name,
      memberuser:req.user
  });
}

else if(req.user.Authorization=="Member"){
  res.render("membertestemonialcreate",{
    user_name:req.user.First_Name,
      memberuser:req.user
  });
}
}

else{
  res.redirect("/login");
}
});

app.post("/uploadtestemonial",uploadimg.single("testemonialimg"),function(req,res){
  testemonialupload.findOne({Member_Regn_No:req.user.username},function(err,deletefound){
    if(deletefound!=null){
      fs.unlinkSync("public/uploadstestemonial/"+deletefound.Image_name);
      testemonialupload.deleteOne({Member_Regn_No:req.body.testemonialregn},function(err){
        if(err){
          console.log(err);
        }
      });
    }
  });
  registerentry.findOne({ username:req.user.username},function(err,found){

    if(err){
      console.log(err)
    }
    else{
      const img=fs.readFileSync(req.file.path);
const encode_image=img.toString("base64");
    const done=new testemonialupload({
  Member_firstname:found.First_Name+" "+found.Last_name,
  Member_Regn_No:found.username,
  Member_Year:found.Year,
  Member_Branch:found.Branch,
  Member_Domain:found.Domain,
  Member_Phone_no:found.Phone_No,
  Member_Email:found.E_mail,
  Member_Facebook:req.body.testemonialfacebook,
  Member_Instagram:req.body.testemonialinstagram,
  Image_name:req.file.filename,
    })
    done.save();
    var x=send(req.user.E_mail,"Profile photo updated..!","Your profile photo has been updated..!",req.user.First_Name);
    res.render("register",{
      messagereg:"Successfully Updated your profile photo !"
    })
  }
});
});

app.get("/testemonialteamclient",function(req,res){
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

app.post("/updatememberaccount/:memberid",function(req,res){
  registerentry.updateOne({username:req.params.memberid},{
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
        var x=send(req.body.E_mail,"Account Updated..!","Your account details has been successfully updated..!",req.user.First_Name);
          
     res.render("register",{
      messagereg:"Successfully Updated !"
    });
  }
})
});

app.get("/albumcreate",function(req,res){ 
  if(req.isAuthenticated()){
    if(req.user.Authorization=="Admin")
  res.render("albumcreate",{
    user_name:req.user.First_Name,
      memberuser:req.user
  });
else if(req.user.Authorization=="Member")
  res.render("albumcreatemember",{
    user_name:req.user.First_Name,
      memberuser:req.user
  });
}
else{
  res.redirect("/login");
}
});

const AlbumphotoSchema=new mongoose.Schema({
  Editor_name:String,
  Editor_Regn_no:String,
  Date:String,  
  Image_name:String,
  Approval:String,
  Approvedby:String
});

const albumphotoupload=new mongoose.model("albumphoto",AlbumphotoSchema);
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
  const done=new albumphotoupload({
  Editor_name:req.user.First_Name+" "+req.user.Last_name,
  Editor_Regn_no:req.user.username,
  Date:req.body.uploadimgalbumdate,  
  Image_name:req.file.filename,
  Approval:"Not-Approved",
  Approvedby:"No-one"
});
  done.save();
  registerentry.find({Authorization:"Admin"},function(err,everyone){
        if(err){
          console.log(err)
        }
        else{
          everyone.forEach(function(one){
            var x=send(one.E_mail,"Photo Approval Request..!","Photo approval request is pending, please go and check it out..!",one.First_Name);
          })
        }
      });
  res.render("register",{
    messagereg:"Request Admin for Approval !"
  });
});

app.get("/imageapproval",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
   albumphotoupload.find({Approval:"Not-Approved"},function(err,found){
    if(err){
      console.log("Error found");
    }
    else if(found.length==0){
      res.render("register",{
        messagereg:"No Pending Approval"
      });
    }
    else{
      res.render("imageapproval",{
        found:found,
        user_name:req.user.First_Name,
        memberuser:req.user
      });      
    }    
  });
}
else{
  res.redirect("/login")
}
});

app.get("/albumapprovedone/:idfound",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  albumphotoupload.updateOne({_id:req.params.idfound},{
    Approval:"Approved",
    Approvedby:req.user.First_Name+" "+req.user.Last_name
  },function(err){
  if(err){
      console.log("User not Found")
    }
    else{
      registerentry.find({Authorization:"Admin"},function(err,everyone){
        if(err){
          console.log(err)
        }
        else{
          everyone.forEach(function(one){
            var x=send(one.E_mail,"New Photo..!","New photo approved by "+req.user.First_Name+" , please go and check it out..!",one.First_Name);
          })
        }
      });
      registerentry.find({},function(err,everyone){
        if(err){
          console.log(err)
        }
        else{
          everyone.forEach(function(one){
            var x=send(one.E_mail,"New Photo..!","New photo is posted in our album, please go and check it out..!",one.First_Name);
          })
        }
      });
      res.render("register",{
        messagereg:"Approved !"
      });      
    }   
    })
    }
    else{
  res.redirect("/login");
} 
  });

app.get("/albumapprovedecline/:idfound",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
   albumphotoupload.findOne({_id:req.params.idfound},function(err,imgfound){
  if(err){
      console.log("User not Found")
    }
    else{
         fs.unlinkSync("public/uploadsalbum/"+imgfound.Image_name);
    }   
    });  
  albumphotoupload.deleteOne({_id:req.params.idfound},function(err){
  if(err){
      console.log("User not Found")
    }
    else{      
      res.render("register",{
        messagereg:"Declined !"
      });      
    }   
    }) 
}
else{  
  res.redirect("/login");
}
  });

app.get("/albumclient",function(req,res){
  albumphotoupload.find({Approval:"Approved"},function(err,found){
    if(err){
      res.render("register",{
        messagereg:"Error 404 !"
      });
    }
    else{
      console.log(found);
      res.render("albumclient",{
        found:found 
      });
           
    }
  });
});


app.get("/blogviewadmin",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
    blogrentry.find({Approval:"Approved"},function(err,found){
      if(err){
        console.log(err);
      }
      else{
        res.render("approvedblogs",{
          found:found,
          user_name:req.user.First_Name
        });
      }
    });
  }
  else{
    res.redirect("/login");
  }
  })

<<<<<<< HEAD
app.get("/blogviewadmin/:approveid",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
  blogrentry.deleteOne({_id:req.params.approveid},function(err,result){
    if(err){
      res.render("register",{
      messagereg:"Error 404 !"
    });
    }
    else{
      console.log(result);
     res.render("register",{
      messagereg:"Successfully Deleted !"
    })
   }
  });
}
else{
  res.redirect("/login");
}
});


app.get("/albumphotosadmin",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
    albumphotoupload.find({Approval:"Approved"},function(err,found){
      if(err){
        console.log(err);
      }
      else{
        res.render("approvedimgadmin",{
          found:found,
          user_name:req.user.First_Name
        });
      }
    });
  }
  else{
    res.redirect("/login");
  }
  })

app.get("/albumphotodelete/:idfound",function(req,res){
  if(req.isAuthenticated()&&req.user.Authorization=="Admin"){
   albumphotoupload.findOne({_id:req.params.idfound},function(err,imgfound){
  if(err){
      console.log("User not Found")
    }
    else{
         fs.unlinkSync("public/uploadsalbum/"+imgfound.Image_name);
    }   
    });  
  albumphotoupload.deleteOne({_id:req.params.idfound},function(err){
  if(err){
      console.log("User not Found")
    }
    else{      
      res.render("register",{
        messagereg:"Deleted !"
      });      
    }   
    }) 
}
else{  
  res.redirect("/login");
}
  });
app.listen(process.env.PORT||3000,function(){
  console.log("Server Started at port 3000");
});