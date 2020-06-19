'use strict'

require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express().use(bodyParser.json());
const fs = require("fs");
const discord = require("discord.js");
const discordClient = new discord.Client(); 
const {google} = require('googleapis');
const TOKEN_PATH = "token.json";

const discordToken = process.env.DISCORD_TOKEN;
const googleId = process.env.GOOGLE_ID;
const googleSecret = process.env.GOOGLE_SECRET;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;
const oAuth2Client = new google.auth.OAuth2(googleId, googleSecret, googleRedirectUri);
oAuth2Client.setCredentials({
  "refresh_token": process.env.REFRESH_TOKEN
});
const drive = google.drive({version: 'v3', oAuth2Client});
const fileId = "18xVLgwhixugbfBVQBO_67aRre4vrr4mAJMAV-y4PCJ8";
const refreshMargin = 60 * 10; // time in seconds that new update message won't be sent after previous one
var channels = [];
var editUser;

var lastMsgSend = 0;
getLastRevisionTime().then((res) => {
  lastMsgSend = new Date(res);
});

// write new token to file on refresh
oAuth2Client.on("tokens", (token) => {
  if (token.refresh_token) {
    fs.writeFile("token.json", JSON.stringify(token), (err) => {
      if (err) {
        console.log("Error writing token to file");
      }
    })
  }
});

app.listen(process.env.PORT || 1337, () => console.log("SERVER STARTING"));

// renew push notifactions
renewPush();
// renew watch request every hour
setInterval(renewPush, 60000*60);

// start up discord bot
discordClient.login(discordToken);
discordClient.on("ready", () => { 
  console.log(`Discord bot started under user ${discordClient.user.tag}`);
  discordClient.channels.cache.forEach((entry) => {
    if (entry.type == "text" && entry.name == "yurupdate") {
      channels.push(discordClient.channels.cache.get(entry.id));
    }
  });

  editUser = discordClient.users.cache.get("187632415458590720");
});

discordClient.on("message", (msg) => {
  if (msg.content == "hello") {
    msg.reply("bye");
  } else if (msg.content == "!help") {
    var cmdlist = "\nCommand List\n" +
                  "!last - last update time\n" +
                  "!edit - who to get edit permissions from for the google doc\n" +
                  "!doc - document link\n" ;
    msg.reply(cmdlist);
  } else if (msg.content == "!last") {
    // not necessarily true update time, but close enough for users
    var dateStr = lastMsgSend.toLocaleString("en-US", {timeZone: "America/Denver"}) + " Mountain Time";
    msg.reply(dateStr);
  } else if (msg.content == "!edit") {
    msg.reply(`Contact ${editUser} for document edit permissions for the google doc`);
  } else if (msg.content == "!doc") {
    msg.reply("https://docs.google.com/document/d/18xVLgwhixugbfBVQBO_67aRre4vrr4mAJMAV-y4PCJ8/edit?usp=sharing");
  }
});


// base endpoint
app.get("/", (req, res) => {
  // console.log(req);
  res.status(200).send("blank").end();
});

// Endpoint for Google Drive push notifications
app.post("/notifications", (req, res) => {
  console.log("PUSH NOTIFICATION RECEIVED");
  console.log(req.get("x-goog-resource-state"));
  if (req.get("x-goog-resource-state") == "update") {
    if (req.get("x-goog-changed").includes("content")) {
      console.log("Possible update detected...");
      var now = new Date();
      getLastRevisionTime().then((res) => {
        var revTime = Date.parse(res);
        var timeDiff = (now - revTime) / 1000;
        console.log(timeDiff);
        console.log(refreshMargin);
        if (timeDiff < refreshMargin) {
          console.log("Update confirmed");
          if (lastMsgSend == 0) {
            lastMsgSend = now;
            sendUpdateMsg();
          } else {
            var lstMsgTimeDiff = (now - lastMsgSend) / 1000;
            if (lstMsgTimeDiff > refreshMargin ) {
              lastMsgSend = now;
              sendUpdateMsg();
            } else {
              console.log("Message not sent, too soon since last message");
            }
          }
        } else {
          console.log("Update not detected, just Google mucking with stuff");
        }
      });
    }
  }
});


app.get("/notifications", (req, res) => {
  res.status(200).send("notif").end();
});

// drive auth functions
async function authorize() {
  // Check if we have previously  stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return console.log("Error reading token file");
    oAuth2Client.setCredentials(JSON.parse(token));
    driveWatchRequest(oAuth2Client);
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
          console.log(body);
      }
  });
}

function renewPush() {
  authorize();
}

async function getLastRevisionTime() {
  const res = await drive.revisions.list({
    auth: oAuth2Client,
    "fileId": fileId,
  });

  var length = res.data.revisions.length;
  var rev = res.data.revisions[length - 1];
  return rev.modifiedTime;
}

function sendUpdateMsg() {
  var message = "A update has occurred. Check the update at https://docs.google.com/document/d/18xVLgwhixugbfBVQBO_67aRre4vrr4mAJMAV-y4PCJ8/edit?usp=sharing";
  channels.forEach((channel) => {
    channel.send(message)
  });
  console.log("UPDATE MESSAGE SENT");
}
