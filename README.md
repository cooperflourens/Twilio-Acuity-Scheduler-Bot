Twilio-Acuity Scheduler Bot by Cooper Flourens
Version 1.0.0 Release: November 2021

This project came together with help from these GitHub Projects:
    https://github.com/AcuityScheduling/acuity-converse
    https://github.com/AcuityScheduling/acuity-js
    https://github.com/TwilioDevEd/survey-node
    https://github.com/engelsjk/node-sms-surveybot
Without these references, this probably wouldn't have happened.

I created this bot as a scheduler for Laborless Laundry, a mobile laundry service. 
The company wanted to be able to have clients schedule appointments via a text bot, so I made this bot to interface with Acuity, the scheduler, and Twilio, a messaging service.

This program uses Twilio and Acuity APIs and is run with node.js (and currently uses ngrok but I assume if you use this it'll be hosted on a server)

Local Usage:
    1. clone this repository
    2. navigate to the newly cloned folder in Command Prompt/Terminal
    3. create a new file called "config.json" that includes:
        {
            "SESSION-SECRET": [some kind of secret],
            "ACUITY_USER_ID": [your Acuity user ID],
            "ACUITY_API_KEY": [your Acuity API key]
        }
    4. set up a local server using: ngrok http 3000 (you can change this port in the settings)
    5. change the webhook on Twilio:
        go to Twilio's dashboard,
            Console ->
                Phone Numbers ->
                    Manage ->
                        Active Numbers ->
                            "A Message Comes In"
                                Change this to the url created by ngrok + /sms
                                For example: http://42cce56fd159.ngrok.io/sms, and set it to HTTP Post
    6. navigate to the cloned folder in a separate Command Prompt/Terminal
    7. execute the code using either npm index.js or nodemon (if you have that installed)
    8. you should be good to go!

Patch Ideas:
    1. better readme
    2. better code formatting, cleaner readability
    3. more dynamic code, make it more versitile
Let me know if any users have any ideas on this.