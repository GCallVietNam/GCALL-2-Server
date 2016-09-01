// This module consists of route handlers revolving around Calllog

const isAuthenticated=require('./isAuthenticated');

const twilio=require('twilio');

const Promise=require('bluebird');

const userRepo=require('../model/user');
const groupRepo=require('../model/group');
const agentRepo=require('../model/agent');
const calllogRepo=require('../model/calllog');

const util=require('../lib/util');

module.exports=function(app){
	'use strict';

	/*
	- Description:
		When agent using app receives a call, a request will be sent to this route
		to store a call created by Twilio
	- Request:
	{
		sessionToken: Parse's user session
		callSid
		accountSid
		authToken
		groupId
	}
	- Response:
	{
		success
		error
	}
	*/

	app.post('/api/calllogs/create',isAuthenticated,function(req,res){
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		if (!req.body.callSid || !req.body.accountSid ||
			!req.body.authToken || !req.body.groupId)
		{
			res.json({success:0,error:'Missing required fields'});
			return;
		}
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({success:0,error:body.error});
				} else{
					calllogRepo.getCalllog(req.body.callSid).then(
						(result)=>{
							if (result){
								res.json({success:0,error:'This call is already stored'});
							} else{
								var groupId=req.body.groupId;
								if (groupId.indexOf('+')<0){
									groupId='+'+groupId.trim();
								}
								const agent={
									email:body.email,
									groupId:groupId
								};
								groupRepo.getDetailedGroup(groupId).then(
									(result)=>{
										const log={
											callSid:req.body.callSid,
											accountSid:req.body.accountSid,
											authToken:req.body.authToken,
											email:body.email,
											groupId:groupId,
											groupName:result.name || result.hotline,
											hotline:result.hotline
										};
										calllogRepo.createCalllog(log).then(
											(result)=>{
												res.json({success:1,error:null});
												agentRepo.getAgent(agent).then(
													(result)=>{
														const now=new Date(Date.now());
														const id=result.objectId;
														agentRepo.updateAgent(
															id,{lastActive:now});
													});
											},
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
		Mobile app sends request to this route to fetch a list of their calllogs
		Calllogs are paginated, each page contains 15 records at most
	- Request:
	{
		sessionToken: Indicating Parse's user session
		skip: Indicating how many records have been fetched before, divisible by 15
	}
	- Response:
	{
		data: An array of object, each contains:
			groupName
			groupId
			gap: Indicating how long ago this call was made
			duration
			from: Caller's phone number
			status
		error
	}
	*/

	app.post('/api/calllogs/list',isAuthenticated,function(req,res){
		const now=Date.now();
		var kaiseki=require('../config/parse-config');
		kaiseki.sessionToken=req.body.sessionToken;
		const kai=require('../lib/kaiseki-promise')(kaiseki);
		kai.getCurrentUserAsync().then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					res.json({data:[],hasNext:false,error:body.error});
				} else{
					const limit=15;
					const skip=req.body.skip || 0;
					calllogRepo.getCalllogsByEmail(body.email,limit+1,skip).then(
						(result)=>{
							var logs=[];
							var list=result;
							var hasNext=false;
							if (list.length==limit+1){
								hasNext=true;
								list.splice(limit,1);
							}
							Promise.map(list,(log)=>{
								const twilio=require('../lib/twilio-promise');
								const client=twilio(log.accountSid,log.authToken);
								return client.calls(log.callSid).get().then(
									(result)=>{
										const at=Date.parse(result.dateCreated);
										const gap=util.showGap(at,now);
										const d=util.secToMin(Number(result.duration));
										const item={
											at:at,
											gap:gap,
											duration:d,
											from:result.fromFormatted,
											status:result.status,
											groupId:log.groupId,
											groupName:log.groupName
										};
										logs.push(item);
									},
									(error)=>(error));
							}).then(
								(result)=>{
									logs=util.sortLogs(logs,0,logs.length-1);
									res.json({data:logs,hasNext:hasNext,error:null});
								},
								(error)=>res.json({data:[],hasNext:false,error:error}));
						},
						(error)=>res.json({data:[],hasNext:false,error:error}));
				}
			},
			(error)=>res.json({data:[],hasNext:false,error:error}));
	});
}