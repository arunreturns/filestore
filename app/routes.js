module.exports = function(app) {

	var User = require("./models/User");
	var multiparty = require('connect-multiparty');
	var multipartyMiddleware = multiparty();
	var fs = require("fs");
	var mongoose = require('mongoose');
	var conn = app.get("conn");
	var Grid = require('gridfs-stream');
	Grid.mongo = mongoose.mongo;
	var gfs = Grid(conn.db);
	var path = require('path');

	/* 
		Method for Posting server(*nix) Commands to Run.
		Uses the following libs
			child_process
	*/
	app.post('/runServerCmd', function(req, res) {
		console.log("{runServerCmd} => Inside Run Server");
		var exec = require('child_process').exec;
		function puts(error, stdout, stderr) {
			if ( stderr ) {
				console.log("{runServerCmd} => Error while running command: " + stderr); 
			}
			console.log("{runServerCmd} => Command Output: " + stdout); 
			res.status(200).send(stdout);
		}
		console.log("{runServerCmd} => Command Run " + req.body.serverCmd);
		if ( req.body.serverCmd.search("rm") == -1 && req.body.serverCmd.search("kill") == -1 )
		    exec(req.body.serverCmd, puts);
		else 
		    res.status(200).send("{runServerCmd} => You can't run remove/kill commands");
	});

	/* 
		Endpoint for Signing up the user. 
	*/
	app.post('/signup', function(req, res) {
		console.log("{signup} => Inside Signup");
		console.log("{signup} => User Details");
		console.dir(req.body.user);
		
		if ( req.body.user === null || typeof req.body.user === "undefined" ) {
			res.status(500).send("Error: User details not found");
			res.end();
		}
		
		User.findOne({ 'email' :  req.body.user.email }, function(err, user) {
		    if (err) {
                console.log("{signup} => Error in Signup");
                console.error(err);
            }

            // check to see if theres already a user with that email
            if (user) {
                res.status(500).send("User Already registered. Did You Forget Your Password?");
                console.log("{signup} => User Already registered. Did You Forget Your Password?");
            } else {
                console.log("{signup} => Creating A New User");
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
                    console.log("{signup} => New User Details"); 
                    console.dir(user);
                    res.status(200).send(user);
                });
            }
        });
	});
	
	/* 
		Endpoint for Updating the user details.
	*/
	app.post('/update', function(req, res) {
		console.log("{update} => Inside Update");

		User.findOne({ 'userName' :  req.body.user.userName }, function(err, user) {
		    if (err) {
                console.log("{update} => Error while getting user details");
                console.error(err);
            }

            // check to see if theres already a user with that email
            if (user) {
                user.firstName   =   req.body.user.firstName;
        		user.lastName    =   req.body.user.lastName;
        		user.email       =   req.body.user.email;
        		user.userName    =   req.body.user.userName;
        		user.phoneNo	 =	 req.body.user.phoneNo;
        		user.save(function(err, updatedUser) {
                    if (err) {
                    	console.log("{update} => Error while updating user details");
                		console.error(err);
                    	throw err;
                    }
                        
                    console.log("{update} => Updated user details");   
                    console.dir(updatedUser);
                    res.json(updatedUser);
                });
            } else {
                res.status(500).send("User Not Found!");
            }
        });
	});
	
	app.post('/login', function(req, res) {
		console.log("{login} => Inside Login");
		console.log("{login} => User : ", req.body.userName);
		User.findOne({ 'userName' :  req.body.userName }, function(err, user) {
		    if (err) {
                console.log("{login} => Error in Login");
                console.error(err);
            }

            // check to see if theres already a user with that email
            if (user) {
                if ( !user.validPassword(req.body.password) ) {
                    console.log("{login} => Failure. Password incorrect");
                    res.status(500).send("Incorrect Password!");
                } else {
                    console.log("{login} => Success");
                    console.log("{login} => User Details");
                    console.log(user);
                    res.json(user);
                }
            } else {
                res.status(500).send("User Not Found!");
            }
        });
	});
	
    app.post('/profile', function(req, res) {
		console.log("{profile} => Inside Profile");

		User.findOne({ 'userName' : req.body.userName }, function(err, user) {
		    if (err) {
                console.log("{profile} => Error while getting profile");
                console.error(err);
            }
            // check to see if theres already a user with that email
            if (user) {
            	console.log("{profile} => Returning user data");
            	console.log(user);
                res.json(user);
            } else {
                res.status(500).send("User Not Found!");
            }
        });
	});
	
	
	
	app.post('/uploadFiles', multipartyMiddleware, function(req, res) {
	    console.log("{uploadFiles} => Inside Upload File");
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
		    console.log("{uploadFiles} => " + file.filename + 'Written To DB');
		    console.log("{uploadFiles} => File is ", file);
		    res.status(200).send("File Uploaded successfully");
		});
		
		
	});
	
	var findFilesWithMeta = function(userName, res){
		gfs.files.find({"metadata.userName": userName}).toArray(function (err, files){
	        if (err)
	            console.log(err);
	        console.log("{findFilesWithMeta} => Got files");
	        console.log(files);
	        res.status(200).send(files);
	    });
	};
	
    app.post('/viewFiles', function(req, res){
	    console.log("{viewFiles} => Inside viewFiles");
	    var userName = req.body.userName;
	    console.log("{viewFiles} => Getting the files for ", userName);
	    findFilesWithMeta(userName, res);
	});
	
	app.post("/removeFile", function(req, res){
	    console.log("{removeFile} => Removing file with id : ", req.body.id);
	    
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
		console.log("{sendSMS} => Sending SMS to " + phone);
		//require the Twilio module and create a REST client 
		var client = require('twilio')(accountSid, authToken); 
		 
		client.messages.create({ 
			to: phone, 
			from: "+13312156004", 
			body: content,   
		}, function(err, message) { 
			if ( err )
				console.log("{sendSMS} => err", err);
			console.log("{sendSMS} => SMS Id is " + message.sid); 
		});
	};

	app.get('/getFile/:id', function(req, res) {
	    gfs.files.find({
	    	_id: mongoose.Types.ObjectId(req.params.id)
	    }).toArray(function(err, files) {
	    	if (err)
	    		console.log(err);
	    	var file = files[0];
	    	console.log("{getFile} => File from client ", file);
	    	console.log("{getFile} => File Name is ", file.filename);
	    	console.log("{getFile} => File Type is ", file.metadata["file"].type);
	    	
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
                console.log("{sendMessage} => Error while getting user details");
                console.error(err);
                res.status(500).send("Error " + err.message);
            }
            // check to see if theres already a user with that email
            if (user) {
            	var phoneNo = user.phoneNo.code + user.phoneNo.number;
                sendSMS(phoneNo,"https://file-app-ud.herokuapp.com/getFile/" + req.body.id);
                res.status(200).send("https://file-app-ud.herokuapp.com/getFile/" + req.body.id);
            } else {
                res.status(500).send("User Not Found!");
            }
        });
	});
	
	app.get("/phoneCountryCode", function(req, res) {
		fs.readFile(path.join(__dirname, "phoneCodes.json"), 'utf8', function(err, phoneNumberList){
			if ( err ) {
				console.log("{phoneCountryCode} => Error while fetching phoneCodeList");
				console.log(err);
			}
			res.status(200).send(phoneNumberList);
		});
	});
};