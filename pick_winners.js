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


// Ask user which list to pick from
// Ask user how many winners
// Randomly pick winners
	// Make sure not to pick duplicates
// Send text message to winners

// App.js:
// If DO NOT WANT 'contest name'
	// Check if person in winners list
	// If person is:
		// Remove from list
		// Pick another winner
		// Send that winner a message

console.log('\nPICK WINNERS\n')

// Show lists
for (var i=0; i<files.length; i++) {
	console.log('[%d] => %s', i, files[i]);
}
var list_num = readlineSync.question('Pick a list: ')

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

console.log('There are %d entries in %s', number_of_subs, files[list_num])
var number_of_winners = readlineSync.question('How many winners should I choose? ')

// Check: number_of_winners <= number of entries
// Check: number of winners > 0
// Check: number of winners is a number

var winners = {}
var keys = Object.keys(sub_list_obj)
while (Object.keys(winners).length < number_of_winners) {
	// console.log('Len: ', Object.keys(winners).length)
	var r = Math.floor(Math.random() * (keys.length - 0) + 0)
	// console.log(r)
	
	winners[keys[r]] = true
	delete sub_list_obj[keys[r]]

}

console.log('HERE ARE THE WINNERS: ')
console.dir(winners)

// Write to file
var f = fs.openSync('./lists/winners-' + files[list_num], 'w')
fs.closeSync(f)
fs.writeFileSync('./lists/winners-' + files[list_num], JSON.stringify(winners))
fs.writeFileSync('./lists/' + files[list_num], JSON.stringify(sub_list_obj))

var msg = readlineSync.question("What message would you like to send? ")
console.log();

console.log("MESSAGE : \n%s\n", msg);
console.log('YOU ARE ABOUT TO SEND THIS TO %d PEOPLE.', number_of_winners)

var confirm = readlineSync.question('CONFIRM? (Y/n, caps matter) ');

if (confirm === 'Y') {
	console.log('MESSAGES SENDING...')
	for (num in winners) {
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