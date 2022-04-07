# Twilio-Acuity Scheduling Bot
## Original integration of Twilio and Acuity's APIs
#
#


This scheduling bot uses Twilio to allow your customers to schedule through Acuity. It makes use of both of their APIs. In order to use this, you need:
- A [Twilio account](https://twilio.com) (premium if you want anybody to be able to use it)
- A "Powerhouse" level [Acuity](https://acuityscheduling.com/) subscription (required for API use)
- A local machine or remote server to run Node.js

## Features

- Fetch types of appointments from Acuity API
- Fetch available times on a specific date from Acuity API
- Easily customizable text messages
- Response parsing and validation

This is intended to be used to schedule a delivery or pickup to a location, but could be used to schedule anything in Acuity.

## Installation/Use

The Twilio-Acuity Scheduling Bot requires [Node.js](https://nodejs.org/). It was programmed using v14.17.4 and should be forward compatible. It has not been tested on older versions.

Once the Twilio Acuity Scheduler is downloaded, unzip and navigate to the unzipped folder.

Here, you will want to create a config.json folder. Copy this format:
{
    "SESSION_SECRET": "[any string here will do]"
    "ACUITY_USER_ID": "[the user ID found [under Integrations](https://secure.acuityscheduling.com/app.php?action=settings&key=api)]"
    "ACUITY_API_KEY": "[The API key found [under Integrations](https://secure.acuityscheduling.com/app.php?action=settings&key=api)]"
}
Save this as "config.json" and make sure it's in the same folder as index.js.

The npm-modules folder should have everything you need, but in the case that something doesn't work, the package.json folder has everything you'll need. To install...

```sh
npm install package.json
```
This will install the required packages from npm.

Next, you will need nodemon. This can be installed
```sh
npm install nodemon
```
Once this is installed, you can start up the script.

```sh
nodemon index.js
```
Leave this window running for the duration of your use.

The next step is to set up a server. Following the below instructions will set up a server locally. To set up a remote server, refer to the documentation of the service of your choice.

First, install ngrok. Follow the instructions [Here](https://ngrok.com/download). Once installed, open a new terminal window. here we will start the http server on the same port you use in the code. If you didn't change it, the command will be:
```sh
ngrok http 3000
```
After a few seconds, this will start a server that forwards to your localhost, where the Scheduler Bot is running. You can see the address that is forwarding to the localhost, and be something like: https://e62c-104-222-31-106.ngrok.io. Now, we need to make the Twilio request be sent to that http address.

To do this, we want to make a TwiML App. This can be done [here](https://console.twilio.com/us1/develop/phone-numbers/manage/twiml-apps?frameUrl=%2Fconsole%2Fphone-numbers%2Fruntime%2Ftwiml-apps%3Fx-target-region%3Dus1):
- Click the red button in the top left
- Name your TwiML App
- Put the URL you got from ngrok into the Messaging field with /sms at the end. Following our earlier example, this would be: https://e62c-104-222-31-106.ngrok.io/sms. This scheduler is not Voice compatible, so we don't need to put anything there. 
- Make sure it also has HTTP Post.
- Save your app.

Next, we want to configure the app with your phone number. For this, navigate to Active Numbers, then to the number you want to use. Scroll down to Messaging, select Configure with Other Handlers -> TwiML App, then select your TwiML App you just made below it.

After this step, your bot should be set up. It does take a minute or so for everything on Twilio's end to be set up, but once it is you're good to go. Send a text to the number you selected to wake the bot and start scheduling!


## Future Additions
- Submitting invalid data for the email or phone number fields will fail to schedule the appointment. Need to add better validation for:
--Address
--Phone Number
--Email Address
- Better modularization for customization
-- input data from the Acuity request
-- options document for port, acuity api, and 


[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)
