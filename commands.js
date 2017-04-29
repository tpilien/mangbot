// commands.js

//
const auth = require("./auth.json");
const YOUTUBE_API_KEY = auth["youtube_api_key"];

// Import modules
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const request = require('request');

// Global vars
// Need dispatcher to control volume while streaming
var dispatcher = null;

// Music variables
// Keep a queue of songs to playStream
var audioQueue = [];
var audioConn = null;
var audioHandler = null;
var audioVolume = 0.3;
var audioCurrent = null;

module.exports = {
	"create-channel": {
		name: "create-channel",
		process: (msg, args) => {
			var channelType = args.split(" ")[0];
			
			if (channelType === "voice" || channelType === "text") {
				msg.guild.createChannel(args.substring(channelType.length + 1), channelType);
			} else {
				msg.guild.createChannel(args, 'text');
			}
		}
	},
	"delete-channel": {
		name: "delete-channel",
		process: (msg, args) => {
			var channelType = args.split(" ")[0];
			
			if (channelType === "voice") {
				var channelName = args.substring(channelType.length + 1);
				for (let [channelId, channel] of msg.guild.channels) {
					if (channel.name === channelName && channel instanceof Discord.VoiceChannel) {
						channel.delete();
						break;
					}
				}
			} else if (channelType === "text") {
				var channelName = args.substring(channelType.length + 1);
				for (let [channelId, channel] of msg.guild.channels) {
					if (channel.name === channelName && channel instanceof Discord.TextChannel) {
						channel.delete();
						break;
					}
				}				
			} else {
				for (let [channelId, channel] of msg.guild.channels) {
					if (channel.name === args) {
						channel.delete();
						break;
					}
				}
			}
		}
	},
	"now-playing": {
		name: "now-playing",
		process: (msg) => {
			msg.reply("Mang Bot is play: " + audioCurrent);
		}
	},
	"list-queue": {
		name: "list-queue",
		process: (msg) => {
			var res = "";
			
			if (audioQueue.size === 0 && audioCurrent === null) {
				res = "There ain't no songs queue mang!"
			} else {
				res += audioCurrent + "\n";
				for (let song of audioQueue) {
					res += song + "\n";
				}
			}
			
			msg.reply(res);
		}
	},
	"queue-song": {
		name: "queue-song",
		process: (msg, args) => {
			// TODO: Regex for playlist / Youtube Search
			queueSong(msg, args);
		}
	},
	"queue-yt": {
		name: "queue-yt",
		process: (msg, args) => {
			searchSong(msg, args);
		}
	},
	"remove-song:": {
		name: "remove-song",
		process: (msg, args) => {
			var removed = audioQueue.splice(args, 1);
			msg.reply("is remove" + removed);
		}
	},
	"skip-song": {
		name: "skip-song",
		process: () => {
			audioHandler.end('skip-song');
		}
	},
	"set-volume": {
		name: "set-volume",
		process: (msg, args) => {
			if (isNaN(args)) {
				msg.reply("Mang do you even int?");
			} else if (args < 0 || args > 100) {
				msg.reply("Mang these numbers are a bit spicy...")
			} else {
				audioVolume = args / 100;
				if (audioHandler !== null) {
					audioHandler.setVolume(audioVolume);
				} 
			}
		}
	}
};

function searchSong(msg, args) {
	request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=5&order=relevance&q=" + encodeURIComponent(args) + "&key=" + YOUTUBE_API_KEY, (err, res, body) => {
		var json = JSON.parse(body);
		
		if ("error" in json) {
			msg.reply("Mang I just got rekt!");
		} else if (json.items.length === 0) {
			msg.reply("Mang youtube don't have my thing");
		} else {
			//msg.reply(json.items[0].id["videoId"]);
			queueSong(msg, "https://www.youtube.com/watch?v=" + json.items[0].id["videoId"]);
		}
	});
}

function queueSong(msg, args) {
	if (audioConn === null) {
		var voiceChannel = msg.guild.members.get(msg.author.id).voiceChannel;
		if (voiceChannel) {
			voiceChannel.join().then(conn => {
				audioConn = conn;
			}).catch(console.error);
		}
	}
	
	ytdl.getInfo(args, (err, info) => {
		if (err) {
			msg.reply("Can't queue dis mang!");
		} else {
			audioQueue.push(args);
			if (audioHandler === null && audioQueue.length === 1) {
				playNextSong(info["title"]);
			}
		}
	});
}

function playNextSong(title) {
	var song = audioQueue[0];
	
	const stream = ytdl(song, {filter : 'audioonly'});
	audioHandler = audioConn.playStream(stream);
	audioHandler.setVolume(audioVolume);
	audioCurrent = title;
	
	audioHandler.once("end", reason => {
		audioHandler = null;
		if (audioQueue.length !== 0) {
			playNextSong();
		}
	});
	
	audioQueue.splice(0, 1);
}