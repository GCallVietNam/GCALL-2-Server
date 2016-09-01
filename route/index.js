// This module consists of route handling request to index view

module.exports=function(app){
	'use strict';

	app.get('/',function(req,res){
		res.render('home');
	});
};