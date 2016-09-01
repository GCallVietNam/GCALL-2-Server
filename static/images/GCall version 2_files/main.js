$(document).ready(function(){
	var countryCode;
	var phone;
	var submitPhoneNumber;
	// console.log(window.location.pathname);
	var currentURL = window.location.pathname;
	if (typeof(Storage) == "undefined") {
		// Sorry! No Web Storage support..
	    // console.log('Sorry! No Web Storage support..');
	} else {
	    // Code for localStorage/sessionStorage.
	    // console.log('Web Storage is supported.');
	    sessionStorage.setItem("currentURL", currentURL);	    
	    var phone = localStorage.getItem("clientPhoneNumber");
	    // console.log(phone);
	    if(phone !== null) {
	    	console.log('Input phonenumber: ');
	    	console.log(phone);
	    	$('.current-phone-number').html(phone);
	    	// check openSubGroup
			if(currentURL.search('-') != -1) {
				$("#enter-phone").css("display","none");
				$("#select-team").css("display","block");
				$('.visible-sub-subgroup').css('display', 'block');
				$("#user-info").css("display","block");
			}
			else {
				$('.visible-sub-subgroup').css('display', 'none');
				$("#enter-phone").css("display","none");
				$("#select-team").css("display","block");
				$("#user-info").css("display","block");
			}
	    } 
	    else {
	    	$("#enter-phone").css("display","block");
	    	$('.visible-sub-subgroup').css('display', 'none');
			$("#select-team").css("display","none");
			$("#user-info").css("display","none");
	    } 
	}
		
	$("#page-loader").css("display","none");

	$('#small-logo').click(function(){
		location.reload();
	});
	$("#inputPhoneNum").keypress(function(event){
	    if(event.which == 13){
	    	event.preventDefault();
			console.log('Country code selected: ');
			console.log(countryCode);
			phone=$("#inputPhoneNum").val();
			submitPhoneNumber = countryCode + phone;
			console.log('Submit phone number: ');
			console.log(countryCode);
			if (typeof(Storage) !== "undefined") {
			    // Code for localStorage/sessionStorage.
			    console.log('Input phonenumber: ');
				console.log(submitPhoneNumber);
			    // console.log('Web Storage is supported.');
			    localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
			} else {
			    // Sorry! No Web Storage support..
			    // console.log('Sorry! No Web Storage support..');
			}
			$.ajax({
				// url:'//call.gcall.vn/send',
				url: '//localhost:3000/send',
				type:'POST',
				contentType:'application/json;charset=utf-8',
				data:JSON.stringify({phone:submitPhoneNumber}),
				dataType:'json',
				success:function(data){
					$("#enter-phone").css("display","none");
					$('.current-phone-number').html(submitPhoneNumber);
					$('#user-info').css('display', 'block');
					if (data.error){
						// console.log('Submit phonenumber error: ');
						// console.log(data.error);
						$("#invalid-enter-phone").css("display","block");
					} else{
						// console.log('Submit phonenumber data: ');
						// console.log(data);
						if (data.verified){
							$("#select-team").css("display","block");
						} else{
							$("#phonenumber").html(submitPhoneNumber);
							$("#verify").css("display","block");
						}
					}
				},
				error:function(error){
					// console.log('Submit phonenumber error: ');
					// console.log(error);
					$("#enter-phone").css("display","none");
					$("#invalid-enter-phone p").html('Invalid phone number');
					$("#invalid-enter-phone").css("display","block");
					localStorage.removeItem("clientPhoneNumber");
				}
			});
	    }
	});

	$("#submitPhoneNum").click(function(event){
		event.preventDefault();
		console.log('Country code selected: ');
		console.log(countryCode);
		phone=$("#inputPhoneNum").val();
		submitPhoneNumber = countryCode + phone;
		console.log('Submit phone number: ');
		console.log(countryCode);
		if (typeof(Storage) !== "undefined") {
		    // Code for localStorage/sessionStorage.
		    console.log('Input phonenumber: ');
			console.log(submitPhoneNumber);
		    // console.log('Web Storage is supported.');
		    localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
		} else {
		    // Sorry! No Web Storage support..
		    // console.log('Sorry! No Web Storage support..');
		}
		$.ajax({
			// url:'//call.gcall.vn/send',
			url: '//localhost:3000/send',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone:submitPhoneNumber}),
			dataType:'json',
			success:function(data){
				$("#enter-phone").css("display","none");
				$('.current-phone-number').html(submitPhoneNumber);
				$('#user-info').css('display', 'block');
				if (data.error){
					// console.log('Submit phonenumber error: ');
					// console.log(data.error);
					$("#invalid-enter-phone").css("display","block");
				} else{
					// console.log('Submit phonenumber data: ');
					// console.log(data);
					if (data.verified){
						$("#select-team").css("display","block");
					} else{
						$("#phonenumber").html(submitPhoneNumber);
						$("#verify").css("display","block");
					}
				}
			},
			error:function(error){
				// console.log('Submit phonenumber error: ');
				// console.log(error);
				$("#enter-phone").css("display","none");
				$("#invalid-enter-phone p").html('Invalid phone number');
				$("#invalid-enter-phone").css("display","block");
				localStorage.removeItem("clientPhoneNumber");
			}
		});
	});

	$("#resendCode").click(function(){
		event.preventDefault();
		console.log('Country code selected: ');
		console.log(countryCode);
		phone=$("#inputPhoneNum").val();
		submitPhoneNumber = countryCode + phone;
		console.log('Submit phone number: ');
		console.log(countryCode);
		if (typeof(Storage) !== "undefined") {
		    // Code for localStorage/sessionStorage.
		    console.log('Input phonenumber: ');
			console.log(submitPhoneNumber);
		    // console.log('Web Storage is supported.');
		    localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
		} else {
		    // Sorry! No Web Storage support..
		    // console.log('Sorry! No Web Storage support..');
		}
		$.ajax({
			// url:'//call.gcall.vn/send',
			url: '//localhost:3000/send',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone:submitPhoneNumber}),
			dataType:'json',
			success:function(data){
				$("#enter-phone").css("display","none");
				$('.current-phone-number').html(submitPhoneNumber);
				$('#user-info').css('display', 'block');
				if (data.error){
					// console.log('Submit phonenumber error: ');
					// console.log(data.error);
					$("#invalid-enter-phone").css("display","block");
				} else{
					// console.log('Submit phonenumber data: ');
					// console.log(data);
					if (data.verified){
						$("#select-team").css("display","block");
					} else{
						$("#phonenumber").html(submitPhoneNumber);
						$("#verify").css("display","block");
					}
				}
			},
			error:function(error){
				// console.log('Submit phonenumber error: ');
				// console.log(error);
				$("#enter-phone").css("display","none");
				$("#invalid-enter-phone p").html('Invalid phone number');
				$("#invalid-enter-phone").css("display","block");
				localStorage.removeItem("clientPhoneNumber");
			}
		});
	});

	$("#submitCode").click(function(){
		var code=$(this).parent().find('input:text').val();
		$.ajax({
			// url: '//call.gcall.vn/verify',
			url: '//localhost:3000/verify',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone:submitPhoneNumber,code:code}),
			dataType:'json',
			success:function(data){
				$("#verify").css("display","none");
				if (data.error){
					// console.log('Submit code error: ');
					// console.log(data.error);
				} else{
					$("#select-team").css("display","block");
				}
			},
			error:function(error){
				// console.log('Submit code error: ');
				// console.log(error);
			}
		});
	});

	$(".select-country-code .dropdown .dropdown-menu li").click(function(){
		var countryName = $(this).find(".country").text();
		console.log("From select country name:");
		console.log(countryName);
		$(".country-name-view").html(countryName);
		var flagName = "/images/countryFlags/"+ countryName + ".png";
		var backgroundImgURL = "url(" + flagName +")";
		$(".select-country-code .country-code-content").css('background-image', backgroundImgURL);
		countryCode = $(this).find(".code").text();
		console.log("From select country code:");
		console.log(countryCode);
	});
});

