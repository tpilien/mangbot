// Import the discord.js module
const Discord = require('discord.js');

// Const variables
const PREFIX = "mang";
const COMMAND_LENGTH = 10;
const ARGS_LENGTH = 10;

var auth = require("./auth.json");
var cmds = require("./commands.js");

// Create an instance of a Discord Client
const client = new Discord.Client();

// The token of your bot - https://discordapp.com/developers/applications/me
const token = 'MzA2MDMxMjIzODMzMjMxMzYx.C999ig.NB6kq7WLY4SQmw_NJkM-Ii1x0rA';

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
  console.log('I am ready!');
});

// Create an event listener for messages
//client.on('message', message => {
//  // If the message is "ping"
//  if (message.content === 'ping') {
//    // Send "pong" to the same channel
//    message.channel.send('pong');
//  }
//});

// Get the "manglist"
//client.on('message', message => {
//	if (message.content === 'mang getmanglist') {
//		message.channel.send('https://docs.google.com/document/d/1qjX9pKGQUYlWpQagI5fSbEdxuF6ZE97i3dh-Po1g2OQ/edit?usp=sharing');
//	}
//});

// process messages
client.on('message', msg => {
	// make sure bot can't read from itself
	if (msg.author == client.user) {
		return;
	}
	
	// check to make sure message is a command
	var msgPrefix = msg.content.split(" ")[0];
	if (msgPrefix === PREFIX) {
		// find out what command is being sent
		var msgCmd = msg.content.split(" ")[1];
		
		msg.channel.send("Mang Bot Received Command: " + msgCmd + " Arguments: " + "'" + msg.content.substring(msgPrefix.length + msgCmd.length + 2) + "'");
		if (cmds[msgCmd]) {
			cmds[msgCmd].process(msg);
		}
	}
});

// Log our bot in
client.login(token);