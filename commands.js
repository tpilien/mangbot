// commands.js

// Import modules
const Discord = require('discord.js');
const ytdl = require('ytdl-core');

module.exports = {
	"create-channel": {
		name: "create-channel",
		process: (msg, args) => {
			msg.guild.createChannel(args, 'text');
		}
	},
	"delete-channel": {
		name: "delete-chhanel",
		process: (msg, args) => {
			for (let [channelId, channel] of msg.guild.channels) {
				if (channel.name === args) {
					channel.delete();
					break;
				}
			}
		}
	},
	"playdnb": {
		name: "playdnb",
		process: (msg) => {
			var author = msg.author;
			var server = msg.guild;
			for (let [channelId, channel] of server.channels) {
				if (channel instanceof Discord.VoiceChannel) {
					for (let [memberId, member] of channel.members) {
						if (author.id === memberId) {
							channel.join()
							  .then(conn => {
								  const stream = ytdl('https://www.youtube.com/watch?v=Mzgh0cLopck', {filter : 'audioonly'});
								  const dispatcher = conn.playStream(stream);
							  });
							break;
						}
					}
				}
			}
		}
	}
};