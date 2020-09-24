function check(){
	var phone=$("#phn").val();
	var email=$("#email").val();
	var pass=$("#pass").val();
	var conpass=$("#conpass").val();
	var x=parseInt($("#phn").val());;
	var y=1,z=0;
	while(x!==0){
		x=Math.floor(x/10);
		if(x!==0){
			y=y+1;
		}
		else{
			break;
		}

	}
	if(isNaN(x)){
		$("#invalidity").css("display", "block")
		$("#invalidity").text("Incorrect Phone No.");
		return false;
	}
	if(phone===0||y!==10){
		$("#invalidity").css("display", "block")
		$("#invalidity").text("Incorrect Phone No.");
		return false;
	}
	else if(y===10&&(Math.floor(phone/Math.pow(10,9)))<6){
		$("#invalidity").css("display", "block")
		$("#invalidity").text("Incorrect Phone No.");
		return false;
	}
	else if((email.length-(email.indexOf('.')+1))!==3&&(email.length-(email.indexOf('.')+1))!==2)
	{
		$("#invalidity").css("display", "block")
		$("#invalidity").text("Incorrect E-mail");
		return false;
	}
	else if(email.indexOf('.')-email.indexOf('@')<=4){
		$("#invalidity").css("display", "block")
		$("#invalidity").text("Incorrect E-mail");
		return false;
	}
	else if(pass!==conpass){
		$("#invalidity").css("display", "block")
		$("#invalidity").text("Password Mismatch");
		return false
	}
	else{
		return true;
	}
	
}


function checkpass(){
	var pass=$("#pass").val();
	var conpass=$("#conpass").val();
	if(pass!==conpass){
		$("#invalidity").css("display", "block")
		$("#invalidity").text("Password Mismatch");
		return false
	}
	else{
		return true;
	}
	
}