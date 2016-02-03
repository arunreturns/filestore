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
	
	var nodemailer = require('nodemailer');
	var sgTransport = require('nodemailer-sendgrid-transport');

	// api key https://sendgrid.com/docs/Classroom/Send/api_keys.html
	var options = {
	    auth: {
	        api_key: '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'
	    }
	};

	var mailer = nodemailer.createTransport(sgTransport(options));

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
				saveUser("signup", newUser, res);
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
        		saveUser("update", user, res);
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
	
	function saveUser(methodName, user, res){
		user.save(function(err, updatedUser) {
            if (err) {
            	console.log("{"+methodName+"} => Error while updating user details");
        		console.error(err);
            	throw err;
            }
                
            console.log("{"+methodName+"} => Updated user details");   
            console.dir(updatedUser);
            if (res) 
            	res.json(updatedUser);
        });
	}
	app.post('/changePassword', function(req, res) {
		console.log("{changePassword} => Inside Profile");
		console.log("{changePassword} => Fetching " + req.body.userName + " Profile");
		User.findOne({ 'userName' : req.body.userName }, function(err, user) {
		    if (err) {
                console.log("{changePassword} => Error while getting user");
                console.error(err);
            }
            // check to see if theres already a user with that email
            if (user) {
                if ( !user.validPassword(req.body.oldPassword) ) {
                    console.log("{login} => Failure. Password incorrect");
                    res.status(500).send("Incorrect Password!");
                } else {
                    console.log("{login} => Success");
                    console.log("{login} => User Details");
                    user.password = user.generateHash(req.body.newPassword);
                    saveUser("changePassword", user, res);
                }
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

	var readFile = function(id, res, cb){
		console.log("{getFile} => Fetching from DB for Id ", id);
		gfs.files.find({
	    	_id: mongoose.Types.ObjectId(id)
	    }).toArray(function(err, files) {
	    	if (err)
	    		console.log(err);
	    	var file = files[0];
	    	console.log("{getFile} => File from DB ", file);
	    	console.log("{getFile} => File Name is ", file.filename);
	    	console.log("{getFile} => File Type is ", file.metadata["file"].type);
	    	
	    	res.setHeader('Content-disposition', 'attachment; filename=' + file.filename);
  			res.setHeader('Content-type', file.metadata["file"].type);
	    	
	    	cb({
	    		stream: gfs.createReadStream({_id: file._id}),
	    		fileName: file.filename
	    	});
	    	
	    });
	};
	
	app.get('/getFile/:id', function(req, res) {
	    readFile(req.params.id, res, function(resp){
	    	resp.stream.pipe(res);
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
	
	function generateRandomPassword() {
		var text = "", passwordLength = 6;
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < passwordLength; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}
	
	app.post('/resetPassword', function(req, res) {
		console.log("{resetPassword} => Fetching user details", req.body.email);
		User.findOne({ 'email' :  req.body.email }, function(err, user) {
		    if (err) {
                console.log("{resetPassword} => Error while getting user details");
                console.error(err);
                res.status(500).send("Error " + err.message);
            }
            // check to see if theres already a user with that email
            if (user) {
            	var genPass = generateRandomPassword();
            	console.log("{resetPassword} => Generated Password is ", genPass);
            	user.password = user.generateHash(genPass);
                saveUser("changePassword", user);
            	var content = "Your old password is reset. Please use this password to login " + genPass;
                sendMail("changePassword", user.email, content, res);
            } else {
                res.status(500).send("User Not Found!");
            }
        });
	});
	
	app.post('/sendMail', function(req, res) {
		console.log("{sendMail} => Fetching user details", req.body.userName);
		User.findOne({ 'userName' :  req.body.userName }, function(err, user) {
		    if (err) {
                console.log("{sendMail} => Error while getting user details");
                console.error(err);
                res.status(500).send("Error " + err.message);
            }
            // check to see if theres already a user with that email
            if (user) {
            	var content = "Check mail for attachment";
            	readFile(req.body.id , res, function(fileResp){
			    	console.log("{sendMail} => " + fileResp.fileName);
			    	var attachment = {   // stream as an attachment
	            		filename: fileResp.fileName,
	            		content: fileResp.stream
	        		};
	                sendMail("sendMail", user.email, content, res, attachment);
			    });
            	
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
	
	var sendMail = function(methodName, userEmail, content, res, attachment){
		var email = {
			to: userEmail,
			from: 'FileStore@file-app-up.herokuapp.com',
			subject: 'Password reset mail',
			text: content,
			html: content
		};
		if ( attachment ) {
			email.attachments = [];
			email.attachments.push(attachment);
		}
			
		
		mailer.sendMail(email, function(err, resp) {
			if (err) {
				console.log("{" + methodName + "} Error while sending mail " + err);
			}
			console.log("{" + methodName + "} => Mail response is " , resp);
			res.status(200).send(resp);
		});
	};
};