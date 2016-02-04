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
	var appName = app.get("appName");
	var nodemailer = require('nodemailer');
	var sgTransport = require('nodemailer-sendgrid-transport');

	var options = {
	    auth: {
	        api_key: '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'
	    }
	};

	var mailer = nodemailer.createTransport(sgTransport(options));

	/* 
		Endpoint for Posting server(*nix) Commands to Run.
		Uses the following libs
			child_process
		METHOD: POST
		Params: serverCmd
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
		Method for Saving the user
		Params: methodName 	=> 	For logging
				user		=>	The user to be saved
				res			=>	The response object for status and data
	*/
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
	
	/* 
		Method for Finding the user based on user name
		Params: methodName 	=> 	For logging
				userName	=>	The user to be queried
				res			=>	The response object for status and data
				callback	=> 	The callback function to be called once successful
	*/
	function findUserByUserName(methodName, userName, res, callback){
		console.log("{"+methodName+"} <findUserByUserName> => Getting details");   
		User.findOne({ 'userName' :  userName }, function(err, user) {
		    if (err) {
                console.log("{" + methodName + "} <findUserByUserName> => Error in getting user details ");
                console.error(err);
                res.status(500).send("Error " + err.message);
            }
            if (user) {
            	console.log("{"+methodName+"} <findUserByUserName> => Returning details"); 
            	callback(user);
            }
            else {
            	res.status(500).send("User Not Found!");
            }
		});
	}
	
	/* 
		Method for Setting the user details
		Params: methodName 	=> 	For logging
				source		=>	The object which has a data
				dest		=>	The object to be updated
				genPass		=>	Whether password needs to be generated
				callback	=> 	The callback function to be called once successful
	*/
	function setUserDetails(methodName, source, dest, genPass, callback){
		console.log("{" + methodName + "} <setUserDetails> => Inside setUserDetails");
		dest.firstName   =   source.firstName;
		dest.lastName    =   source.lastName;
		dest.email       =   source.email;
		dest.userName    =   source.userName;
		if ( genPass )
			dest.password    =   dest.generateHash(source.password);
		dest.phoneNo		= 	source.phoneNo;
		console.log("{" + methodName + "} <setUserDetails> => Set Details done");
		callback(dest);
	}
	/* 
		Endpoint for Signing up the user. 
		METHOD: POST
		Params: user
	*/
	app.post('/signup', function(req, res) {
		console.log("{signup} => Inside Signup");
		console.log("{signup} => User Details");
		console.dir(req.body.user);
		
		if ( req.body.user === null || typeof req.body.user === "undefined" ) {
			res.status(500).send("Error: User details not found");
			res.end();
		}
		User.find({$or : [{'email' :  req.body.user.email}, {'userName' :  req.body.user.userName}]}, function(err, users) {
		    if (err) {
                console.log("{signup} => Error in Signup");
                console.error(err);
            }
			var user = users[0];
            // check to see if theres already a user with that email
            if (user) {
            	console.log("{signup} => Checking mails " + req.body.user.email + " === " + user.email );
            	console.log("{signup} => Checking userName " + req.body.user.userName + " === " + user.userName );
            	var errMsg = user.email === req.body.user.email ? 
            					"User already registered with the mail address" : 
            					"User already registered with the username";
            	
                res.status(500).send(errMsg);
                console.log("{signup} => " + errMsg);
            } else {
                console.log("{signup} => Creating A New User");
                // if there is no user with that email or username
                // create the user
                var newUser         = 	new User();
                setUserDetails("signup", req.body.user, newUser, true, function(updatedUser){
                	saveUser("signup", updatedUser, res);
                });
            }
        });
	});
	
	/* 
		Endpoint for Updating the user details.
		METHOD: POST
		Params: user
	*/
	app.post('/update', function(req, res) {
		console.log("{update} => Inside Update");
		
		findUserByUserName("profile", req.body.user.userName, res, function(user){
			setUserDetails("signup", req.body.user, user, false, function(updatedUser){
            	saveUser("signup", updatedUser, res);
            });
		});
	});
	
	/* 
		Endpoint for Logging in the user.
		METHOD: POST
		Params: userName, password
	*/
	app.post('/login', function(req, res) {
		console.log("{login} => Inside Login");
		console.log("{login} => User : ", req.body.userName);
		findUserByUserName("profile", req.body.userName, res, function(user){
			if ( !user.validPassword(req.body.password) ) {
                console.log("{login} => Failure. Password incorrect");
                res.status(500).send("Incorrect Password!");
            } else {
                console.log("{login} => Success");
                console.log("{login} => User Details");
                console.log(user);
                res.json(user);
            }
		});
	});
	
	/* 
		Endpoint for getting the profile of the user.
		METHOD: POST
		Params: userName
	*/
    app.post('/profile', function(req, res) {
		console.log("{profile} => Inside profile");
		console.log("{profile} => Fetching " + req.body.userName + " Profile");

		findUserByUserName("profile", req.body.userName, res, function(user){
			console.log("{profile} => Returning user data");
        	console.log(user);
            res.json(user);
		});
	});
	
	/* 
		Endpoint for changing the password of the user.
		METHOD: POST
		Params: userName
	*/
	app.post('/changePassword', function(req, res) {
		console.log("{changePassword} => Inside changePassword");
		console.log("{changePassword} => Fetching " + req.body.userName + " Profile");
		
		findUserByUserName("changePassword", req.body.userName, res, function(user){
			if ( !user.validPassword(req.body.oldPassword) ) {
                console.log("{changePassword} => Failure. Password incorrect");
                res.status(500).send("Incorrect Password!");
            } else {
                user.password = user.generateHash(req.body.newPassword);
                user.isPasswordChanged = false;
                console.log("{changePassword} => Password changed is ", user.isPasswordChanged);
                saveUser("changePassword", user, res);
            }
		});
		
	});
	
	/*
		Method to generate a new random password
		Params: None
	*/
	function generateRandomPassword() {
		var text = "", passwordLength = 6;
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < passwordLength; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}
	
	/* 
		Endpoint for resetting the password of the user.
		METHOD: POST
		Params: email
	*/
	app.post('/resetPassword', function(req, res) {
		console.log("{resetPassword} => Fetching user details", req.body.email);
		User.findOne({ 'email' :  req.body.email }, function(err, user) {
		    if (err) {
                console.log("{resetPassword} => Error while getting user details");
                console.error(err);
                res.status(500).send("Error " + err.message);
            }
            if (user) {
            	var genPass = generateRandomPassword();
            	console.log("{resetPassword} => Generated Password is ", genPass);
            	user.password = user.generateHash(genPass);
            	user.isPasswordChanged = true;
            	
                saveUser("resetPassword", user);
            	var content = "Your old password is reset. Please use this password to login " + genPass;
            	var subject = "Password Reset Mail from FileStore";
                sendMail("resetPassword", user.email, subject, content, res);
            } else {
                res.status(500).send("User Not Found!");
            }
        });
	});
	
	/* 
		Endpoint for uploading files to the server.
		Uses: 
			multipartyMiddleware
		METHOD: POST
		Params: userName, file
	*/
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
		});
		read_stream.pipe(writestream);
		
		writestream.on('close', function(file) {
		    console.log("{uploadFiles} => " + file.filename + 'Written To DB');
		    console.log("{uploadFiles} => File is ", file);
		    res.status(200).send("File Uploaded successfully");
		});
		
		
	});
	
	/*
		Method to find the file from Mongo based on a meta username
		Params: userName		=>	The user who uploaded the image, used for query
				res				=> 	The response object for error and data.
	*/
	var findFilesWithMeta = function(userName, res){
		gfs.files.find({"metadata.userName": userName}).toArray(function (err, files){
	        if (err)
	            console.log(err);
	        console.log("{findFilesWithMeta} => Got files");
	        console.log(files);
	        res.status(200).send(files);
	    });
	};
	
	/* 
		Endpoint for viewing the files already uploaded
		METHOD: POST
		Params: userName
	*/
    app.post('/viewFiles', function(req, res){
	    console.log("{viewFiles} => Inside viewFiles");
	    var userName = req.body.userName;
	    console.log("{viewFiles} => Getting the files for ", userName);
	    findFilesWithMeta(userName, res);
	});
	
	/* 
		Endpoint for removing the files already uploaded
		METHOD: POST
		Params: id, userName
	*/
	app.post("/removeFile", function(req, res){
	    console.log("{removeFile} => Removing file with id : ", req.body.id);
	    
	    gfs.remove({
	        _id: req.body.id
	    }, function(err) {
	        if (err) console.log(err);
	        findFilesWithMeta(req.body.userName , res);
	    });
	});
	
	/*
		Method to send SMS to the user with the url of the file
		Params: phone			=>	The phoneNo of the user
				content			=> 	The content of the SMS
				res				=> 	The response object for error and data
	*/
	var sendSMS = function(phone, content, res){
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
			if ( err ) {
				console.log("{sendSMS} => err", err);
				res.status(500).send(err);
			} else {
				console.log("{sendSMS} => SMS Id is " + message.sid); 
				res.status(200).send(message.sid);	
			}
		});
	};
	
	/*
		Method to send mail to the user
		Params: methodName		=>	For logging
				userEmail		=> 	The email address to where the mail is to be sent
				subject			=> 	The subject of the mail
				content			=> 	The content of the mail
				res				=> 	The response object for error and data
				attachment		=> 	Attachement to be sent along with the mail
	*/
	var sendMail = function(methodName, userEmail, subject, content, res, attachment){
		var email = {
			to: userEmail,
			from: 'FileStore@' + appName,
			subject: subject,
			text: content,
			html: content,
			attachments: []
		};
		if ( attachment ) {
			email.attachments.push(attachment);
		}
		
		mailer.sendMail(email, function(err, resp) {
			if (err) {
				console.log("{" + methodName + "} Error while sending mail " + err);
				res.status(500).send(err);	
			} else {
				console.log("{" + methodName + "} => Mail response is " , resp);
				res.status(200).send(resp);	
			}
		});
	};
	
	/*
		Method to read the file from Mongo based on a id
		Params: id				=>	The id of the file to be read
				res				=> 	The response object for error and data.
				cb				=> 	The callback function to be called once successful
	*/
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
	    	
	    	res.setHeader('Content-type', file.metadata["file"].type);
	    	res.setHeader('Content-disposition', 'attachment; filename="' + file.filename + '"');
	    	
	    	cb({
	    		stream: gfs.createReadStream({_id: file._id}),
	    		fileName: file.filename
	    	});
	    	
	    });
	};
	
	/* 
		Endpoint for getting the file based on the ID
		METHOD: POST
		Params: id
	*/
	app.get('/getFile/:id', function(req, res) {
	    readFile(req.params.id, res, function(resp){
	    	resp.stream.pipe(res);
	    });
	});
	
	/* 
		Endpoint for sending SMS to the user
		METHOD: POST
		Params: userName
	*/
	app.post('/sendMessage', function(req, res) {
		console.log("{sendMessage} => Inside Send Message");
		console.log("{sendMessage} => Fetching " + req.body.userName + " Profile");
		findUserByUserName("sendMessage", req.body.userName, res, function(user){
			var phoneNo = user.phoneNo.code + user.phoneNo.number;
        	var url = "https://" + appName + "/getFile/" + req.body.id;
            sendSMS(phoneNo, url, res);
		});
	});
	
	/* 
		Endpoint for sending mail to the user
		METHOD: POST
		Params: userName
	*/
	app.post('/sendMail', function(req, res) {
		console.log("{sendMail} => Fetching user details", req.body.userName);
		findUserByUserName("sendMail", req.body.userName, res, function(user){
			readFile(req.body.id , res, function(fileResp){
		    	console.log("{sendMail} => " + fileResp.fileName);
		    	var attachment = {   // stream as an attachment
            		filename: fileResp.fileName,
            		content: fileResp.stream
        		};
        		var subject = "File [" + fileResp.fileName + "] Sent From FileStore";
        		var content = "Check mail for attachment";
                sendMail("sendMail", user.email, subject, content, res, attachment);
		    });
		});
	});
	
	/* 
		Endpoint for getting the list of phone country codes
		METHOD: GET
		Params: None
	*/
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