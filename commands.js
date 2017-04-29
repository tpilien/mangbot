// commands.js

// Import modules
const Discord = require('discord.js');
const ytdl = require('ytdl-core');

// Global vars
// Need dispatcher to control volume while streaming
var dispatcher = null;

// Music variables
// Keep a queue of songs to playStream
var audioQueue = [];
// Current playing song;
var audioCurrent;

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
	"list-queue": {
		name: "list-queue",
		process: (msg) => {
			for (let song of audioQueue) {
				msg.channel.sendMessage(song);
			}
		}
	},
	"queue-song": {
		name: "queue-song",
		process: (msg, args) => {
			var author = msg.author;
			var server = msg.guild;
			for (let [channelId, channel] of server.channels) {
				if (channel instanceof Discord.VoiceChannel) {
					for (let [memberId, member] of channel.members) {
						if (author.id === memberId) {
							channel.join()
							  .then(conn => {
								  // queue the song and play the first one
								  queueSong(args);
								  
								  if (audioQueue.length === 1) {
									playSong(conn, audioQueue[0]); 
								  }
								  								  
								  dispatcher.once('end', () => {
									var current = popSong();
									if (audioQueue.length >= 1) {
										playSong(conn, current);
									}
								  });
							  });
							break;
						}
					}
				}
			}
		}
	},
	"set-volume": {
		name: "set-volume",
		process: (msg, args) => {
			dispatcher.setVolume(args);
		}
	}
};

function queueSong(url) {
	audioQueue.push(url);
}

function popSong() {
	var song = audioQueue.shift();
	return song;
}

function playSong(conn, song) {
	const stream = ytdl(song, {filter : 'audioonly'});
	audioCurrent = song;
	
	dispatcher = conn.playStream(stream);
}