function makeCall(extension){
	var hotline = window.location.pathname;
	// console.log('Make call hotline: ');
	// console.log(hotline);
	if (typeof(Storage) !== "undefined") {
	    // Code for localStorage/sessionStorage.
	    // console.log('Web Storage is supported.');
	    console.log('Call phonenumber: ');
	    var phone = localStorage.getItem("clientPhoneNumber");
	    console.log(phone);
	} else {
	    // Sorry! No Web Storage support..
	    // console.log('Sorry! No Web Storage support..');
	}

	$.ajax({
		// url: '//call.gcall.vn' + hotline + '-' + extension + '/call',
		url: '//localhost:3000' + hotline + '-' + extension + '/call',
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			$("#select-team").css("display","none");
			$("#calling").css("display","block");
			$(".call-status").css('display', 'block');
			$(".call-status").html('Calling ... ');
			$(".agent-name").html(data.agents[0].fullname);
			$(".agent-phone-number").html(data.agents[0].phone);
			var token = data.token;
			console.log("Token: ");
			console.log(token);
			var accountSid = data.accountSid;
			console.log("AccountSid: ");
			console.log(accountSid);
			var authToken = data.authToken;
			console.log("AuthToken: ");
			console.log(authToken);
			var groupIdTmp = hotline + '-' + extension;
			var groupId = groupIdTmp.split("/")[1];
			console.log("GroupId: ");
			console.log(groupId);
			
			Twilio.Device.setup(token);

			Twilio.Device.ready(function (device) {
		        // console.log('Make call Twilio device: device ready');
		    });

			Twilio.Device.connect(function(conn){
	    		// console.log('Make call Twilio connect: ');
	    		// console.log(conn._status);
	    	});

	    	Twilio.Device.disconnect(function(conn){
	    		// console.log('Make call Twilio disconnect: ');
	    		// console.log(conn._status);
	    		$(".call-status").html('Call end');
	    		setTimeout(function(){
	    			hangup();
	    		}, 1000);
	    	});

	    	Twilio.Device.cancel(function(conn){
	    		// console.log('Make call Twilio cancel: ');
	    		// console.log(conn.status);
	    	});

		    Twilio.Device.error(function (error) {
		    	hangup();
		    	// console.log('Make call Twilio error: ');
		    	// console.log(error.message);
		    });

		    Twilio.Device.offline(function() {
		    	hangup();
		    	// console.log('Make call Twilio offline: network connection lost');
		        // Called on network connection lost.
		    });
		    // console.log('Make call callerID: ');
		    // console.log(phone);
		    setTimeout(function(){
		    	var conn = Twilio.Device.connect({
		            agents: data.agents.map(function(agent){
		            	return agent.phone;
		            }).join(),
		            callerId: phone,
		   //          Token: token,
					// AccountSid: accountSid,
					// AuthToken: authToken,
					// GroupId: groupId
		        });
		    	$('#mute').click(function(){
		        	if($(this).hasClass('deactive-mute')) {       		
		        		$(this).removeClass('deactive-mute');
		        		$(this).addClass('active-mute');
		        	}
		        	else if($(this).hasClass('active-mute')) {	        		
		        		$(this).removeClass('active-mute');
		        		$(this).addClass('deactive-mute');
		        	}
		        	if($(this).hasClass('deactive-mute')) {	
		        		conn.mute(false);	        		
		        		console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
		        	}
		        	else if($(this).hasClass('active-mute')) {	
		        		conn.mute(true);	        		
		        		console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
		        	}
		        });
		        $('#mute-speaker').click(function(){
		        	if($(this).hasClass('deactive-mute-speaker')) {	     		
						$(this).removeClass('deactive-mute-speaker');
						$(this).addClass('active-mute-speaker');
					}
					else if($(this).hasClass('active-mute-speaker')) {		        		
						$(this).removeClass('active-mute-speaker');
						$(this).addClass('deactive-mute-speaker');
					}
					// if($(this).hasClass('deactive-mute')) {	
		        		
		   //      	}
		   //      	else if($(this).hasClass('active-mute')) {	
		        		
		   //      	}
		        });
		    }, 3000);
		},
		error: function(error) {
			$("#select-team").css("display","none");
			$("#calling").css("display","none");
			$("#invalid-enter-phone p").html('No agent here');
			$("#invalid-enter-phone").css("display","block");
			setTimeout(function(){
    			hangup();
    			$("#invalid-enter-phone").css("display","none");
    		}, 3000);
			// console.log('Make call error: ');
			// console.log(error);
		}
	});
}

