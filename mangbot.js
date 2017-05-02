// Import the discord.js module
const Discord = require('discord.js');

// Const variables
const PREFIX = "//";
const COMMAND_LENGTH = 10;
const ARGS_LENGTH = 10;

var auth = require("./auth.json");
var cmds = require("./commands.js");

// Create an instance of a Discord Client
const client = new Discord.Client();

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
  console.log('I am ready!');
});

// process messages
client.on('message', msg => {
	// make sure bot can't read from itself
	if (msg.author == client.user) {
		return;
	}
	
	// check to make sure message is a command
	var msgPrefix = msg.content.substring(0, PREFIX.length);
	if (msgPrefix === PREFIX) {
		// find out what command is being sent
		var msgCmd = msg.content.split(" ")[0].substring(PREFIX.length);
		var msgArgs = msg.content.substring(msgPrefix.length + msgCmd.length + 1);

		if (cmds[msgCmd]) {
			cmds[msgCmd].process(msg, msgArgs);
		}
	}
});

// Log our bot in
client.login(auth["bot_token"]);