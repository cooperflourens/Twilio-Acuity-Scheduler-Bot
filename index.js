//Twilio Acuity Scheduler Bot
//Cooper Flourens


const http = require( 'http' );
const express = require( 'express' );
const session = require( 'express-session' );
const bodyParser = require('body-parser');
const storage = require('node-sessionstorage');
var Acuity = require('acuityscheduling');

const config = require('./config.json');
const custom_messages = require( './custom_messages.json' );
const { getItem } = require('node-sessionstorage');

const MessagingResponse = require( 'twilio' ).twiml.MessagingResponse;

//Essential Variables
const port = 3000; 
const session_expiration_ms = 900000;
const appointmentTypes = [];

//Acuity Basic Auth
var acuity = Acuity.basic({
  userId: config['ACUITY_USER_ID'],
  apiKey: config['ACUITY_API_KEY']
});

//App Configuration
const app = express();

// Configure Sessions
app.use( session( { 
  secret: config['SESSION_SECRET'],
  cookie: { maxAge: session_expiration_ms } ,
  resave: true,
  saveUninitialized: true
} ) );


//get next day in week function, necessary to find times:
function nextWeekdayDate(date, day_in_week) {
  var ret = new Date(date||new Date());
  ret.setDate(ret.getDate() + (day_in_week - 1 - ret.getDay() + 7) % 7 + 1);
  return ret;
}

// Configure Body Parsing
app.use( bodyParser.urlencoded( { extended: false } ) );

