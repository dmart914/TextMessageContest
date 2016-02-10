var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var fs = require('fs')
var account_settings = require('./settings.cfg.js')

var client = require('twilio')(account_settings.ACCOUNT_SID, account_settings.AUTH_TOKEN)


// Stretch goal:
// Write script that chooses winners, puts them in 'winners.json'
// Auto pick winners at 2pm on Friday
// Immediately text winners: "You won... reply 'can't go' if you dont want the tickets"
// Remove cant go from entries pool, winners pool
// Pick another person
// Text new person 


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  console.log(req.body)
  res.send('H&N Text Messaging<br>541-238-9300');
});

app.post('/', function (req, res) {
  console.log(getNow() + ' - Post request received.')
  if (req.body.To == '+15412389300') {
    var incomingMessage = {
      'from' : req.body.From,
      'body' : req.body.Body,
    }

    console.dir(incomingMessage)

    if (incomingMessage.body.toLowerCase().indexOf('subscribe') > -1) {
      
      // subscribe
      var sub_list = fs.readFileSync('./lists/subscription_list.json')
      var sub_list_obj = JSON.parse(sub_list)

      sub_list_obj[incomingMessage.from] = true

      fs.writeFileSync('./lists/subscription_list.json', JSON.stringify(sub_list_obj))

      var stop_list = fs.readFileSync('./lists/stop_list.json')
      var stop_list_obj = JSON.parse(stop_list)

      if (stop_list_obj[incomingMessage.from]) {
        delete stop_list_obj[incomingMessage.from]
        fs.writeFileSync('./lists/stop_list.json', JSON.stringify(stop_list_obj))
      }

      var outgoingMessage = {
        to : incomingMessage.from,
        from : '+15412389300',
        body : 'You have been subscribed. To stop, reply \'ubsub\'',
      }

      client.sendMessage(outgoingMessage, function (err, resp) {
        if (!err) {
          console.log('Number subscribed: ' + resp.to)
          // console.dir(resp)
        } else {
          console.error('ERROR: Could not send message: ' + err)
        }
      })

    } else if (incomingMessage.body.toLowerCase().indexOf('unsub') > -1) {
      // unsub
      var sub_list = fs.readFileSync('./lists/subscription_list.json')
      var sub_list_obj = JSON.parse(sub_list)

      delete sub_list_obj[incomingMessage.from]

      var stop_list = fs.readFileSync('./lists/stop_list.json')
      var stop_list_obj = JSON.parse(stop_list)

      stop_list_obj[incomingMessage.from] = true

      console.dir(JSON.stringify(sub_list_obj))
      fs.writeFileSync('./lists/stop_list.json', JSON.stringify(stop_list_obj))

      var outgoingMessage = {
        to : incomingMessage.from,
        from : '+15412389300',
        body : 'You have been unsubscribed.'
      }
      fs.writeFileSync('./lists/subscription_list.json', JSON.stringify(sub_list_obj))

      client.sendMessage(outgoingMessage, function (err, resp) {
        if (!err) {
          console.log('Number unsubscribed: ' + resp.to)
          // console.dir(resp)
        } else {
          console.error('ERROR: Could not send message: ' + err)
        }
      })

    } else if (incomingMessage.body.toLowerCase().indexOf('owls') > -1) {
      // subscribe
      var sub_list = fs.readFileSync('./lists/owl-tickets-giveaway.json')
      var sub_list_obj = JSON.parse(sub_list)

      sub_list_obj[incomingMessage.from] = true

      fs.writeFileSync('./lists/owl-tickets-giveaway.json', JSON.stringify(sub_list_obj))

      var outgoingMessage = {
        to : incomingMessage.from,
        from : '+15412389300',
        body : 'You have been entered in the OIT Basketball Game ticket giveaway! Thanks for entering.',
      }

      client.sendMessage(outgoingMessage, function (err, resp) {
        if (!err) {
          console.log('Owls contest entry: ' + resp.to)
          // console.dir(resp)
        } else {
          console.error('ERROR: Could not send message: ' + err)
        }
      })

    } else if (incomingMessage.body.toLowerCase().indexOf('do not want') > -1) {
      var pool = {}, winners_list = {}, do_not_want_list = {};
      pool = JSON.parse(fs.readFileSync('./lists/owl-tickets-giveaway.json'))
      winners_list = JSON.parse(fs.readFileSync('./lists/winners-owl-tickets-giveaway.json'))
      do_not_want_list = JSON.parse(fs.readFileSync('./lists/dnw-owl-tickets-giveaway.json'))

      if (winners_list[incomingMessage.from]) {
        delete pool[incomingMessage.from]
        delete winners_list[incomingMessage.from]
        do_not_want_list[incomingMessage.from] = true

        var keys = Object.keys(pool)
        var r = Math.floor(Math.random() * keys.length)
        winners_list[keys[r]] = true

        fs.writeFileSync('./lists/winners-owl-tickets-giveaway.json', JSON.stringify(winners_list))
        fs.writeFileSync('./lists/owl-tickets-giveaway.json', JSON.stringify(pool))
        fs.writeFileSync('./lists/dnw-owl-tickets-giveaway.json', JSON.stringify(do_not_want_list))

        var do_not_want_person = {
          to : incomingMessage.from,
          from : '+15412389300',
          body : 'Your tickets will be given to someone else. Thanks for letting us know!',
        }

        var new_winner = {
          to : keys[r],
          from : '+15412389300',
          body : 'Congrats! You won 2 OIT b-ball tickets. Pick up at H&N (2701 Foothills Blvd.) 8am-5pm M-F. Reply \'do not want\' if you can\'t make it',
        }

        client.sendMessage(do_not_want_person, function (err, resp) {
          if (!err) {
            console.log('Does not want: ' + resp.to)
            // console.dir(resp)
          } else {
            console.error('ERROR: Could not send message: ' + err)
          }
        })

        client.sendMessage(new_winner, function (err, resp) {
          if (!err) {
            console.log('New winner: ' + resp.to)
            // console.dir(resp)
          } else {
            console.error('ERROR: Could not send message: ' + err)
          }
        })



      }

    } else {
      var stop_list = fs.readFileSync('./lists/stop_list.json')
      var stop_list_obj = JSON.parse(stop_list)

      if (!stop_list_obj[incomingMessage.from]) {
        var outgoingMessage = {
          to : incomingMessage.from,
          from : '+15412389300',
          body : 'That didn\'t make any sense. To stop, reply \'unsub\''
        }

        console.log('Couldn\'t parse message: ' + incomingMessage.body)

        client.sendMessage(outgoingMessage, function (err, resp) {
          if (!err) {

          } else {
            console.error('ERROR: Could not send message: ' + err)
          }
        })
      }


    }

  } else {
    console.log('Bad request')
  }

})

app.listen(80, function () {
  console.log('Echo app listening on port 80');
});

function getNow() {
 var now = new Date
 return now.toString()
}