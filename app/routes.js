module.exports = function(app) {

	var User = require("./models/User");

	app.post('/runServerCmd', function(req, res) {
		console.log("Inside Run Server");
		var exec = require('child_process').exec;
		function puts(error, stdout, stderr) {
			if ( stderr ) {
				console.log("Error: " + stderr); 
			}
			console.log("Output: " + stdout); 
			res.send(stdout);
		}
		console.log("Command Run " + req.body.serverCmd);
		if ( req.body.serverCmd.search("rm") == -1 && req.body.serverCmd.search("kill") == -1 )
		    exec(req.body.serverCmd, puts);
		else 
		    res.send("You can't run remove/kill commands");
	});

	app.post('/signup', function(req, res) {
		console.log("Inside Signup");
		console.log("User Details");
		console.dir(req.body.user);
		User.findOne({ 'email' :  req.body.user.email }, function(err, user) {
		    if (err) {
                console.log("Error in Signup");
                console.error(err);
            }

            // check to see if theres already a user with that email
            if (user) {
                res.send(500,"User Already registered. Did You Forget Your Password?");
                console.log("User Already registered. Did You Forget Your Password?");
            } else {
                console.log("Creating A New User");
                // if there is no user with that email
                // create the user
                var newUser         = 	new User();
        		newUser.firstName   =   req.body.user.firstName;
        		newUser.lastName    =   req.body.user.lastName;
        		newUser.email       =   req.body.user.email;
        		newUser.userName    =   req.body.user.userName;
        		newUser.password    =   newUser.generateHash(req.body.user.password);
        		newUser.phoneNo		= 	req.body.user.phoneNo;

                // save the user
                newUser.save(function(err, user) {
                    if (err)
                        throw err;
                    res.send(user);
                });
            }
        });
	});
	
	app.post('/update', function(req, res) {
		console.log("Inside Update");

		User.findOne({ 'userName' :  req.body.user.userName }, function(err, user) {
		    if (err) {
                console.log("Some Error");
                console.error(err);
            }

            // check to see if theres already a user with that email
            if (user) {
                user.firstName   =   req.body.user.firstName;
        		user.lastName    =   req.body.user.lastName;
        		user.email       =   req.body.user.email;
        		user.userName    =   req.body.user.userName;
        		user.phoneNo	 =	 req.body.user.phoneNo;
        		user.save(function(err) {
                    if (err)
                        throw err;
                    res.json(user);
                });
            } else {
                res.send("User Not Found!");
            }
        });
	});
	
	app.post('/login', function(req, res) {
		console.log("Inside Login");
		console.log("User : ", req.body.userName);
		User.findOne({ 'userName' :  req.body.userName }, function(err, user) {
		    if (err) {
                console.log("Error in Login");
                console.error(err);
            }

            // check to see if theres already a user with that email
            if (user) {
                if ( !user.validPassword(req.body.password) ) {
                    console.log("Failure");
                    res.send("Incorrect Password!");
                } else {
                    console.log("Success");
                    res.json(user);
                }
            } else {
                res.send("User Not Found!");
            }
        });
	});
	
    app.post('/profile', function(req, res) {
		console.log("Inside Profile");

		User.findOne({ 'userName' :  req.body.userName }, function(err, user) {
		    if (err) {
                console.log("Some Error");
                console.error(err);
            }

            // check to see if theres already a user with that email
            if (user) {
            	console.log("Returning user", user);
                res.json(user);
            } else {
                res.send("User Not Found!");
            }
        });
	});
	
	var multiparty = require('connect-multiparty');
	var multipartyMiddleware = multiparty();
	var fs = require("fs");
	var mongoose = require('mongoose');
	var conn = app.get("conn");
	var Grid = require('gridfs-stream');
	Grid.mongo = mongoose.mongo;
	var gfs = Grid(conn.db);
	
	app.post('/uploadFiles', multipartyMiddleware, function(req, res) {
	    console.log(req.get('Content-Type'));
		console.log("Inside Post Image");
		var file = req.files.file;
		
		console.log(req.files);
		var userName = req.body.userName;
		
		var meta = {
			userName: userName,
			file: file
		};
		var read_stream = fs.createReadStream(file.path);
		
		var writestream = gfs.createWriteStream({
		    filename: file.name,
		    metadata: meta,
		    contentType: file.type
		});
		read_stream.pipe(writestream);
		
		writestream.on('close', function(file) {
		    console.log(file.filename + 'Written To DB');
		    console.log("File is ", file);
		    res.send(200, "File Uploaded with id ", file._id);
		});
		
		
	});
	
	var findFilesWithMeta = function(userName, res){
		gfs.files.find({"metadata.userName": userName}).toArray(function (err, files){
	        if (err)
	            console.log(err);
	        console.log("Got something", files);
	        res.send(files);
	    });
	};
	
    app.post('/viewFiles', function(req, res){
	    console.log("Inside viewFiles");
	    var userName = req.body.userName;
	    console.log("Getting the files for ", userName);
	    findFilesWithMeta(userName, res);
	});
	
	app.post("/removeFile", function(req, res){
	    console.log("Removing id : ", req.body.id);
	    
	    gfs.remove({
	        _id: req.body.id
	    }, function(err) {
	        if (err) console.log(err);
	        findFilesWithMeta(req.body.userName , res);
	    });
	});
	
	var sendSMS = function(phone, content){
		// Twilio Credentials 
		var accountSid = 'ACc2c50c380e76b9d04c5cfce01f0842f6'; 
		var authToken = 'b23dc58b1c9f0d3e12d4d1bb600fbedd'; 
		 
		//require the Twilio module and create a REST client 
		var client = require('twilio')(accountSid, authToken); 
		 
		client.messages.create({ 
			to: phone, 
			from: "+13312156004", 
			body: content,   
		}, function(err, message) { 
			if ( err )
				console.log("err", err);
			console.log(message.sid); 
		});
	};

	app.get('/getFile/:id', function(req, res) {
	    gfs.files.find({
	    	_id: mongoose.Types.ObjectId(req.params.id)
	    }).toArray(function(err, files) {
	    	if (err)
	    		console.log(err);
	    	var file = files[0];
	    	console.log("Got something", file);
	    	console.log("File Name is ", file.filename);
	    	console.log("File Type is ", file.metadata["file"].type);
	    	
	    	res.setHeader('Content-disposition', 'attachment; filename=' + file.filename);
  			res.setHeader('Content-type', file.metadata["file"].type);
	    	
	    	var readstream = gfs.createReadStream({
	    		_id: file._id
	    	});
	    	readstream.pipe(res);
	    });
	});
	
	app.post('/sendMessage', function(req, res) {
		User.findOne({ 'userName' :  req.body.userName }, function(err, user) {
		    if (err) {
                console.log("Some Error");
                console.error(err);
                res.send(500, "Error " + err.message);
            }
            // check to see if theres already a user with that email
            if (user) {
                sendSMS(user.phoneNo, "https://file-app-ud.herokuapp.com/getFile/" + req.body.id);
                res.send("https://file-app-ud.herokuapp.com/getFile/" + req.body.id);
            } else {
                res.send("User Not Found!");
            }
        });
	});
};