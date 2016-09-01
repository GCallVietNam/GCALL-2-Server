// This module consist of route handlers revolving around User

const isAuthenticated=require('./isAuthenticated');

const twilio=require('twilio');

const sns=require('../lib/aws-sns-promise');
const AppArn=require('../config/app-arn');

const Promise=require('bluebird');

const userRepo=require('../model/user');
const groupRepo=require('../model/group');
const agentRepo=require('../model/agent');
const unsolvedRepo=require('../model/unsolved');

const util=require('../lib/util');

module.exports=function(app){
	'use strict';

	/*
	- Description:
		Sign up an account to use Gcall app. Upon completing, user will sign in immediately
	- Request:
	{
		email: Will be used as username
		password
		fullname
		phone: Unique phone number
		deviceType: Android or iOS device
		deviceToken: Device token used for this application
	}
	- Response:
	{
		success
		error
		data: An object containing
			+ sessionToken: Parse's user session
			+ fullname
			+ email
			+ phone
	}
	*/

	app.post('/api/signup',function(req,res){
		var kaiseki=require('../config/parse-config');
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		const cre=require('../config/twilio-master');
		const client=twilio(cre.sid,cre.authToken);
		// Phone number must be unique among all users
		const params={
			where:{phone:req.body.phone}
		};
		kai.getUsersAsync(params).then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({success:0,error:body.error,data:null});
				} else{
					if (body.results.length>0){
						// Phone number is already used
						res.json({success:0,error:'Account already exists for this phone number',data:null});
					} else{
						// Create a Twilio subaccount
						client.accounts.create({friendlyName:req.body.phone},function(err,account){
							if (err){
								res.json({success:0,error:err.message,data:null});
							} else{
								const deviceToken={
									type:req.body.deviceType,
									token:req.body.deviceToken
								};
								const user={
									fullname:req.body.fullname,
									email:req.body.email,
									username:req.body.email,
									password:req.body.password,
									phone:req.body.phone,
									sid:account.sid,
									authToken:account.authToken,
									deviceToken:[deviceToken]
								};
								userRepo.createUser(user).then(
									(result)=>{
										const sessionToken=result.sessionToken;
										kai.sessionToken=sessionToken;
										const data={
											sessionToken:sessionToken,
											fullname:req.body.fullname,
											email:req.body.email,
											phone:req.body.phone
										};
										kai.getCurrentSessionAsync().then(
											(result)=>{
												const session=JSON.parse(result.body);
												if (session.error){
													res.json({success:0,error:session.error,data:null});
												} else{
													// Save current device used in this session
													kai.updateSessionAsync(session.objectId,{deviceToken:deviceToken}).then(
														(result)=>res.json({success:1,error:null,data:data}),
														(error)=>res.json({success:0,error:error,data:null}));
												}
											},
											(error)=>res.json({success:0,error:error,data:null}));
									},
									(error)=>res.json({success:0,error:error,data:null}));
							}
						});
					}
				}
			},
			(error)=>res.json({success:0,error:error,data:null}));
	});

	/*
	- Description:
		Sign in Gcall account. Upon signing in, user will subscribe to topic of all groups
		they work for using Amazon SNS so that they can receive calls and notifications
		Device's data is stored in Session and Agent_Group tables
	- Request:
	{
		email
		password
		deviceType: Android or iOS device
		deviceToken: Device token used for this application
		voipToken: Device's VoIP token
	}
	- Response:
	{
		success
		error
		data: An object containing
			+ sessionToken: Parse's user session
			+ fullname
			+ email
			+ phone
	}
	*/

	app.post('/api/signin',function(req,res){
		var kaiseki=require('../config/parse-config');
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.loginUserAsync(req.body.email,req.body.password).then(
			(result)=>{
				const user=JSON.parse(result.body);
				if (user.error){
					res.json({success:0,error:user.error,data:null});
				} else{
					const sessionToken=user.sessionToken;
					const app=req.body.deviceType=='android' ? AppArn.gcm : AppArn.apns;
					// Create a application endpoint in Amazon application
					var params={
						PlatformApplicationArn:app,
						Token:req.body.voipToken
					};
					sns.createPlatformEndpointAsync(params).then(
						(result)=>{
							const arn=result.EndpointArn;
							var subscriptions=[];
							// Get all groups they work for
							agentRepo.getGroupsByAgent(user.email,true).then(
								(result)=>{
									Promise.map(result,(agent)=>{
										return new Promise((resolve,reject)=>{
											// Subscribe each of them
											params={
												Protocol:'application',
												TopicArn:agent.topic,
												Endpoint:arn
											};
											sns.subscribeAsync(params).then(
												(result)=>resolve(result),
												(error)=>reject(error.message));
										}).then(
											(result)=>{
												var subs=agent.subscriptions || [];
												const sub={
													deviceType:req.body.deviceType,
													arn:result.SubscriptionArn
												};
												subscriptions.push(sub);
												subs.push(sub);
												return agentRepo.updateAgent(agent.objectId,{subscriptions:subs});
											},
											(error)=>(error));
									}).then(
										(result)=>{
											kai.sessionToken=sessionToken;
											kai.getCurrentSessionAsync().then(
												(result)=>{
													const session=JSON.parse(result.body);
													const data={
														subscriptions:subscriptions,
														deviceToken:{
															type:req.body.deviceType,
															token:req.body.deviceToken
														}
													};
													// Save current device used in this session
													kai.updateSessionAsync(session.objectId,data).then(
														(result)=>{
															const data={
																sessionToken:sessionToken,
																fullname:user.fullname,
																email:user.email,
																phone:user.phone
															};
															var deviceToken=user.deviceToken || [];
															const tokens=deviceToken.map((deviceToken)=>(deviceToken.token));
															if (tokens.indexOf(req.body.deviceToken)==-1){
																deviceToken.push({
																	type:req.body.deviceType,
																	token:req.body.deviceToken
																});
																// Update devices of this user
																userRepo.updateUser(user.objectId,{deviceToken:deviceToken}).then(
																	(result)=>res.json({success:1,error:null,data:data}),
																	(error)=>res.json({success:0,error:error,data:null}));
															} else{
																res.json({success:1,error:null,data:data});
															}
														},
														(error)=>res.json({success:0,error:error,data:null}));
												},
												(error)=>res.json({success:0,error:error,data:null}));
										},
										(error)=>res.json({success:0,error:error,data:null}));
								},
								(error)=>res.json({success:0,error:error,data:null}));
						},
						(error)=>res.json({success:0,error:error.message,data:null}));
				}
			},
			(error)=>res.json({success:0,error:error,data:null}));
	});

	/*
	- Description:
		Sign out from Gcall app. Before signing out, user will unsubscribe all topics
		so that they won't receive any calls or notifications
		Subscription data in this session is also deleted from table Agent_Group
	- Request:
	{
		sessionToken: Parse's user session
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/signout',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentSessionAsync().then(
			(result)=>{
				const session=JSON.parse(result.body);
				if (session.error){
					res.json({success:0,error:session.error});
				} else{
					var all=[];
					// Unsubscribe all
					Promise.map(session.subscriptions || [],(subscription)=>{
						return new Promise((resolve,reject)=>{
							const params={
								SubscriptionArn:subscription.arn
							};
							sns.unsubscribeAsync(params).then(
								(result)=>resolve(result),
								(error)=>reject(error.message));
						}).then(
							(result)=>all.push(subscription),
							(error)=>(error));
					}).then(
						(result)=>{
							const params={
								where:{
									subscriptions:{$in:all}
								}
							};
							// Remove subscriptions
							kai.getObjectsAsync('Agent_Group',params).then(
								(result)=>{
									const body=JSON.parse(result.body);
									if (body.error){
										res.json({success:0,error:body.error});
									} else{
										var updates=[];
										body.results.map((agent)=>{
											var update={};
											update.objectId=agent.objectId;
											update.data={};
											update.data.subscriptions=[];
											var typeList=[];
											var arnList=[];
											agent.subscriptions.map((sub)=>{
												typeList.push(sub.deviceType);
												arnList.push(sub.arn);
											});
											all.map((item)=>{
												const i=arnList.indexOf(item.arn);
												if (i>=0 && typeList[i]==item.deviceType){
													arnList.splice(i,1);
													typeList.splice(i,1);
												}
											});
											arnList.map((arn,i)=>{
												update.data.subscriptions.push({
													deviceType:typeList[i],
													arn:arn
												});
											});
											updates.push(update);
										});
										Promise.map(updates,(update)=>agentRepo.updateAgent(update.objectId,update.data)).then(
											(result)=>{
												kai.getCurrentUserAsync().then(
													(result)=>{
														const body=JSON.parse(result.body);
														if (body.error){
															res.json({success:0,error:body.error});
														} else{
															var devices=body.deviceToken || [];
															const tokens=devices.map((device)=>(device.token));
															const i=tokens.indexOf(session.deviceToken.token);
															if (i>=0 && devices[i].type==session.deviceToken.type){
																devices.splice(i,1);
																userRepo.updateUser(body.objectId,{deviceToken:devices}).then(
																	(result)=>{
																		kai.logoutUserAsync().then(
																			(result)=>res.json({success:1,error:null}),
																			(error)=>res.json({success:0,error:error}));
																	},
																	(error)=>res.json({success:0,error:error}));
															} else{
																res.json({success:0,error:'Invalid deviceToken'});
															}
														}
													},
													(error)=>res.json({success:0,error:error}));
											},
											(error)=>res.json({success:0,error:error}));
									}
								},
								(error)=>res.json({success:0,error:error}));
						},
						(error)=>res.json({success:0,error:error}));
				}
			},
			(error)=>res.json({success:0,error:error}));
	});

	/*
	- Description:
		Get a list of hotlines that user manages
	- Request:
	{
		sessionToken: Parse's user session
	}
	- Response:
	{
		data: An array of object, each contains:
			+ hotline
			+ has: Child elements in this hotline (agents or subgroups)
			+ length: Number of child elements
			+ pricing
		error
	}
	*/

	app.post('/api/manage',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:[],error:body.error});
				} else{
					if (body.hasGroups){
						var data=[];
						Promise.each(body.hasGroups,(group)=>{
							return groupRepo.getDetailedGroup(group).then(
								(result)=>{
									const hotline={
										hotline:group,
										pricing:result.pricing,
										has:result.type,
										length:result.data.length
									};
									data.push(hotline);
								},
								(error)=>(error));
						}).then(
							(result)=>res.json({data:data,error:null}),
							(error)=>res.json({data:[],error:error}));
					} else{
						res.json({data:[],error:null});
					}
				}
			},
			(error)=>res.json({data:[],error:error}));
	});

	/*
	- Description:
		Get a list of groups user works for
	- Request:
	{
		sessionToken: Parse's user session
	}
	- Response:
	{
		data: An array of object, each contains:
			+ groupId
			+ name: Name of group
			+ description
			+ hotline
			+ has
			+ length: Number of agents work for this group
			+ pricing
		error
	}
	*/

	app.post('/api/agent',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:[],error:body.error});
				} else{
					agentRepo.getGroupsByAgent(body.email,true).then(
						(result)=>{
							var data=[];
							Promise.each(result,(group)=>{
								return groupRepo.getDetailedGroup(group.groupId).then(
									(result)=>{
										const item={
											groupId:group.groupId,
											name:result.name || group.groupId,
											description:result.description || '',
											hotline:result.hotline,
											pricing:result.pricing,
											has:result.type,
											length:result.data.length
										};
										data.push(item);
									},
									(error)=>(error));
							}).then(
								(result)=>res.json({data:data,error:null}),
								(error)=>res.json({data:[],error:error}));
						},
						(error)=>res.json({data:[],error:error}));
				}
			},
			(error)=>res.json({data:[],error:error}));
	});

	/*
	- Description:
		Get a list of pending invitations. If that user accepts an invitation,
		they will become an agent of that group
	- Request:
	{
		sessionToken: Parse's user session
	}
	- Response:
	{
		data: An array of object, each contains:
			+ groupId
			+ groupName
			+ description
			+ hotline
			+ addedBy: Name of the group master
		error
	}
	*/

	app.post('/api/notifications',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:[],error:body.error});
				} else{
					agentRepo.getGroupsByAgent(body.email,false).then(
						(result)=>{
							const data=result.map((notification)=>({
								groupId:notification.groupId,
								groupName:notification.groupName || notification.groupId,
								hotline:notification.hotline,
								addedBy:notification.addedBy
							}));
							res.json({data:data,error:null});
						},
						(error)=>res.json({data:[],error:error}));
				}
			},
			(error)=>res.json({data:[],error:error}));
	});

	/*
	- Description:
		Change password. Another signing in is used to verify if password is true,
		then that session is deleted immediately
	- Request:
	{
		sessionToken: Parse's user session
		oldpass: Current password
		newpass: New password
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/password/change',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({success:0,error:body.error});
				} else{
					// Create a temporary session to make sure old password is true
					kai.loginUserAsync(body.email,req.body.oldpass).then(
						(result)=>{
							const body=JSON.parse(result.body);
							if (body.error){
								res.json({success:0,error:body.error});
							} else{
								kai.sessionToken=body.sessionToken;
								kai.updateUserAsync(body.objectId,{password:req.body.newpass}).then(
									(result)=>{
										// Log out of temporary session
										kai.logoutUserAsync().then(
											(result)=>res.json({success:1,error:null}),
											(error)=>res.json({success:0,error:error}));
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
		Get a list of unsolved calls in groups they manage, regardless of
		their solving status
	- Request:
	{
		sessionToken: Parse's user session
	}
	- Response:
	{
		data: An array of object, each contains:
			+ objectId: ID of an unsolved call
			+ caller
			+ groupId
			+ hotline
			+ groupName
			+ gap: Text indicating time gaps between its creation and current time
			+ solvedBy: The agent that took over the unsolved call (if any)
				email
				fullname
				phone
		error
	}
	*/

	app.post('/api/unsolved/manage',isAuthenticated,function(req,res){
		const now=Date.now();
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:[],error:body.error});
				} else{
					// Master can see all unsolved calls and agents taking over them (if any)
					unsolvedRepo.getUnsolvedByMaster(body.email).then(
						(result)=>{
							const logs=result.map((log)=>{
								const at=Date.parse(log.createdAt);
								const gap=util.showGap(at,now);
								return {
									objectId:log.objectId,
									caller:log.caller,
									groupId:log.groupId,
									hotline:log.hotline,
									groupName:log.groupName,
									gap:gap,
									solvedBy:log.solvedBy
								};
							});
							res.json({data:logs,error:null});
						},
						(error)=>res.json({data:[],error:error}));
				}
			},
			(error)=>res.json({data:[],error:error}));
	});

	/*
	- Description:
		Get a list of unsolved calls in groups they work for that has not been
		solved yet
	- Request:
	{
		sessionToken: Parse's user session
	}
	- Response:
	{
		data: An array of object, each contains:
			+ objectId: ID of an unsolved call
			+ caller
			+ groupId
			+ hotline
			+ groupName
			+ gap: Text indicating time gaps between its creation and current time
		error
	}
	*/

	app.post('/api/unsolved/agent',isAuthenticated,function(req,res){
		const now=Date.now();
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:[],error:body.error});
				} else{
					agentRepo.getGroupsByAgent(body.email,true).then(
						(result)=>{
							const groups=result.map((agent)=>(agent.groupId));
							// Agent can only see not solved yet calls
							unsolvedRepo.getUnsolvedByGroups(groups).then(
								(result)=>{
									const logs=result.map((log)=>{
										const at=Date.parse(log.createdAt);
										const gap=util.showGap(at,now);
										return {
											objectId:log.objectId,
											caller:log.caller,
											groupId:log.groupId,
											hotline:log.hotline,
											groupName:log.groupName,
											gap:gap
										};
									});
									res.json({data:logs,error:null});
								},
								(error)=>res.json({data:[],error:error}));
						},
						(error)=>res.json({data:[],error:error}));
				}
			},
			(error)=>res.json({data:[],error:error}));
	});

	/*
	- Description:
		Get a list of unsolved calls by a hotline that user manages
	- Request:
	{
		sessionToken: Parse's user session
		hotline
	}
	- Response:
	{
		data: An array of object, each contains:
			+ objectId: ID of an unsolved call
			+ caller
			+ groupId
			+ groupName
			+ gap: Text indicating time gaps between its creation and current time
			+ solvedBy: The agent that took over the unsolved call (if any)
				email
				fullname
				phone
		error
	}
	*/

	app.post('/api/unsolved/:hotline',isAuthenticated,function(req,res){
		const now=Date.now();
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:[],error:body.error});
				} else{
					if (body.hasGroups.indexOf(req.params.hotline)==-1){
						res.json({data:[],error:'You do not own this hotline'});
					} else{
						// Master can see all unsolved calls in hotline regardless of their status
						unsolvedRepo.getUnsolvedByHotline(req.params.hotline).then(
							(result)=>{
								const logs=result.map((log)=>{
									const at=Date.parse(log.createdAt);
									const gap=util.showGap(at,now);
									return {
										objectId:log.objectId,
										caller:log.caller,
										groupId:log.groupId,
										groupName:log.groupName,
										gap:gap,
										solvedBy:log.solvedBy
									};
								});
								res.json({data:logs,error:null});
							},
							(error)=>res.json({data:[],error:error}));
					}
				}
			},
			(error)=>res.json({data:[],error:error}));
	});

	/*
	- Description:
		Take over an unsolved call. Unsolved call will get updated in database
	- Request:
	{
		sessionToken: Parse's user session
		objectId: ID of the unsolved call
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/solve',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({success:0,error:body.error});
				} else{
					unsolvedRepo.getUnsolved(req.body.objectId).then(
						(result)=>{
							if (result.solvedBy){
								// Call is already taken over
								res.json({success:0,error:'This call is already solved'});
							} else{
								// Solve a call
								const solvedBy={
									email:body.email,
									fullname:body.fullname,
									phone:body.phone
								};
								unsolvedRepo.solve(req.body.objectId,solvedBy).then(
									(result)=>res.json({success:1,error:null}),
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
		Accept or reject an invitation to work for a group. If that user accepts, they will
		subscribe to that group's topic to receive calls and notifications. Subscription
		data is also stored in session
	- Request:
	{
		sessionToken: Parse's user session
		accept: Value of 1 or 0
		deviceType: Android or iOS device
		voipToken: Device's VoIP token
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/:group/respond',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const user=JSON.parse(result.body);
				if (user.error){
					res.json({success:0,error:error});
				} else{
					const data={
						groupId:req.params.group,
						email:user.email
					};
					agentRepo.getAgent(data).then(
						(result)=>{
							const agent=result;
							if (agent.accepted){
								res.json({success:0,error:'You are already in this group'});
							} else{
								if (req.body.accept==1){
									const app=req.body.deviceType=='android' ?
										AppArn.gcm : AppArn.apns;
									var params={
										PlatformApplicationArn:app,
										Token:req.body.voipToken
									};
									// Create an endpoint to subscribe
									sns.createPlatformEndpointAsync(params).then(
										(result)=>{
											params={
												Protocol:'application',
												TopicArn:agent.topic,
												Endpoint:result.EndpointArn
											};
											sns.subscribeAsync(params).then(
												(result)=>{
													const arn=result.SubscriptionArn;
													kai.getCurrentSessionAsync().then(
														(result)=>{
															const session=JSON.parse(result.body);
															var subscriptions=session.subscriptions || [];
															subscriptions.push({
																deviceType:req.body.deviceType,
																arn:arn
															});
															// Update subscriptions of this session
															kai.updateSessionAsync(session.objectId,{subscriptions:subscriptions}).then(
																(result)=>{
																	var subs=agent.subscriptions || [];
																	const sub={
																		deviceType:req.body.deviceType,
																		arn:arn
																	};
																	subs.push(sub);
																	// Update subscriptions of this agent
																	agentRepo.updateAgent(agent.objectId,{accepted:true,subscriptions:subs}).then(
																		(result)=>res.json({success:1,error:null}),
																		(error)=>res.json({success:0,error:error}));
																},
																(error)=>res.json({success:0,error:error}));
														},
														(error)=>res.json({success:0,error:error}));
												},
												(error)=>res.json({success:0,error:error.message}));
										},
										(error)=>res.json({success:0,error:error.message}));
								} else{
									// Reject invitation, agent will be deleted
									agentRepo.deleteAgent(agent.objectId).then(
										(result)=>res.json({success:1,error:null}),
										(error)=>res.json({success:0,error:error}));
								}
							}
						},
						(error)=>res.json({success:0,error:error}));
				}
			},
			(error)=>res.json({success:0,error:error}));
	});
};