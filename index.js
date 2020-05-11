'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express().use(bodyParser.json());

app.listen(process.env.PORT || 1337, () => console.log("webhook listening"));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
    let body = req.body;

    console.log(body);

    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        let sender_psid = webhook_event.sender.id;
        console.log(webhook_event);

        if (webhook_event.message) {
          handlemsg(sender_psid, webhook_event.message);
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
        }
      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
});

app.get("/webhook", (req, res) => {
    let VERIFY_TOKEN = "yurikek";
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("WEBHOOK VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.status(403);
        }
    }
});

// handle message events
function handlemsg(sender_psid, received_message) {
  let response;

  if (received_message.text) {
    response = { "text" : `well "${received_message.text}" to you too`};
  } else {
    response = {"text" : "you sent me nothing you git"};
  }

  
  callSendAPI(sender_psid, response);
}

// handle message postback events
function handlePostback(sender_psid, received_postback) {
  // not really a thing for what i wanna do i think
}

// send response
function callSendAPI(sender_psid, response) {
  let request_body = {
    "recipient": {
      "id" : sender_psid
    },
    "message": response
  }

  
}