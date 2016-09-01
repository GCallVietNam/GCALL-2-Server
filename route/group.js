// This module consists of route handlers revolving around Group

const isAuthenticated=require('./isAuthenticated');

const twilio=require('twilio');
const cre=require('../config/twilio-master');
const client=twilio(cre.sid,cre.authToken);

const sns=require('../lib/aws-sns-promise');
const AppArn=require('../config/app-arn');

const Promise=require('bluebird');

const groupRepo=require('../model/group');
const userRepo=require('../model/user');
const agentRepo=require('../model/agent');

const util=require('../lib/util');

module.exports=function(app){
	'use strict';

	/*
	- Description:
		Get a list of countries Twilio supports phone numbers
	- Request:
	{
	}
	- Response:
	{
		list: An array of object, each contains:
			+ ISO: ISO code of country name
			+ country
			+ code: Code number of country
	}
	*/

	app.get('/api/hotline/country',function(req,res){
		const jsonfile=require('jsonfile');
		const file=__dirname+'/../config/country-list.json';
		const list=jsonfile.readFileSync(file);
		var country=[];
		var results=[];
		list.map((item)=>{
			if (country.indexOf(item.ISO)==-1){
				country.push(item.ISO);
				results.push({
					ISO:item.ISO,
					country:item.Country,
					code:Number(item['Country Code'])
				});
			}
		});
		res.json({list:results});
	});

	/*
	- Description:
		Get a list of toll-free number for hire by Twilio, filtering by country
	- Request:
	{
		country: ISO code of country name
	}
	- Response:
	{
		data: An array of object, each contains:
			+ friendlyName
			+ phoneNumber
			+ isoCountry
		error
	}
	*/

	app.get('/api/hotline/list',function(req,res){
		if (req.query.country){
			client.availablePhoneNumbers(req.query.country).tollFree.list({},function(err,data){
				if (err){
					res.json({data:[],error:err.message});
				} else{
					const numbers=data.availablePhoneNumbers.map(function(number){
						return {
							friendlyName:number.friendlyName,
							phoneNumber:number.phoneNumber,
							isoCountry:number.isoCountry
						};
					});
					res.json({data:numbers,error:null});
				}
			});
		} else{
			res.json({data:[],error:'Missing country'});
		}
	});

	// Buy a hotline

	app.post('/api/hotline/buy',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		var phone=req.body.phone;
		if (phone.indexOf('+')<0){
			phone='+'+phone.trim();
		}
		kaiseki.getCurrentUser(function(err,resp,body,success){
			if (success){
				var hasGroups=body.hasGroups || [];
				const userId=body.objectId;
				const number={
					phoneNumber:phone,
					voiceUrl:'https://gcall.vn/config.php'
				};
				// client.incomingPhoneNumbers.create(number,function(err,data){
					const group={
						hotline:phone,
						groupId:phone,
					};
					kaiseki.createObject('Group',group,function(err,resp,body,success){
						if (success){
							hasGroups.push(body.hotline);
							kaiseki.updateUser(userId,{hasGroups:hasGroups},
								function(err,resp,body,success){
									if (success){res.json({success:1,error:null});}
									else{res.json({success:0,error:body || err});}
								}
							);
						} else{res.json({success:0,error:body || err});}
					});
				// });
			} else{res.json({success:0,error:body || err});}
		});
	});

	/*
	- Description:
		Create a hotline. The hotline will be temporarily stored in table Unverified
		instead of Group. The phone number used to create this hotline will receive a
		SMS message containing verification code
	- Request:
	{
		sessionToken: Parse's user session
		phone
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/hotline/create',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		var phone=req.body.phone;
		if (phone.indexOf('+')<0){
			phone='+'+phone.trim();
		}
		kai.getCurrentUserAsync().then(
			(result)=>{
				const user=JSON.parse(result.body);
				if (user.error){
					res.json({success:0,error:user.error});
				} else{
					groupRepo.getGroupById(phone).then(
						(result)=>{
							if (result){
								res.json({success:0,error:'This hotline already exists'});
							} else{
								const params={
									where:{
										hotline:phone,
										master:user.email
									}
								};
								kai.getObjectsAsync('Unverified',params).then(
									(result)=>{
										const body=JSON.parse(result.body);
										if (body.error){
											res.json({success:0,error:body.error})
										} else{
											const data=body.results[0] || null;
											if (data){
												// Send new code
												var code=Date.now().toString();
												code=code.substring(code.length-4);
												const options={
													from:"YOUR_PHONE_NUMBER",
													to:phone,
													body:code+" - Gcall verification"
												};
												client.messages.create(options,function(err,msg){
													if (err){
														res.json({success:0,error:err.message});
													} else{
														kai.updateObjectAsync('Unverified',data.objectId,{code:code}).then(
															(result)=>res.json({success:1,error:null}),
															(error)=>res.json({success:0,error:error}));
													}
												});
											} else{
												// Create and send code
												var code=Date.now().toString();
												code=code.substring(code.length-4);
												const group={
													hotline:phone,
													master:user.email,
													code:code
												};
												const options={
													from:"YOUR_PHONE_NUMBER",
													to:phone,
													body:code+" - Gcall verification"
												};
												client.messages.create(options,function(err,msg){
													if (err){
														res.json({success:0,error:err.message});
													} else{
														kai.createObjectAsync('Unverified',group).then(
															(result)=>res.json({success:1,error:null}),
															(error)=>res.json({success:0,error:error}));
													}
												});
											}
										}
									},
									(error)=>res.json({success:0,error:error}));
							}
						},
						(error)=>res.json({success:0,error:error}));					
				}
			},
			(error)=>res.json({success:0,error:error}));
	});

	/*
	- Description:
		Hotline master enters the code they received to verify their newly created hotline
		+ If code expired, a new code would be sent
		+ If code is wrong, throw back an error
		+ If code is true, delete the Unverified record and insert a new Group record
	- Request:
	{
		sessionToken: Parse's user session
		phone
		code
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/hotline/verify',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		const now=Date.now();
		var phone=req.body.phone;
		if (phone.indexOf('+')<0){
			phone='+'+phone.trim();
		}
		kai.getCurrentUserAsync().then(
			(result)=>{
				const user=JSON.parse(result.body);
				if (user.error){
					res.json({success:0,error:user.error});
				} else{
					groupRepo.getGroupById(phone).then(
						(result)=>{
							if (result){
								res.json({success:0,error:'This hotline is already verified'});
							} else{
								const params={
									where:{
										hotline:phone,
										master:user.email
									}
								};
								kai.getObjectsAsync('Unverified',params).then(
									(result)=>{
										const body=JSON.parse(result.body);
										if (body.error){
											res.json({success:0,error:body.error})
										} else{
											const data=body.results[0] || null;
											if (data){
												const time=Date.parse(data.updatedAt);
												const gap=Math.floor((now-time)/60000);
												if (gap<5){
													// Validate code
													if (data.code==req.body.code){
														var at=new Date();
														at=at.toISOString();
														var due=new Date();
														due.setDate(due.getDate()+30);
														due=due.toISOString();
														const group={
															hotline:phone,
															groupId:phone,
															pricing:'free',
															registerAt:at,
															expireAt:due
														};
														groupRepo.createGroup(group).then(
															(result)=>{
																var hasGroups=user.hasGroups || [];
																hasGroups.push(phone);
																userRepo.updateUser(user.objectId,{hasGroups:hasGroups}).then(
																	(result)=>{
																		kai.deleteObjectAsync('Unverified',data.objectId).then(
																			(result)=>res.json({success:1,error:null}),
																			(error)=>res.json({success:0,error:error}));
																	},
																	(error)=>res.json({success:0,error:error}));
															},
															(error)=>res.json({success:0,error:error}));
													} else{
														res.json({success:0,error:'Invalid verification code'});
													}
												} else{
													// Code expired, create new one
													var code=Date.now().toString();
													code=code.substring(code.length-4);
													const options={
														from:"YOUR_PHONE_NUMBER",
														to:phone,
														body:code+" - Gcall verification"
													};
													client.messages.create(options,function(err,msg){
														if (err){
															res.json({success:0,error:err.message});
														} else{
															kai.updateObjectAsync('Unverified',data.objectId,{code:code}).then(
																(result)=>res.json({success:0,error:'Verification code expired. New code has been sent'}),
																(error)=>res.json({success:0,error:error}));
														}
													});
												}
											} else{
												res.json({success:0,error:'You have not created this hotline'});
											}
										}
									},
									(error)=>res.json({success:0,error:error}));
							}
						},
						(error)=>res.json({success:0,error:error}));					
				}
			},
			(error)=>res.json({success:0,error:error}));
	});

	/*
	- Description:
		Master will see information about features their hotline uses
	- Request:
	{
		sessionToken: Parse's user session
		hotline
	}
	- Response:
	{
		data: An object containing:
			+ pricing
			+ registerAt: Time of package registration
			+ expireAt: Expiry moment
			+ lastCalculated: Last moment when number of seconds used was calculated
			+ timeUsed: Text indicating how much simultaneous call time is used
			+ numberOfAgents: Total number of agents working for this hotline
		error
	}
	*/

	app.post('/api/hotline/info',isAuthenticated,function(req,res){
		var hotline=req.body.hotline;
		if (hotline.indexOf('+')==-1){
			hotline='+'+hotline.trim();
		}
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:null,error:body.error});
				} else{
					if (body.hasGroups.indexOf(hotline)==-1){
						res.json({data:null,error:'You do not own this hotline'});
					} else{
						groupRepo.getGroupById(hotline).then(
							(result)=>{
								const info=result;
								agentRepo.getAgentsByHotline(hotline).then(
									(result)=>res.json({
										data:{
											pricing:info.pricing,
											registerAt:info.registerAt,
											expireAt:info.expireAt,
											lastCalculated:info.lastCalculated || info.createdAt,
											timeUsed:util.secToMin(info.simultaneousSeconds || 0),
											numberOfAgents:result.length
										},
										error:null
									}),
									(error)=>res.json({data:null,error:error}));
							},
							(error)=>res.json({data:null,error:error}));
					}
				}
			},
			(error)=>res.json({data:null,error:error}));
	});

	/*
	- Description:
		Hotline master sends a request to upgrade their hotline. An email contaning
		a link will be sent to customer support agent of Gcall. After upgrade payment
		is fulfilled, Gcall CS agent will click that link to complete upgrade
	- Request:
	{
		sessionToken: Parse's user session
		hotline
		pricing
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/hotline/upgrade',function(req,res){
		var hotline=req.body.hotline;
		if (hotline.indexOf('+')==-1){
			hotline='+'+hotline.trim();
		}
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({success:0,error:body.error});
				} else{
					if (body.hasGroups.indexOf(hotline)==-1){
						res.json({success:0,error:'You do not own this hotline'});
					} else{
						groupRepo.getGroupById(hotline).then(
							(result)=>{
								if (result){
									if (result.pricing!=req.body.pricing){
										// Send an email containing link to accept
										const nodemailer=require('nodemailer');
										const config=require('../config/mailer');
										const transporter=nodemailer.createTransport(config);
										const htmlText='<p>Hotline '+hotline+' needs updating from '
										+result.pricing+' to '+req.body.pricing+' pricing</p>'
										+'<a href="https://dev.gcall.vn/api/hotline/accept'
										+'?sessionToken='+req.body.sessionToken
										+'&hotline='+hotline
										+'&pricing='+req.body.pricing+'">'
										+'Click here to accept'
										+'</a>';
										const options={
											from:'YOUR_MAIL',
											to:'YOUR_MAIL',
											subject:'Hotline upgrade request',
											html:htmlText
										};
										transporter.sendMail(options,function(error,info){
											if(error){
												res.json({success:0,error:error});
											} else{
												res.json({success:1,error:null});
											}
										});
									} else{
										res.json({success:0,error:'This hotline is already priced at '+result.pricing+' package'});
									}
								} else{
									res.json({success:0,error:'Hotline does not exist'});
								}
							},
							(error)=>res.json({success:0,error:error}));
					}
				}
			},
			(error)=>res.json({success:0,error:error}));
	});

	/*
	- Description:
		This route handles the link Gcall CS agent clicks on to fulfill upgrade
		after upgrade fee is paid. Hotline master will get a notification upon completing
	- Request:
	{
		sessionToken: Parse's user session
		hotline
		pricing
	}
	- Response:
	{
		success
		error
	}
	*/

	app.get('/api/hotline/accept',function(req,res){
		var hotline=req.query.hotline;
		if (hotline.indexOf('+')==-1){
			hotline='+'+hotline.trim();
		}
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.query.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({success:0,error:body.error});
				} else{
					if (body.hasGroups.indexOf(hotline)==-1){
						res.json({success:0,error:'You do not own this hotline'});
					} else{
						groupRepo.getGroupById(hotline).then(
							(result)=>{
								if (result){
									if (result.pricing!=req.query.pricing){
										var now=new Date();
										var due=new Date();
										due.setDate(due.getDate()+30);
										now=now.toISOString();
										due=due.toISOString();
										// Reset all features
										const data={
											pricing:req.query.pricing,
											registerAt:now,
											expireAt:due,
											lastCalculated:now,
											simultaneousSeconds:0
										};
										groupRepo.updateGroup(result.objectId,data).then(
											(result)=>{
												var params={
													where:{
														hotline:hotline,
														objectId:{$ne:result.objectId}
													}
												};
												kai.getObjectsAsync('Group',params).then(
													(result)=>{
														const subs=JSON.parse(result.body).results;
														Promise.map(subs,(sub)=>groupRepo.updateGroup(sub.objectId,{pricing:req.query.pricing}))
														.then(
															(result)=>{
																res.json({success:1,error:null});
																// Push a notification to master's devices
																Promise.map(body.deviceToken,(device)=>{
																	if (device.type=='ios'){
																		const notification={
																			where:{deviceToken:device.token},
																			data:{
																				title:'Hotline upgraded',
																				alert:'Your hotline '+hotline+' has been upgraded to '+req.query.pricing+' package',
																				type:'upgrade'
																			}
																		};
																		return kai.sendPushNotificationAsync(notification).then((result)=>(result));
																	} else{
																		var message="{\"default\": \"hello\",\"GCM\": \"{\\\"data\\\":{"
																		+"\\\"title\\\":\\\"Hotline upgraded\\\","
																		+"\\\"alert\\\":\\\"Your hotline "+hotline+"has been upgraded to "+req.query.pricing+" package\\\","
																		+"\\\"type\\\":\\\"upgrade\\\"}}\"}";
																		params={
																			PlatformApplicationArn:AppArn.gcm,
																			Token:device.token
																		};
																		return new Promise((res,rej)=>{
																			sns.createPlatformEndpointAsync(params).then(
																				(result)=>{
																					const arn=result.EndpointArn;
																					params={
																						TargetArn:arn,
																						MessageStructure:'json',
																						Message:message
																					};
																					sns.publishAsync(params).then(
																						(result)=>res(result));
																				});
																		});
																	}
																});
															});
													});
											},
											(error)=>res.json({success:0,error:error}));
									} else{
										res.json({success:0,error:'This hotline is already priced at '+result.pricing+' package'});
									}
								} else{
									res.json({success:0,error:'Hotline does not exist'});
								}
							},
							(error)=>res.json({success:0,error:error}));
					}
				}
			},
			(error)=>res.json({success:0,error:error}));
	})

	/*
	- Description:
		See a group in details
		+ Master can see all groups they manage in full details
		+ Agent can only see all other agents in their same group
		+ No one is allowed to see information about groups they do not own or work for
	- Request:
	{
		sessionToken: Parse's user session
		role: See as master or agent
	}
	- Response:
	{
		type
		pricing
		data: An array of object:
			If its type is 'subgroup', each element contains:
			+ extension
			+ name
			+ description
			+ has: Whether this subgroup has any child subgroups or agents
			+ length: Number of this subgroup's child elements
			If its type is 'agent', each element contains:
			+ fullname
			+ email
			+ phone
			+ accepted: Their working status in this group
		error
	}
	*/

	app.post('/api/:group',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		if (req.body.role=='master'){
			groupRepo.authenticateMaster(req.params.group).then(
				(result)=>{
					groupRepo.getDetailedGroup(req.params.group).then(
						(result)=>{
							const group={
								type:result.type,
								pricing:result.pricing,
								data:result.data,
								error:null
							};
							res.json(group);
						},
						(error)=>res.json({type:'none',data:[],error:error}));
				},
				(error)=>res.json({type:'none',data:[],error:error}));
		} else if (req.body.role='agent'){
			kai.getCurrentUserAsync().then(
				(result)=>{
					const body=JSON.parse(result.body);
					if (body.error){
						res.json({type:'none',data:[],error:body.error});
					} else{
						const data={
							email:body.email,
							groupId:req.params.group
						};
						agentRepo.getAgent(data).then(
							(result)=>{
								groupRepo.getDetailedGroup(req.params.group).then(
									(result)=>{
										const group={
											type:result.type,
											pricing:result.pricing,
											data:result.data,
											error:null
										};
										res.json(group);
									},
									(error)=>res.json({type:'none',data:[],error:error}));
							},
							(error)=>res.json({type:'none',data:[],error:error}));
					}
				},
				(error)=>res.json({type:'none',data:[],error:error}));
		} else{
			res.json({type:'none',data:[],error:'You are not authenciated'});
		}
	});

	/*
	- Description:
		Add a subgroup with extension into one group
		If the parent group already has agents, throw back an error
		The extension number must not be already used
		Hotline package must be premium to have authority to add subgroup
	- Request:
	{
		sessionToken: Parse's user session
		group
		name
		description
		extension
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/:group/add/subgroup',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		groupRepo.authenticateMaster(req.params.group).then(
			(result)=>{
				groupRepo.getDetailedGroup(req.params.group).then(
					(result)=>{
						if (result.type=='agent'){
							res.json({
								success:0,
								error:'Subgroup cannot be added into this group'
							});
						} else{
							var subgroups='';
							result.data.map(
								(subgroup,i)=>{
									subgroups=i==0 ?
										subgroup.extension :
										subgroups+','+subgroup.extension;
								});
							if (subgroups.indexOf(req.body.extension)>=0){
								res.json({
									success:0,
									error:'This extension is already used'
								});
							} else{
								if (result.pricing!='premium'){
									res.json({success:0,error:'This hotline is not allow to have subgroups'});
								} else{
									// Only premium hotline is allowed to have subgroups
									const sub={
										name:req.body.name,
										description:req.body.description || '',
										hotline:result.hotline,
										groupId:req.params.group+'-'+req.body.extension,
										pricing:result.pricing
									};
									const objectId=result.objectId;
									subgroups=subgroups==''?
									req.body.extension :
									subgroups+','+req.body.extension;
									groupRepo.createGroup(sub).then(
										(result)=>{
											// Update subgroups to parent group
											groupRepo.updateGroup(objectId,{subgroups:subgroups})
											.then(
												(result)=>res.json({success:1,error:null}),
												(error)=>res.json({success:0,error:error}));
										},
										(error)=>res.json({success:0,error:error}));
								}
							}
						}
					},
					(error)=>res.json({success:0,error:error.error}))
			},
			(error)=>res.json({success:0,error:error}));
	});

	/*
	- Description:
		Add an agent into one group
		If the parent group already has subgroups, throw back an error
		Agent added must be a registered user
		Hotline package must be validated not to overuse its adding function
		Right after adding, push a notification to all devices that agent uses
	- Request:
	{
		sessionToken: Parse's user session
		group
		email
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/:group/add/agent',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		groupRepo.authenticateMaster(req.params.group).then(
			(result)=>{
				const master=result;
				groupRepo.getDetailedGroup(req.params.group).then(
					(result)=>{
						if (result.type=='subgroup'){
							res.json({
								success:0,
								error:'Agent cannot be added into this group'
							});
						} else{
							const group=result;
							var agents='';
							group.data.map(
								(agent,i)=>{
									agents=i==0 ?
										agent.email :
										agents+','+agent.email;
								});
							if (agents.indexOf(req.body.email)>=0){
								res.json({success:0,error:'This agent is already in this group'});
							} else{
								var limit;
								if (result.pricing=='free'){
									limit=2;
								} else if (result.pricing=='startup'){
									limit=5;
								} else if (result.pricing=='premium'){
									limit=15;
								}
								// Validate hotline package before adding agent
								groupRepo.validateBeforeAddingAgent(group.hotline,limit).then(
									(result)=>{
										userRepo.getUsersByEmail(req.body.email).then(
											(result)=>{
												const list=result.deviceToken || [];
												agents=agents=='' ?
													req.body.email :
													agents+','+req.body.email;
												// Group already has agents
												if (group.topic){
													const data={
														fullname:result.fullname,
														email:req.body.email,
														phone:result.phone,
														groupId:req.params.group,
														accepted:false,
														topic:group.topic,
														groupName:group.name,
														hotline:group.hotline,
														addedBy:master.fullname
													};
													agentRepo.createAgent(data).then(
														(result)=>{
															// Notify user that they have just been added
															Promise.map(list,(item)=>{
																if (item.type=='ios'){
																	const notification={
																		where:{deviceToken:item.token},
																		data:{
																			title:'New group invited',
																			alert:'You have been invited to group '+req.params.group,
																			type:'invitation',
																			groupId:req.params.group
																		}
																	};
																	return kai.sendPushNotificationAsync(notification).then(
																		(result)=>(result),
																		(error)=>(error));
																} else{
																	var message="{\"default\": \"hello\",\"GCM\": \"{\\\"data\\\":{"
																	+"\\\"title\\\":\\\"New group invited\\\","
																	+"\\\"alert\\\":\\\"You have been invited to group "+req.params.group+"\\\","
																	+"\\\"type\\\":\\\"invitation\\\","
																	+"\\\"groupId\\\":\\\""+req.params.group+"\\\"}}\"}";
																	var params={
																		PlatformApplicationArn:AppArn.gcm,
																		Token:item.token
																	};
																	return new Promise((resolve,reject)=>{
																		sns.createPlatformEndpointAsync(params).then(
																			(result)=>{
																				const arn=result.EndpointArn;
																				params={
																					TargetArn:arn,
																					MessageStructure:'json',
																					Message:message
																				};
																				sns.publishAsync(params).then(
																					(result)=>resolve(result),
																					(error)=>reject(error.message));
																			},
																			(error)=>reject(error.message));
																	});
																}
															});
															res.json({success:1,error:null});
														},
														(error)=>res.json({success:0,error:error}));
												} else{
													// Group does not have any agents yet, create a topic on Amazon
													const params={
														Name:req.params.group.substring(1)
													};
													var data={
														fullname:result.fullname,
														email:req.body.email,
														phone:result.phone,
														groupId:req.params.group,
														accepted:false,
														groupName:group.name,
														hotline:group.hotline,
														addedBy:master.fullname
													};
													sns.createTopicAsync(params).then(
														(result)=>{
															const arn=result.TopicArn;
															groupRepo.updateGroup(group.objectId,{topic:arn}).then(
																(result)=>{
																	data.topic=arn;
																	agentRepo.createAgent(data).then(
																		(result)=>{
																			// Notify user that they have just been added
																			Promise.map(list,(item)=>{
																				if (item.type=='ios'){
																					const notification={
																						where:{
																							deviceToken:item.token
																						},
																						data:{
																							title:'New group invited',
																							alert:'You have been invited to group '+req.params.group,
																							type:'invitation',
																							groupId:req.params.group
																						}
																					};
																					return kai.sendPushNotificationAsync(notification).then(
																						(result)=>(result),
																						(error)=>(error));
																				} else{
																					var message="{\"default\": \"hello\",\"GCM\": \"{\\\"data\\\":{"
																					+"\\\"title\\\":\\\"New group invited\\\","
																					+"\\\"alert\\\":\\\"You have been invited to group "+req.params.group+"\\\","
																					+"\\\"type\\\":\\\"invitation\\\","
																					+"\\\"groupId\\\":\\\""+req.params.group+"\\\"}}\"}";
																					var params={
																						PlatformApplicationArn:AppArn.gcm,
																						Token:item.token
																					};
																					return new Promise((resolve,reject)=>{
																						sns.createPlatformEndpointAsync(params).then(
																							(result)=>{
																								const arn=result.EndpointArn;
																								params={
																									TargetArn:arn,
																									MessageStructure:'json',
																									Message:message
																								};
																								sns.publishAsync(params).then(
																									(result)=>{
																										params={
																											EndpointArn:arn
																										};
																										sns.deleteEndpointAsync(params).then(
																											(result)=>resolve(result),
																											(error)=>reject(error.message));
																									},
																									(error)=>reject(error.message));
																							},
																							(error)=>reject(error.message));
																					});
																				}
																			});
																			res.json({success:1,error:null});
																		},
																		(error)=>res.json({success:0,error:error}));
																},
																(error)=>res.json({success:0,error:error}));
														},
														(error)=>res.json({success:0,error:error.message}));
												}
											},
											(error)=>res.json({success:0,error:error}));
									},
									(error)=>res.json({success:0,error:error}));
							}
						}
					},
					(error)=>res.json({success:0,error:error.error}))
			},
			(error)=>res.json({success:0,error:error}));
	});

	/*
	- Description:
		Delete a group
		+ If group has parent, update parent group
		+ Otherwise, update hotline master
	- Request:
	{
		sessionToken: Parse's user session
		group
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/:group/delete',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		groupRepo.authenticateMaster(req.params.group).then(
			(result)=>{
				groupRepo.deleteWorkingGroup(req.params.group).then(
					(result)=>{
						const i=req.params.group.lastIndexOf('-');
						if (i==-1){
							// Group is a hotline
							userRepo.getUsersByGroup(req.params.group).then(
								(result)=>{
									var hasGroups=result.hasGroups;
									const i=hasGroups.indexOf(req.params.group);
									hasGroups.splice(i,1);
									userRepo.updateUser(result.objectId,{hasGroups:hasGroups}).then(
										(result)=>res.json({success:1,error:null}),
										(error)=>res.json({success:0,error:error}));
								},
								(error)=>res.json({success:0,error:error}));
						} else{
							// Group is a hotline's child
							const parent=req.params.group.substring(0,i);
							const ext=req.params.group.substring(i+1);
							groupRepo.removeExtension(parent,ext).then(
								(result)=>res.json({success:1,error:null}),
								(error)=>res.json({success:0,error:error}));
						}
					},
					(error)=>res.json({success:0,error:error}));
			},
			(error)=>res.json({success:0,error:error}));
	});

	/*
	- Description:
		Delete an agent from one group. If there is no agent left after deleting,
		group's topic is also deleted from Amazon
	- Request:
	{
		sessionToken: Parse's user session
		group
		email
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/:group/delete/agent',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		groupRepo.authenticateMaster(req.params.group).then(
			(result)=>{
				agentRepo.deleteWorkingAgent(req.body.email,req.params.group).then(
					(result)=>{
						const topic=result;
						agentRepo.getAgentsByGroup(req.params.group).then(
							(result)=>{
								if (result.length==0){
									groupRepo.getDetailedGroup(req.params.group).then(
										(result)=>{
											const group=result;
											const params={
												TopicArn:group.topic
											};
											sns.deleteTopicAsync(params).then(
												(result)=>{
													groupRepo.updateGroup(group.objectId,{topic:''}).then(
														(result)=>res.json({success:1,error:null}),
														(error)=>res.json({success:0,error:error}));
												},
												(error)=>res.json({success:0,error:error.message}));
										},
										(error)=>res.json({success:0,error:null}));
								} else{
									res.json({success:1,error:null});
								}
							},
							(error)=>res.json({success:0,error:error}));
					},
					(error)=>res.json({success:0,error:error}));
			},
			(error)=>res.json({success:0,error:error}));
	});
}