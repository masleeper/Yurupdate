'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express().use(bodyParser.json());
const fs = require("fs");
const {google} = require('googleapis');

app.listen(process.env.PORT || 1337, () => console.log("webhook listening"));

app.get("/", (req, res) => {
  res.status(200).send("blank").end();
});

// Endpoint for Google Drive push notifications
app.post("/notifications", (req, res) => {

  console.log("push notification received");
});

app.get("/notifications", (req, res) => {
  res.status(200).send("notif").end();
});

// drive auth functions
async function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  oAuth2Client.on("tokens", (token) => {
    if (token.refresh_token) {
      fs.writeFile("token.json", JSON.stringify(token), (err) => {
        if (err) {
          console.log("error writing token");
        }
      })
      // console.log(token);
    }
    // console.log(token);
    postreq(oAuth2Client, token);
  });
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, postreq);
    oAuth2Client.setCredentials(JSON.parse(token));
    driveWatchRequest(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      console.log("Hello");
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client, token);
    });
  });
}

async function driveWatchRequest(client) {
  const {token} = await client.getAccessToken();
  var reqbody = { 
      "id": "yurikek",
      "type": "web_hook",
      "address": "https://yurupdate.wm.r.appspot.com/notifications"
  }
  request({
      url: "https://www.googleapis.com/drive/v3/files/18xVLgwhixugbfBVQBO_67aRre4vrr4mAJMAV-y4PCJ8/watch", 
      method: "POST",
      headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
      },
      json: reqbody
  }, (err, res, body) => {
      if (!err) {
          // console.log(res);
          console.log(body);
      }
      fs.writeFile("res.txt", res, (err) => {
          if (err) {
              console.log("error writing to file");
          }
      })
  });
}
