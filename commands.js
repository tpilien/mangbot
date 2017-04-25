// commands.js

// Import modules
const Discord = require('discord.js');
const ytdl = require('ytdl-core');

module.exports = {
	"ping": {
		name: "ping",
		process: (msg) => {
			msg.channel.send("pong!");
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