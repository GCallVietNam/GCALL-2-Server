/*
This class consists of data manipulation in table User
User's fields:
- objectId:
	Unique ID of this record auto-generated by Parse
- username:
	Unique username
- email:
	User's email, equal to username
- password:
	User's password, which is hidden
- fullname:
	Full name of user
- phone:
	Unique phone number of user
- hasGroups:
	Array of hotlines this user currently owns
- deviceToken:
	Array of devices this user is currently logging in
	Each contains:
	+ type: Android or iOS device
	+ token: Device token used for this application
*/

'use strict';

const kaiseki=require('../config/parse-config');
const kai=require('../lib/kaiseki-promise')(kaiseki);
const Promise=require('bluebird');

// Register a new user

module.exports.createUser=function(data){
	return new Promise((resolve,reject)=>{
		kai.createUserAsync(data).then(
			(result)=>{
				if (result.body.error){
					reject(result.body.error);
				} else{
					resolve(result.body);
				}
			},
			(error)=>reject(error));
	});
}

// Update a user

module.exports.updateUser=function(objectId,data){
	return new Promise((resolve,reject)=>{
		kai.updateUserAsync(objectId,data).then(
			(result)=>{
				if (result.body.error){
					reject(result.body.error);
				} else{
					resolve(result.body);
				}
			},
			(error)=>reject(error));
	});
}

// Get a user by their email

module.exports.getUsersByEmail=function(email){
	return new Promise((resolve,reject)=>{
		const params={
			where:{email:email}
		};
		kai.getUsersAsync(params).then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					reject(body.error);
				} else{
					if (body.results.length>0){
						resolve(body.results[0]);
					} else{
						reject('User does not exist');
					}
				}
			},
			(error)=>reject(error));
	});
}

// Get a user by the group they own

module.exports.getUsersByGroup=function(group){
	return new Promise((resolve,reject)=>{
		const params={
			where:{hasGroups:{$in:group.split(',')}}
		};
		kai.getUsersAsync(params).then(
			(result)=>{
				const body=JSON.parse(result.body);
				if (body.error){
					reject(body.error);
				} else{
					if (body.results.length>0){
						resolve(body.results[0]);
					} else{
						reject('Group does not exist');
					}
				}
			},
			(error)=>reject(error));
	});
}