// This module consists of function checking if a user is currently logging in or not

'use strict';

module.exports=function(req,res,next){
	if (req.body.sessionToken){
		next();
	} else{
		res.json({error:'You are not authenticated'});
	}
};