function openSubGroup(extension){
	var phone=$("#submitPhoneNum").parent().find('input:text').val();
	var hotline = window.location.pathname;
	var redirectURL = '//localhost:3000' + hotline + '-' + extension;
	// var redirectURL = '//call.gcall.vn' + hotline + '-' + extension;
	window.location.replace(redirectURL);
}

function backToPrevGroup() {
	var currentURL = window.location.pathname;
	var parentURL = currentURL.split("-")[0];
	console.log(parentURL);
	var redirectURL = '//localhost:3000' + parentURL;
	// var redirectURL = '//call.gcall.vn' + parentURL;
	window.location.replace(redirectURL);
}

function makeCallNow(){
	var hotline = window.location.pathname;
	// console.log('Make call hotline: ');
	// console.log(hotline);
	if (typeof(Storage) !== "undefined") {
	    // Code for localStorage/sessionStorage.
	    // console.log('Web Storage is supported.');
	    console.log('Call phonenumber: ');
	    var phone = localStorage.getItem("clientPhoneNumber");
	    console.log(phone);
	} else {
	    // Sorry! No Web Storage support..
	    // console.log('Sorry! No Web Storage support..');
	}
	$.ajax({
		// url: '//call.gcall.vn' + hotline + '/call',
		url: '//localhost:3000' + hotline + '/call',
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			// console.log('Make call data: ');
			// console.log(data);
			$("#select-team").css("display","none");
			$("#calling").css("display","block");
			$(".call-status").css('display', 'block');
			$(".call-status").html('Calling ... ');
			$(".agent-name").html(data.agents[0].fullname);
			$(".agent-phone-number").html(data.agents[0].phone);
			var token = data.token;
			console.log("Token: ");
			console.log(token);
			var accountSid = data.accountSid;
			console.log("AccountSid: ");
			console.log(accountSid);
			var authToken = data.authToken;
			console.log("AuthToken: ");
			console.log(authToken);
			var groupId = hotline.split("/")[1];
			console.log("GroupId: ");
			console.log(groupId);
			Twilio.Device.setup(token);

			Twilio.Device.ready(function (device) {
		        // console.log('Make call Twilio device: device ready');
		    });

			Twilio.Device.connect(function(conn){
	    		// console.log('Make call Twilio connect: ');
	    		// console.log(conn._status);
	    	});

	    	Twilio.Device.disconnect(function(conn){
	    		// console.log('Make call Twilio disconnect: ');
	    		// console.log(conn._status);
	    		$(".call-status").html('Call end');
	    		setTimeout(function(){
	    			hangup();
	    		}, 1000);
	    	});

	    	Twilio.Device.cancel(function(conn){
	    		// console.log('Make call Twilio cancel: ');
	    		// console.log(conn.status);
	    	});

		    Twilio.Device.error(function (error) {
		    	hangup();
		    	// console.log('Make call Twilio error: ');
		    	// console.log(error.message);
		    });

		    Twilio.Device.offline(function() {
		    	hangup();
		    	// console.log('Make call Twilio offline: network connection lost');
		        // Called on network connection lost.
		    });
		    // console.log('Make call callerID: ');
		    // console.log(phone);
		    setTimeout(function(){
		    	var conn = Twilio.Device.connect({
		            agents: data.agents.map(function(agent){
		            	return agent.phone;
		            }).join(),
		            callerId: phone,
		   //          Token: token,
					// AccountSid: accountSid,
					// AuthToken: authToken,
					// GroupId: groupId
		        });
		        // console.log(conn);
		        $('#mute').click(function(){
		        	if($(this).hasClass('deactive-mute')) {	     		
		        		$(this).removeClass('deactive-mute');
		        		$(this).addClass('active-mute');
		        	}
		        	else if($(this).hasClass('active-mute')) {		        		
		        		$(this).removeClass('active-mute');
		        		$(this).addClass('deactive-mute');
		        	}
		        	if($(this).hasClass('deactive-mute')) {	
		        		conn.mute(false);	        		
		        		console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
		        	}
		        	else if($(this).hasClass('active-mute')) {	
		        		conn.mute(true);	        		
		        		console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
		        	}
		        });
		        $('#mute-speaker').click(function(){
		        	if($(this).hasClass('deactive-mute-speaker')) {	     		
						$(this).removeClass('deactive-mute-speaker');
						$(this).addClass('active-mute-speaker');
					}
					else if($(this).hasClass('active-mute-speaker')) {		        		
						$(this).removeClass('active-mute-speaker');
						$(this).addClass('deactive-mute-speaker');
					}
					// if($(this).hasClass('deactive-mute')) {	
		        		
		   //      	}
		   //      	else if($(this).hasClass('active-mute')) {	
		        		
		   //      	}
		        });
		    }, 3000);
		},
		error: function(error) {
			$("#select-team").css("display","none");
			$("#calling").css("display","none");
			$("#invalid-enter-phone p").html('No agent here');
			$("#invalid-enter-phone").css("display","block");
			setTimeout(function(){
    			hangup();
    			$("#invalid-enter-phone").css("display","none");
    		}, 3000);
			// console.log('Make call error: ');
			// console.log(error);
		}
	});
}

function hangup(){
	$("#select-team").css("display","block");
	$("#calling").css("display","none");
	Twilio.Device.disconnectAll();
}

function logout() {
	if (typeof(Storage) == "undefined") {
		// Sorry! No Web Storage support..
	    console.log('Sorry! No Web Storage support..');
	} else {
	    // Code for localStorage/sessionStorage.
	    console.log('Web Storage is supported.');	    
	    localStorage.removeItem("clientPhoneNumber");
	    var currentURL = sessionStorage.getItem("currentURL");
	    // console.log('Log out current URL: ');
	    // console.log(currentURL);
	    if(currentURL.search('-') != -1) {
			var parentURL = currentURL.split("-")[0];			
			var redirectURL = '//localhost:3000' + parentURL;
			console.log('Log out reload to URL: ');
			console.log(redirectURL);
			location.replace(redirectURL);
		}
		else {
			var redirectURL = '//localhost:3000' + currentURL;
			console.log('Log out reload to URL: ');
			console.log(redirectURL);
			location.replace(redirectURL);
		}
	}
}