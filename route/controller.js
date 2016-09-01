// This module consists of route handlers for requests from web

const twilio=require('twilio');
const cre=require('../config/twilio-master');
const client=twilio(cre.sid,cre.authToken);

const sns=require('../lib/aws-sns-promise');
const AppArn=require('../config/app-arn');

const Promise=require('bluebird');

const userRepo=require('../model/user');
const groupRepo=require('../model/group');
const callerRepo=require('../model/caller');
const unsolvedRepo=require('../model/unsolved');

module.exports=function(app){
	'use strict';

	/*
	- Description:
		When a caller logs in using their phone number:
		+ If this caller hasn't been stored, a record in table Caller will be created,
		a SMS text containing verification code will be sent also
		+ If this caller is already stored but not yet verified, a new verification code
		will be sent
		+ If this caller is already stored and verified, nothing is done
	- Request:
	{
		phone
	}
	- Response:
	{
		success
		verified
		error
	}
	*/

	app.post('/send',function(req,res){
		var phone=req.body.phone;
		if (phone.indexOf('+')<0){
			phone='+'+phone.trim();
		}
		var code=Date.now().toString();
		code=code.substring(code.length-4);
		const data={
			phone:phone,
			code:code,
			verified:false
		};
		callerRepo.getCaller(phone).then(
			(result)=>{
				if (result.data){
					if (result.data.verified){
						// Caller is already verified
						res.json({success:1,verified:true});
					} else{
						// Send a new code
						callerRepo.updateCaller(result.data.objectId,{code:code}).then(
							(result)=>{
								const options={
									from:"YOUR_PHONE_NUMBER",
									to:phone,
									body:code+" - Gcall verification"
								};
								client.messages.create(options,function(err,msg){
									if (err){
										res.status(500).json({error:err.message});
									} else{
										res.json({success:1,verified:false});
									}
								});
							},
							(error)=>res.status(500).json({error:error}));
					}
				} else{
					// Create a new caller and send code
					callerRepo.createCaller(data).then(
						(result)=>{
							const options={
								from:"YOUR_PHONE_NUMBER",
								to:phone,
								body:code+" - Gcall verification"
							};
							client.messages.create(options,function(err,msg){
								if (err){
									res.status(500).json({error:err.message});
								} else{
									res.json({success:1,verified:false});
								}
							});
						},
						(error)=>res.status(500).json({error:error}));
				}
			},
			(error)=>res.status(500).json({error:error}));
	});

	/*
	- Description:
		Caller submits verification code they received:
		+ If this caller is already verified, throw an error back
		+ If verification code is submitted more than 5 minutes after it is created,
		throw an error back
		+ If verification code is wrong, throw an error back
		+ If verification code is true, update caller and respond with a success
	- Request:
	{
		phone
		code
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/verify',function(req,res){
		const now=Date.now();
		var phone=req.body.phone;
		if (phone.indexOf('+')<0){
			phone='+'+phone.trim();
		}
		callerRepo.getCaller(phone).then(
			(result)=>{
				const data=result.data;
				if (data.verified){
					res.status(500).json({error:'This number is already verified'});
				} else{
					const time=Date.parse(data.updatedAt);
					const gap=Math.floor((now-time)/60000);
					// If it is 5 minutes or more, the code is not valid anymore
					if (gap<5){
						if (data.code==req.body.code){
							callerRepo.updateCaller(data.objectId,{verified:true}).then(
								(result)=>res.json({success:1}),
								(error)=>res.status(500).json({error:error}));
						} else{
							res.status(500).json({error:'Invalid verification code'});
						}
					} else{
						res.status(500).json({error:'Verification code expired'});
					}
				}
			},
			(error)=>res.status(500).json({error:error}));
	});

	/*
	- Description:
		This route handles request from Twilio to make a call
	- Request:
	{
		DialCallStatus
		caller
		agents: List of agents chosen to receive this call
		clients: List of agents Twilio already tried to connect
	}
	- Response:
		Response is a TwiML document indicating responding action
	*/

	app.post('/callcenter',function(req,res){
		console.log(req.body);
		var twiml=new twilio.TwimlResponse();
		res.type('text/xml');
		const status=req.body.DialCallStatus;
		if (status && status=='completed'){
			// Call is already completed
			twiml.say('Your call is completed. Thank you for using our service');
		} else{
			const caller=req.body.callerId || req.query.caller;
			const phoneList=req.body.agents || req.query.agents || '';
			var agents=phoneList.split(',');
			var clients='';
			// Agents are string of agents not tried yet
			// Clients are string of agents already tried
			if (req.query.clients){
				clients=req.query.clients;
				const list=clients.split(',');
				list.map((item)=>{
					const i=agents.indexOf(item);
					if (i>=0){
						agents.splice(i,1);
					}
				});
			}
			const phone=agents[0];
			if (phone){
				clients=clients=='' ? phone : clients+','+phone;
				const options={
					timeout:10,
					action:'/callcenter?caller='+caller+'&clients='+clients+'&agents='+phoneList,
					callerId:caller
				};
				twiml.dial(options,function(node){
					node.client(phone);
				});
			} else{
				twiml.say('Sorry. We could not reach any agents. Please call back later');
			}
		}
		res.send(twiml.toString());
	});

	app.post('/center',function(req,res){
		var twiml=new twilio.TwimlResponse();
		res.type('text/xml');
		twiml.say('Please call back later');
		console.log(req);
		res.send(twiml.toString());
	});

	/*
	- Description:
		Get all agents in group that caller wants to make a call, generate a Twilio
		capability token to allow outgoing and incoming call, then use it to publish
		a message through VoIP push to all agents
		Data responded to browser contains accountSid, authToken and capability token
		to connect to devices handling published message
	- Request:
	{
		group
	}
	- Response:
	{
		accountSid
		authToken
		token
		error
	}
	*/

	app.get('/:group/call',function(req,res){
		const i=req.params.group.indexOf('-');
		const groupId=i>=0 ? req.params.group.substring(0,i) : req.params.group;
		userRepo.getUsersByGroup(groupId).then(
			(result)=>{
				const sid=result.sid;
				const authToken=result.authToken;
				// Get all agents working for that group
				groupRepo.chooseAgents(req.params.group).then(
					(result)=>{
						const list=result.list;
						var message="{\"default\": \"hello\",";
						var iosMsg="\"APNS_VOIP_SANDBOX\": \"{\\\"aps\\\":{"
						+"\\\"alert\\\": \\\"hello\\\","
						+"\\\"type\\\": \\\"incoming\\\","
						+"\\\"groupId\\\": \\\""+req.params.group+"\\\","
						+"\\\"accountSid\\\": \\\""+sid+"\\\","
						+"\\\"authToken\\\": \\\""+authToken+"\\\","
						+"\\\"token\\\":{";
						var androidMsg="\"GCM\": \"{\\\"data\\\":{"
						+"\\\"type\\\": \\\"incoming\\\","
						+"\\\"groupId\\\": \\\""+req.params.group+"\\\","
						+"\\\"accountSid\\\": \\\""+sid+"\\\","
						+"\\\"authToken\\\": \\\""+authToken+"\\\",";
						list.map((agent,i)=>{
							// Generate a capability token for all agents to connect
							const capability=new twilio.Capability(sid,authToken);
							capability.allowClientOutgoing(cre.app);
							capability.allowClientIncoming(agent.phone);
							const token=capability.generate(3600);
							agent.subscriptions.map((sub)=>{
								if (sub.deviceType=='ios'){
									iosMsg=iosMsg+"\\\""+agent.phone+"\\\":"
									+"\\\""+token+"\\\",";
								} else{
									androidMsg=androidMsg+"\\\""+agent.phone+"\\\":"
									+"\\\""+token+"\\\",";
								}
							});
						});
						iosMsg=iosMsg.substring(0,iosMsg.length-1)+"}}}\",";
						androidMsg=androidMsg.substring(0,androidMsg.length-1)+"}}\"";
						message=message+iosMsg+androidMsg+"}";
						// Publish message to topic so that all agents subcribing and receive
						const params={
							TopicArn:result.topic,
							MessageStructure:'json',
							Message:message
						};
						sns.publishAsync(params).then(
							(result)=>{
								const capability=new twilio.Capability(sid,authToken);
								capability.allowClientOutgoing(cre.app);
								const token=capability.generate(3600);
								res.json({
									accountSid:sid,
									authToken:authToken,
									token:token,
									agents:list
								});
							},
							(error)=>res.status(500).json({error:error}));
					},
					(error)=>res.status(500).json({error:error}));
			},
			(error)=>res.status(500).json({error:error}));
	});

	/*
	- Description:
		Create an unsolved call whenever caller fails to make a call from browser
		(generally when using Safari), then notify all agents about that unsolved call
	- Request:
	{
		group
		phone
	}
	- Response:
	{
		objectId
		error
	}
	*/

	app.post('/:group/unsolved',function(req,res){
		var phone=req.body.phone;
		if (phone.indexOf('+')<0){
			phone='+'+phone.trim();
		}
		var kaiseki=require('../config/parse-config');
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		groupRepo.getDetailedGroup(req.params.group).then(
			(result)=>{
				const group=result;
				if (group.type=='agent'){
					const name=group.name || group.hotline;
					var agents=group.data.map((agent)=>(agent.email));
					userRepo.getUsersByGroup(group.hotline).then(
						(result)=>{
							var promises=[];
							const master=result;
							const unsolved={
								caller:phone,
								groupId:req.params.group,
								hotline:group.hotline,
								master:master.email,
								groupName:name
							};
							unsolvedRepo.createUnsolved(unsolved).then(
								(result)=>{
									res.json({objectId:result.objectId});
									// Notify all agents about that unsolved call
									var message="{\"default\": \"hello\",";
									var iosMsg="\"APNS_VOIP_SANDBOX\": \"{\\\"aps\\\":{"
									+"\\\"alert\\\": \\\"hello\\\","
									+"\\\"type\\\": \\\"unsolved\\\","
									+"\\\"objectId\\\": \\\""+result.objectId+"\\\","
									+"\\\"phone\\\": \\\""+phone+"\\\","
									+"\\\"message\\\": \\\"Group "+name+" has had an unsolved call from "
									+phone+". Do you want to call them back?\\\""
									+"}}\",";
									var androidMsg="\"GCM\": \"{\\\"data\\\":{"
									+"\\\"type\\\": \\\"unsolved\\\","
									+"\\\"objectId\\\": \\\""+result.objectId+"\\\","
									+"\\\"phone\\\": \\\""+phone+"\\\","
									+"\\\"message\\\": \\\"Group "+name+" has had an unsolved call from "
									+phone+". Do you want to call them back?\\\""
									+"}}\"";
									message=message+iosMsg+androidMsg+"}";
									const params={
										TopicArn:group.topic,
										MessageStructure:'json',
										Message:message
									};
									promises.push(sns.publishAsync(params));
									Promise.all(promises);
								},
								(error)=>res.status(500).json({error:error}));
						},
						(error)=>res.status(500).json({error:error}));
				} else{
					res.status(500).json({error:'This group does not have any agents'});
				}
			},
			(error)=>res.status(500).json({error:error}));
	});

	/*
	- Description:
		+ If the method is GET, detailed information will be sent through a view rendering
		+ If the method is POST, detailed information will be responded
	- Request:
	{
		group
	}
	- Response:
	{
		data: An array of object
			If type of group is "subgroup", each element contains:
			+ extension
			+ name
			+ description
			+ has
			+ length
			If type of group is "agent", each element contains:
			+ fullname
			+ email
			+ phone
	}
	*/

	app.use('/:group',function(req,res){
		groupRepo.getDetailedGroup(req.params.group).then(
			(result)=>{
				if (req.method=='GET'){
					res.render('index',{data:result})
				} else {
					res.json({data:result});
				}
			},
			(error)=>res.render('error'));
	});


}