// Define Endpoint
app.post( '/sms', ( req, res ) => {

  console.log('Received SMS');

  // Get the session and define response
  let smsCount = req.session.counter || 0;
  let response = new MessagingResponse();

  //Define questions
  let questions = [
    custom_messages['questions']['question-1'],
    custom_messages['questions']['question-2'],
    custom_messages['questions']['question-3'],
    custom_messages['questions']['question-4'],
    custom_messages['questions']['question-5'],
    custom_messages['questions']['question-6'],
    custom_messages['questions']['question-7'],
    custom_messages['questions']['question-8']
  ];

  //Define all essential session variables
  var body = req.body;
  var session = req.session;
  var appointmentType = session.appointmentType || null;
  var appointmentTypeID = session.appointmentTypeID = body.appointmentTypeID || session.appointmentTypeID || null;
  var date = session.date = body.date || session.date || null;
  var time = session.time = body.time || session.time || null;
  var availableTimes = session.availableTimes = body.availableTimes || session.availableTimes || [];

  //Begin bot script
  if( smsCount == 0 ) {
    
    // Introduction w/ 1st Question
    message1 = custom_messages['text']['text-intro'];
    question = questions[0];
    message1 = message1.replace( '%s', question );    

    response.message( message1 );

    req.session.counter = smsCount + 1;
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');

  } else if ( smsCount == 1 ) {

    // Followup w/ 2nd Question
    let success = false;

    //Get appointment Types from Acuity
    const appointments = acuity.request('appointment-types', null, function(err, resp, body) {
      for(let i = 0; i < resp.body.length; i++) {
        if (resp.body[i]['name'].toUpperCase() == req.body.Body.toUpperCase()) {
          storage.setItem('service', resp.body[i]['id']);
          console.log("ADDED SERVICE ID:" + storage.getItem('service'));
          success = true;
        }
      }
      if ( success ) {
        message1 = custom_messages['text']['text-followup'];
        question = questions[1];
        message1 = message1.replace( '%s', question );
      } else {
        smsCount -= 1;
        message1 = custom_messages['text']['text-error'];
        question = questions[0];
        message1 = message1.replace( '%s', question );
      }
      req.session.counter = smsCount + 1;
      req.session.appointmentType = appointmentType;
      response.message( message1 );
      res.writeHead( 200, { 'Content-Type': 'text/xml' } );
      res.end( response.toString() );
      console.log('...response sent...');
    });

    //  THIRD QUESTION
  } else if ( smsCount == 2 ) {

    //Get the actual date for the next x day:
    var flag = false;
    var date = new Date();
    switch(req.body.Body.toUpperCase()) {
      case 'MONDAY':
        date = nextWeekdayDate(date, 1);
        console.log(date);
        break;
      case 'TUESDAY':
        date = nextWeekdayDate(date, 2);
        console.log(date);
        break;
      case 'WEDNESDAY':
        date = nextWeekdayDate(date, 3);
        console.log(date);
        break;
      case 'THURSDAY':
        date = nextWeekdayDate(date, 4);
        console.log(date);
        break;
      case 'FRIDAY':
        date = nextWeekdayDate(date, 5);
        console.log(date);
        break;
      case 'SATURDAY':
        date = nextWeekdayDate(date, 6);
        console.log(date);
        break;
      case 'SUNDAY':
        date = nextWeekdayDate(date, 7);
        console.log(date);
        break;
      default:
        smsCount -= 1;
        flag = true;
        message1 = custom_messages['text']['text-error'];
        question = questions[1];
        message1 = message1.replace( '%s', question );
        req.session.counter = smsCount + 1;
        req.session.appointmentType = appointmentType;
        response.message( message1 );
        res.writeHead( 200, { 'Content-Type': 'text/xml' } );
        res.end( response.toString() );
        console.log('...response sent...');
    }
    if (flag == false) {
    storage.setItem('day', req.body.Body.toUpperCase());
    //get times on date
    date = date.toISOString().slice(0, 10);
    session.date = date;
    storage.setItem('date', date);
    const times = acuity.request('availability/times?date=' + date + '&appointmentTypeID=' + storage.getItem('service'), null, function(err, resp, body) {
      console.log('Times: ', resp.body);
      time = "";
      //List all the times on the date
      for(let i = 0; i < resp.body.length; i++) {
        time = time.concat(resp.body[i]['time'].substr(11, 5), " ");
        session.availableTimes.push(resp.body[i]['time'].substr(11, 5));
      }
      message1 = custom_messages['text']['text-followup'];
      question = questions[2];
      message1 = message1.replace( '%s', question );
      message1 = message1.concat(time);
      req.session.counter = smsCount + 1;
      response.message( message1 );
      res.writeHead( 200, { 'Content-Type': 'text/xml' } );
      res.end( response.toString() );
      console.log('...response sent...');
    });
  }
    
  //  FOURTH QUESTION
  } else if ( smsCount == 3 ) {
    //Check if the time submitted is in the list of available times
    if (session.availableTimes.includes(req.body.Body)) {
      //save that time
      storage.setItem('time', req.body.Body);
      session.time = req.body.Body;
      
      // Followup w/ 4th Question
      message1 = custom_messages['text']['text-followup'];
      question = questions[3];
      message1 = message1.replace( '%s', question );
      req.session.counter = smsCount + 1;
      response.message( message1 );
      res.writeHead( 200, { 'Content-Type': 'text/xml' } );
      res.end( response.toString() );
      console.log('...response sent...')
    } else {
      message1 = custom_messages['text']['text-error'];
      question = questions[2];
      message1 = message1.replace( '%s', question );
      req.session.appointmentType = appointmentType;
      response.message( message1 );
      res.writeHead( 200, { 'Content-Type': 'text/xml' } );
      res.end( response.toString() );
      console.log('...response sent...');
    }
    
  } else if ( smsCount == 4 ) {
    //maybe add some address checking here idk
    // Followup w/ 5th Question
    storage.setItem('address', req.body.Body);
    message1 = custom_messages['text']['text-followup'];
    question = questions[4];
    message1 = message1.replace( '%s', question );
    req.session.counter = smsCount + 1;
    response.message( message1 );
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');

  }   else if ( smsCount == 5 ) {

    storage.setItem('name', req.body.Body);
    message1 = custom_messages['text']['text-followup'];
    question = questions[5];
    message1 = message1.replace( '%s', question );
    req.session.counter = smsCount + 1;
    response.message( message1 );
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');


  } else if ( smsCount == 6 ) {
    storage.setItem('lastname', req.body.Body);
    message1 = custom_messages['text']['text-followup'];
    question = questions[6];
    message1 = message1.replace( '%s', question );
    response.message( message1 );
    req.session.counter = smsCount + 1;
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');

  } else if ( smsCount == 7 ) {
    storage.setItem('phone', req.body.Body);
    message1 = custom_messages['text']['text-followup'];
    question = questions[7];
    message1 = message1.replace( '%s', question );
    response.message( message1 );
    req.session.counter = smsCount + 1;
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');

  } else if ( smsCount == 8 ) {
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

    req.session.counter = smsCount + 1;
    response.message( message1 );
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');

  } else if ( smsCount == 10 ) {

    // Ignore
    message1 = custom_messages['text']['text-ignore'];
    let session_expiration_min = session_expiration_ms / 1000 / 60;
    message1 = message1.replace( '%s', session_expiration_min );
    response.message( message1 );
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');
  }
});


// App Listen Port
http.createServer( app ).listen( port, () => {
  console.log( ('Twilio-Acuity Scheduler has started listening on port %s!').replace( '%s', port ) );
});

