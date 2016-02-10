var fs = require('fs')
var readlineSync = require('readline-sync')

// Twilio setup
var account_settings = require('./settings.cfg.js')
var client = require('twilio')(account_settings.ACCOUNT_SID, account_settings.AUTH_TOKEN)

// Get lists to send to
var files = fs.readdirSync('./lists')
			.filter(function (f) {
				return (f.substr(-5) === '.json') 
					&& (f.substr(0, 7) != 'package')
					&& (f.substr(0, 9) != 'stop_list')
			})

// Message to send...
var msg = readlineSync.question("What message would you like to send? ")
console.log();

// Show list
for (var i=0; i<files.length; i++) {
	console.log('[%d] => %s', i, files[i]);
}
var list_num = readlineSync.question("Which list would you like to send to (use number)? ")

// Validate choice
while (list_num >= files.length || list_num < 0) {
	console.log('Sorry, that\'s not a valid choice...')
	console.log('Please choose again: ')

	for (var i=0; i<files.length; i++) {
		console.log('[%d] => %s', i, files[i]);
	}

	list_num = readlineSync.question("Which list would you like to send to (use number)? ")	
}

// Open list
var sub_list = fs.readFileSync('./lists/' + files[list_num])
var sub_list_obj = JSON.parse(sub_list)
var number_of_subs = Object.keys(sub_list_obj).length

// Confirm
console.log("MESSAGE : \n%s\n", msg);
console.log('YOU ARE ABOUT TO SEND THIS TO %d PEOPLE.', number_of_subs)

var confirm = readlineSync.question('CONFIRM? (Y/n, caps matter) ');

if (confirm === 'Y') {
	console.log('MESSAGES SENDING...')
	for (num in sub_list_obj) {
		var outgoingMessage = {
	        to : num,
	        from : '+15412389300',
	        body : msg,
	    }
		
		client.sendMessage(outgoingMessage, function (err, resp) {
			if (!err) {
			  console.log('SENT: ' + resp.to)
			  // console.dir(resp)
			} else {
			  console.error('ERROR: Could not send message!')
			  console.dir(err)
			}
		})
	}

} else {
	console.log('MESSAGE NOT SENT')
}