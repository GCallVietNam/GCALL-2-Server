const csv=require('csv-parser');
const fs=require('fs');
const jsonfile=require('jsonfile');

var list=[];

fs.createReadStream('international-phone-number-rates.csv')
	.pipe(csv())
	.on('data',function(data){
		list.push(data);
	})
	.on('end',function(){
		jsonfile.writeFileSync('country-list.json',list,{spaces:4});
	});
