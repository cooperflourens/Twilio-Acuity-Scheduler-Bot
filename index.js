//Twilio Acuity Scheduler Bot
//Cooper Flourens


const http = require('http');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const storage = require('node-sessionstorage');
const Acuity = require('acuityscheduling');
const config = require('./config.json');
const custom_messages = require('./custom_messages.json');
const { getItem } = require('node-sessionstorage');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

//Essential Variables
const port = 3000; 
const session_expiration_ms = 900000;

//App Configuration
const app = express();

// Configure Sessions
app.use(session({ 
  secret: config['SESSION_SECRET'],
  cookie: { maxAge: session_expiration_ms },
  resave: true,
  saveUninitialized: true
}));

// Configure Body Parsing
app.use(bodyParser.urlencoded({ extended: false }));

//Acuity Basic Auth
const acuity = Acuity.basic({
  userId: config['ACUITY_USER_ID'],
  apiKey: config['ACUITY_API_KEY']
});

//Get next day in week function, necessary to find times
function nextWeekdayDate(date, day_in_week) {
  const day = new Date(date || new Date());
  day.setDate(day.getDate() + (day_in_week - 1 - day.getDay() + 7) % 7 + 1);
  return day;
}

function getappointmentTypes(req) {
  return new Promise((resolve, reject) => {
    acuity.request('appointment-types', null, function(err, resp, body) {
      if (err) reject(err);
      const appointment_type = resp.body.find(appt => appt.name.toUpperCase() === req.body.Body.trim().toUpperCase());
      if (appointment_type) {
        storage.setItem('service', appointment_type.id);
        console.log("ADDED SERVICE ID:" + storage.getItem('service'));
        resolve(resp);
      } else reject();
    });
  });
}

// Define Endpoint
app.post('/sms', async (req, res) => {

  // Confirm communication
  console.log('Received SMS');

  // Get the session and define response
  let smsCount = req.session.counter || 0;
  let response = new MessagingResponse();

  //Define questions
  let questions = Object.keys(custom_messages.questions).map(key => custom_messages.questions[key]);

  //Define all essential session variables
  var body = req.body;
  var session = req.session;
  var appointmentType = session.appointmentType;
  session.availableTimes = session.availableTimes || [];

  message1 = custom_messages['text'][smsCount === 0 ? 'text-intro' : 'text-followup'];

  if(smsCount === 1) {
    //Get appointment Types from Acuity
      await getappointmentTypes(req).catch(err => {
        message1 = custom_messages['text']['text-error'];
    });
  }
  
  if (smsCount === 2) {
    //Get the actual date for the next x day:
    var date = new Date();
    const day_of_week = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const index = day_of_week.indexOf(req.body.Body.trim().toUpperCase())
    if (index > -1) {
      date = nextWeekdayDate(date, index);
      console.log(date);
      storage.setItem('day', req.body.Body.toUpperCase());
      date = date.toISOString().slice(0, 10);
      session.date = date;
      storage.setItem('date', date);
      await new Promise ( (resolve, reject) => {
        acuity.request('availability/times?date=' + date + '&appointmentTypeID=' + storage.getItem('service'), null, function(err, resp, body) {
          if (err) reject(err);
          console.log('Times: ', resp.body);
          let time = "";
          //List all the times on the date
          for(let i = 0; i < resp.body.length; i++) {
            time = time.concat(resp.body[i]['time'].substr(11, 5), " ");
            session.availableTimes.push(resp.body[i]['time'].substr(11, 5));
          }
          message1 = message1.concat(time)
          resolve();
        });
      }).catch(err => {
        console.log(err);
      });
    } else {
      message1 = custom_messages['text']['text-error'];
    }
  }

  if (smsCount === 3) {
    //Check if the time submitted is in the list of available times
    if (session.availableTimes.includes(req.body.Body)) {
      //save that time
      storage.setItem('time', req.body.Body);
      session.time = req.body.Body;
    } else {
      message1 = custom_messages['text']['text-error'];
    }
  }

  switch(smsCount) {
    case 4: storage.setItem('address', req.body.Body);
    case 5: storage.setItem('name', req.body.Body);
    case 6: storage.setItem('lastname', req.body.Body);
    case 7: storage.setItem('phone', req.body.Body);
  }

  if (smsCount === 8) {
    storage.setItem('email', req.body.Body);
    // Goodbye
    message1 = custom_messages['text']['text-goodbye'];
    message1 = message1.replace( '%n', storage.getItem('name') );
    message1 = message1.replace( '%d', storage.getItem('day') );
    message1 = message1.replace( '%t', storage.getItem('time') );
    message1 = message1.replace( '%a', storage.getItem('address') );

    var options = {
      method: 'POST',
      body: {
        appointmentTypeID: storage.getItem('service'),
        datetime: storage.getItem('date') + 'T' + storage.getItem('time'),
        firstName: storage.getItem('name'),
        lastName: storage.getItem('lastname'),
        phone: storage.getItem('phone'),
        email: storage.getItem('email'),
        "fields": [{
          "id": 10132894,
          "value": storage.getItem('address')
        }]
      }
    };

    acuity.request('/appointments', options, function(err, resp, body) {
      console.log('Appointment: ', resp.body);
    });
  }
  
  if (smsCount >= 9) return;

  if (message1 == custom_messages['text']['text-error']) { smsCount -= 1; }
  question = questions[smsCount];
  req.session.counter = smsCount + 1;
  message1 = message1.replace('%s', question);
  response.message(message1);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(response.toString());
  console.log('...response sent...');
});


// App Listen Port
http.createServer( app ).listen( port, () => {
  console.log( ('Twilio-Acuity Scheduler has started listening on port %s!').replace( '%s', port ) );
});

