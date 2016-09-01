// public = "//yourdomain";
// private = "//localhost:3000";

var URLString = "//yourdomain";
var countryCode = "+84";
var phone;
var submitPhoneNumber;
$(document).ready(function(){
	$("#invalid-enter-phone").css("display","none");
	var currentURL = window.location.pathname;
	if (typeof(Storage) == "undefined") {
		// Sorry! No Web Storage support..
	    console.log('Sorry! No Web Storage support..');
	} else {
	    // Code for localStorage/sessionStorage.
	    // console.log('Web Storage is supported.');
	    sessionStorage.setItem("currentURL", currentURL);	    
	    phone = localStorage.getItem("clientPhoneNumber");
	    // console.log(phone);
	    if(phone !== null) {
	    	// console.log('Input phonenumber: ');
	    	// console.log(phone);
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
	    	$("#user-info").css("display","none");
			// console.log('Country code selected: ');
			// console.log(countryCode);
			phone=$("#inputPhoneNum").val();
			if (phone.substring(0, 1) == '0') { 
			  	phone = phone.substring(1);
			}

			submitPhoneNumber = countryCode + phone;
			// console.log('Submit phone number: ');
			// console.log(submitPhoneNumber);
			if (typeof(Storage) !== "undefined") {
			    // Code for localStorage/sessionStorage.
			    // console.log('Input phonenumber: ');
			    // console.log('Web Storage is supported.');
			    // localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
			} else {
			    // Sorry! No Web Storage support..
			    // console.log('Sorry! No Web Storage support..');
			}
			// console.log(submitPhoneNumber);
			$.ajax({
				url: URLString + '/send',
				type:'POST',
				contentType:'application/json;charset=utf-8',
				data:JSON.stringify({phone:submitPhoneNumber}),
				dataType:'json',
				success:function(data){
					// console.log("Submit success");
					$("#enter-phone").css("display","none");
					if (data.error){
						// console.log('Submit phonenumber error: ');
						// console.log(data.error);
						$("#invalid-enter-phone").css("display","block");
					} else{
						// console.log('Submit phonenumber data: ');
						// console.log(data);
						if (data.verified){
							$("#select-team").css("display","block");
							$("#user-info").css("display","block");
							$('.current-phone-number').html(submitPhoneNumber);
							localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
						} else{
							$("#phonenumber").html(submitPhoneNumber);
							$("#verify").css("display","block");
						}
					}
				},
				error:function(error){
					// console.log("Submit error");
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
		// console.log('Country code selected: ');
		// console.log(countryCode);
		$("#user-info").css("display","none");
		phone = $("#inputPhoneNum").val();
		if (phone.substring(0, 1) == '0') { 
		  	phone = phone.substring(1);
		}
		submitPhoneNumber = countryCode + phone;
		// console.log('Submit phone number: ');
		// console.log(submitPhoneNumber);
		if (typeof(Storage) !== "undefined") {
		    // Code for localStorage/sessionStorage.
		    // console.log('Input phonenumber: ');
			// console.log(submitPhoneNumber);
		    // console.log('Web Storage is supported.');
		    // localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
		} else {
		    // Sorry! No Web Storage support..
		    // console.log('Sorry! No Web Storage support..');
		}
		// console.log(submitPhoneNumber);
		$.ajax({
			url: URLString + '/send',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone:submitPhoneNumber}),
			dataType:'json',
			success:function(data){
				// console.log("Submit success");
				$("#enter-phone").css("display","none");
				if (data.error){
					// console.log('Submit phonenumber error: ');
					// console.log(data.error);
					$("#invalid-enter-phone").css("display","block");
				} else{
					// console.log('Submit phonenumber data: ');
					// console.log(data);
					if (data.verified){
						$("#select-team").css("display","block");
						$("#user-info").css("display","block");
						$('.current-phone-number').html(submitPhoneNumber);
						localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
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
	$('#enter-hotline').css('display', 'none');
	setTimeout(function(){
		$('#invalid-hotline').css('display', 'none');
		$('#enter-hotline').css('display', 'block');		
	}, 3000);

	$("#inputHotline").keypress(function(event){
	    if(event.which == 13){
	    	event.preventDefault();
			// console.log('Country code selected: ');
			// console.log(countryCode);
			phone=$("#inputHotline").val();
			var redirectURL = URLString + '/' + phone;
			console.log(redirectURL);
			location.replace(redirectURL);
	    }
	});

	$("#submitHotline").click(function(event){
		event.preventDefault();
		// console.log('Country code selected: ');
		// console.log(countryCode);
		phone=$("#inputHotline").val();
		var redirectURL = URLString + '/' + phone;
		// console.log(redirectURL);
		location.replace(redirectURL);
	});

	$("#resendCode").click(function(){
		event.preventDefault();
		// console.log('Country code selected: ');
		// console.log(countryCode);
		$("#user-info").css("display","none");
		phone=$("#inputPhoneNum").val();
		if (phone.substring(0, 1) == '0') { 
		  	phone = phone.substring(1);
		}
		submitPhoneNumber = countryCode + phone;
		// console.log('Submit phone number: ');
		// console.log(submitPhoneNumber);
		if (typeof(Storage) !== "undefined") {
		    // Code for localStorage/sessionStorage.
		    // console.log('Input phonenumber: ');
		    // console.log('Web Storage is supported.');
		    // localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
		} else {
		    // Sorry! No Web Storage support..
		    // console.log('Sorry! No Web Storage support..');
		}
		$.ajax({
			url: URLString + '/send',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone:submitPhoneNumber}),
			dataType:'json',
			success:function(data){
				$("#enter-phone").css("display","none");
				
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
						$("#user-info").css("display","block");
						$('.current-phone-number').html(submitPhoneNumber);
						localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
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
	var phoneNumber = localStorage.getItem("clientPhoneNumber");
	// console.log(submitPhoneNumber);
	$("#submitCode").click(function(){
		$("#user-info").css("display","none");
		var code=$(this).parent().find('input:text').val();
		// console.log(phone);
		// console.log(code);
		// console.log(URLString);
		$.ajax({
			url: URLString + '/verify',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone:submitPhoneNumber,code:code}),
			dataType:'json',
			success:function(data){				
				if (data.error){
					// console.log('Submit code error on success: ');
					// console.log(data.error);
					$("#verify").css("display","none");
					$("#invalid-enter-phone p").html('Invalid code');
					$("#invalid-enter-phone").css("display","block");
					setTimeout(function(){
						$("#invalid-enter-phone").css("display","none");
						$("#verify").css("display","block");		
					}, 3000);
				} else{
					$("#verify").css("display","none");
					$("#select-team").css("display","block");
					$("#user-info").css("display","block");
					$('.current-phone-number').html(submitPhoneNumber);	
					localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
				}
			},
			error:function(error){
				// console.log('Submit code error: ');
				// console.log(error);
				$("#verify").css("display","none");
				$("#invalid-enter-phone p").html('Invalid code');
				$("#invalid-enter-phone").css("display","block");
				setTimeout(function(){
					$("#invalid-enter-phone").css("display","none");
					$("#verify").css("display","block");		
				}, 3000);
			}
		});
	});

	$("#submitCodeInput").keypress(function(event){
	    if(event.which == 13){
	    	event.preventDefault();
	    	$("#user-info").css("display","none");
			var code=$("#submitCode").parent().find('input:text').val();
			// console.log(phone);
			// console.log(code);
			// console.log(URLString);
			$.ajax({
				url: URLString + '/verify',
				type:'POST',
				contentType:'application/json;charset=utf-8',
				data:JSON.stringify({phone:submitPhoneNumber,code:code}),
				dataType:'json',
				success:function(data){				
					if (data.error){
						// console.log('Submit code error on success: ');
						// console.log(data.error);
						$("#verify").css("display","none");
						$("#invalid-enter-phone p").html('Invalid code');
						$("#invalid-enter-phone").css("display","block");
						setTimeout(function(){
							$("#invalid-enter-phone").css("display","none");
							$("#verify").css("display","block");		
						}, 3000);
					} else{
						$("#verify").css("display","none");
						$("#select-team").css("display","block");
						$("#user-info").css("display","block");
						$('.current-phone-number').html(submitPhoneNumber);	
						localStorage.setItem("clientPhoneNumber", submitPhoneNumber);
					}
				},
				error:function(error){
					// console.log('Submit code error: ');
					// console.log(error);
					$("#verify").css("display","none");
					$("#invalid-enter-phone p").html('Invalid code');
					$("#invalid-enter-phone").css("display","block");
					setTimeout(function(){
						$("#invalid-enter-phone").css("display","none");
						$("#verify").css("display","block");		
					}, 3000);
				}
			});
	    }
	});

	$(".select-country-code .dropdown .dropdown-menu li").click(function(){
		var countryName = $(this).find(".country").text();
		// console.log("From select country name:");
		// console.log(countryName);
		$(".country-name-view").html(countryName);
		var flagName = "/images/countryFlags/"+ countryName + ".png";
		var backgroundImgURL = "url(" + flagName +")";
		$(".select-country-code .country-code-content").css('background-image', backgroundImgURL);
		countryCode = $(this).find(".code").text();
		$(".country-name-view").html(countryCode);
		// console.log("From select country code:");
		// console.log(countryCode);
	});
});

function makeCall(extension){
	// Detect safari web browser.	
	var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
	// console.log('Using safari: ' + isSafari);
	if(isSafari == true) {
		$("#invalid-enter-phone p").html('Your Safari web browser is not supported.<br> We will call back later.');
		$("#select-team").css("display","none");
		$("#invalid-enter-phone").css("display","block");
		var phone = localStorage.getItem("clientPhoneNumber");
		var hotline = window.location.pathname;
		// console.log(URLString + hotline + '-' + extension + '/unsolved');
		$.ajax({
			url: URLString + hotline + '-' + extension + '/unsolved',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone: phone}),
			dataType:'json',
			success:function(data){				
				// console.log(data);
			},
			error:function(error){
				// console.log('Unsolved error: ');
				// console.log(error);
			}
		});
	}
	else {
		var hotline = window.location.pathname;
		// console.log('Make call hotline: ');
		// console.log(hotline);
		if (typeof(Storage) !== "undefined") {
		    // Code for localStorage/sessionStorage.
		    // console.log('Web Storage is supported.');
		    // console.log('Call phonenumber: ');
		    var phone = localStorage.getItem("clientPhoneNumber");
		    // console.log(phone);
		} else {
		    // Sorry! No Web Storage support..
		    // console.log('Sorry! No Web Storage support..');
		}

		$.ajax({
			url: URLString + hotline + '-' + extension + '/call',
			type: 'GET',
			dataType: 'json',
			success: function(data) {
				// console.log(data);
				$("#select-team").css("display","none");
				$("#calling").css("display","block");
				$(".call-status").css('display', 'block');
				if($(".call-status").hasClass("animate-flicker")) {
					$(".call-status").removeClass("animate-flicker");
				}
				$(".call-status").html('Calling ... ');
				// $(".agent-name").html(data.agents[0].fullname);
				$(".agent-name").html(hotline.replace('/', ''));
				$(".agent-phone-number").html(data.agents[0].phone);
				var token = data.token;
				// console.log("Token: ");
				// console.log(token);
					
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
			            callerId: phone
			        });
			        // console.log(conn.status());
			        if(conn.status() == "connecting") {
			        	$(".call-status").addClass("animate-flicker");
			        	$(".call-status").html('Connected');
			        }
			        else {
			        	$(".call-status").removeClass("animate-flicker");
			        	// console.log(conn.status());
			        }
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
			        		// console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
			        	}
			        	else if($(this).hasClass('active-mute')) {	
			        		conn.mute(true);	        		
			        		// console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
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
		
}

function openSubGroup(extension){
	var phone=$("#submitPhoneNum").parent().find('input:text').val();
	var hotline = window.location.pathname;
	var redirectURL = URLString + hotline + '-' + extension;
	window.location.replace(redirectURL);
}

function backToPrevGroup() {
	var currentURL = window.location.pathname;
	var parentURL = currentURL.split("-")[0];
	var redirectURL = URLString + parentURL;
	window.location.replace(redirectURL);
}

function makeCallNow(){
	// Detect safari web browser.
	var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
	// console.log('Using safari: ' + isSafari);
	if(isSafari == true) {
		$("#invalid-enter-phone p").html('Your Safari web browser is not supported.<br> We will call back later.');
		$("#select-team").css("display","none");
		$("#invalid-enter-phone").css("display","block");
		var phone = localStorage.getItem("clientPhoneNumber");
		var hotline = window.location.pathname;
		// console.log(URLString + hotline + '/unsolved');
		$.ajax({
			url: URLString + hotline + '/unsolved',
			type:'POST',
			contentType:'application/json;charset=utf-8',
			data:JSON.stringify({phone: phone}),
			dataType:'json',
			success:function(data){				
				// console.log(data);
			},
			error:function(error){
				// console.log('Unsolved error: ');
				// console.log(error);
			}
		});
	}
	else {
		var hotline = window.location.pathname;
		// console.log('Make call hotline: ');
		// console.log(hotline);
		if (typeof(Storage) !== "undefined") {
		    // Code for localStorage/sessionStorage.
		    // console.log('Web Storage is supported.');
		    // console.log('Call phonenumber: ');
		    var phone = localStorage.getItem("clientPhoneNumber");
		    // console.log(phone);
		} else {
		    // Sorry! No Web Storage support..
		    // console.log('Sorry! No Web Storage support..');
		}
		$.ajax({
			url: URLString + hotline + '/call',
			type: 'GET',
			dataType: 'json',
			success: function(data) {
				// console.log('Make call data: ');
				// console.log(data);
				$("#select-team").css("display","none");
				$("#calling").css("display","block");
				$(".call-status").css('display', 'block');
				if($(".call-status").hasClass("animate-flicker")) {
					$(".call-status").removeClass("animate-flicker");
				}
				$(".call-status").html('Calling ... ');
				// $(".agent-name").html(data.agents[0].fullname);

				$(".agent-name").html(hotline.replace('/', ''));
				$(".agent-phone-number").html(data.agents[0].phone);
				var token = data.token;
				// console.log("Token: ");
				// console.log(token);
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
			            callerId: phone
			        });
			        // console.log(conn.status());
			        if(conn.status() == "connecting") {
			        	$(".call-status").addClass("animate-flicker");
			        	$(".call-status").html('Connected');
			        }
			        else {
			        	$(".call-status").removeClass("animate-flicker");
			        	// console.log(conn.status());
			        }
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
			        		// console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
			        	}
			        	else if($(this).hasClass('active-mute')) {	
			        		conn.mute(true);	        		
			        		// console.log('Make call Twilio connect - mute-connection: ' + conn.isMuted());
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
		
}

function hangup(){
	$("#select-team").css("display","block");
	$("#calling").css("display","none");
	Twilio.Device.disconnectAll();
}

function logout() {
	if (typeof(Storage) == "undefined") {
		// Sorry! No Web Storage support..
	    // console.log('Sorry! No Web Storage support..');
	} else {
	    // Code for localStorage/sessionStorage.
	    // console.log('Web Storage is supported.');	    
	    localStorage.removeItem("clientPhoneNumber");
	    var currentURL = sessionStorage.getItem("currentURL");
	    // console.log('Log out current URL: ');
	    // console.log(currentURL);
	    if(currentURL.search('-') != -1) {
			var parentURL = currentURL.split("-")[0];
			var redirectURL = URLString + parentURL;		
			// var redirectURL = '//localhost:3000' + parentURL;
			// console.log('Log out reload to URL: ');
			// console.log(redirectURL);
			location.replace(redirectURL);
		}
		else {
			var redirectURL = URLString + currentURL;
			// var redirectURL = '//localhost:3000' + currentURL;
			// console.log('Log out reload to URL: ');
			// console.log(redirectURL);
			location.assign(redirectURL);
		}
	}
}