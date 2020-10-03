const nodemailer=require("nodemailer");
const express=require('express');

const ejs=require("ejs");
const app=express();
app.use(express.static("public"));
app.set("view engine","ejs");
var send=function(email,subject,message,name){
const mailTransporter=nodemailer.createTransport({
	service:'gmail',
	auth:{
		user:'aitcear@gmail.com',
		pass:"aitrobotics1234"
	}
});

ejs.renderFile(__dirname+"/views/mailsend.ejs", { messagereg:message,name:name }, function (err, data) {
if (err) {
    console.log(err);
} else {
const mailcontent={
	from:'aitcear@gmail.com',
	to:email,
	subject:subject,
	html:data,
	attachments:[{
		filename:"AIT-CEAR.jpg",
		path:__dirname+"/public/photos/AIT-CEAR.jpg",
		cid:"uniqueID@create.ee"
	}]
};
mailTransporter.sendMail(mailcontent,function(err,info){
	if(err){
		console.log(err);
	}
	else{
		return "successful";
	}
});
}
})
return "successful"
}
module.exports=send;

