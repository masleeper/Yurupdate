# Yurupdate
Discord bot that checks a specific Google Doc for edits. On change, a message is sent to indicating a change. ~~This bot is hosted on GCP with a Node.js runtime using Express to take care of incoming HTTP requests.~~ This bot was formerly hosted on GCP's App Engine but is moved to a Raspberry Pi due to it costing me $70/month to run it, and my wallet didn't like that very much. Google's Drive API is used for checking of changes. Discord.js is used for all bot logic. 

## Usage
In order to add this bot to your server, you will need a discord account and a server in which you have permissions to manage. Once you have both, in your server create a text channel named "yurupdate" and then click this [link](https://discord.com/api/oauth2/authorize?client_id=714986525607198802&permissions=199680&scope=bot) to add the bot to your server.
