// commands.js

//
const auth = require('./auth.json');
const YOUTUBE_API_KEY = auth['youtube_api_key'];

// Import modules
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const request = require('request');

// Global vars

// Music variables
// Keep a queue of songs to playStream
var audioQueue = [];
var audioConn = null;
var audioHandler = null;
var audioVolume = 0.3;
var audioPaused = false;
var audioCurrent = null;
var audioRepeat = false;

module.exports = {
	'change-name': {
		name: 'change-name',
		process: (msg, args) => {
			msg.client.user.setUsername(args);
		}
	},
/*
	'create-channel': {
		name: 'create-channel',
		process: (msg, args) => {
			var channelType = args.split(' ')[0];
			
			if (channelType === 'voice' || channelType === 'text') {
				msg.guild.createChannel(args.substring(channelType.length + 1), channelType);
			} else {
				msg.guild.createChannel(args, 'text');
			}
		}
	},
	'delete-channel': {
		name: 'delete-channel',
		process: (msg, args) => {
			var channelType = args.split(' ')[0];
			
			if (channelType === 'voice') {
				var channelName = args.substring(channelType.length + 1);
				for (let [channelId, channel] of msg.guild.channels) {
					if (channel.name === channelName && channel instanceof Discord.VoiceChannel) {
						channel.delete();
						break;
					}
				}
			} else if (channelType === 'text') {
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
*/
    'move' : {
		name: 'move',
		process: (msg) => {
			var voiceChannel = msg.guild.members.get(msg.author.id).voiceChannel;
			if (voiceChannel) {
				voiceChannel.join().then(conn => {
					audioConn = conn;
				}).catch(console.error);
			}
		}
	},
	'now-playing': {
		name: 'now-playing',
		shortcut: 'np',
		process: (msg) => {
			msg.channel.sendEmbed({
				color: 3447003,
				author: {
					name: 'Now Playing:',
				},
				thumbnail: {
					url: audioCurrent['thumbnail'],
				},
				title: audioCurrent['title'],
				url: audioCurrent['url'],
				footer: {
					text: 'Vol: ' + audioVolume * 100 + ' | Req: ' + audioCurrent['requester'],
				}
			});
		}
	},
	'list-queue': {
		name: 'list-queue',
		shortcut: 'lq',
		process: (msg) => {
			if (audioQueue.length === 0 && audioCurrent === null) {
				const embed = new Discord.RichEmbed()
				  .setDescription(`${msg.author}, I don't have music queued.`);
				
				msg.channel.send('', {embed : embed});
			} else {
				const embed = new Discord.RichEmbed()
				  .setColor(0xFF8243)
				  .setThumbnail('https://i.imgur.com/doEnUr3.png')
				  .setAuthor('Music Queue - Mango Beats','https://i.imgur.com/RKT5C86.png')
				  .setDescription(`Now: [${audioCurrent.title}](${audioCurrent.url})\n${audioCurrent.requester}`);
				  
				if (audioRepeat) {
					embed.setFooter('Repeat: True');
				} else {
					embed.setFooter('Repeat: False');
				}
				
				var i = 1;	
				for (let songInfo of audioQueue) {
					embed.addField('\u200B', `${i}. [${songInfo.title}](${songInfo.url})\n${songInfo.requester}`);
					i++;
					if (i === 25) break;
				}
				
				msg.channel.send('', {embed : embed});
			}
		}
	},
	'queue': {
		name: 'queue-song',
		process: (msg, args) => {
			// TODO: Regex for playlist / Youtube Search
			searchSong(msg, args);
		}
	},
	'queue-playlist': {
		name: 'queue-playlist',
		usage: './queue-playlist <playlist-url>';
		process: (msg, args) => {
			var re = /https?:\/\/www.youtube.com\/playlist\?list\=(\w+)$/;
			var result = re.exec(args);
			
			if (result.length !== 2) {
				msg.reply(`Error: expecting usage ./queue-playlist <playlist-url>. Incorrect arguments`);
			}
			
			request('https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=' + result[1] + '&fields=items%2FcontentDetails%2FvideoId&key=' + YOUTUBE_API_KEY, (err, res, body) => {
				var json = JSON.parse(body);
		
				if ('error' in json) {
					msg.reply('Error: failed to parse json for queue-playlist');
				} else if (json.items.length === 0) {
					msg.reply('Error: parsed json produces empty array for queue-playlist');
				} else {
					//msg.reply(json.items[0].id['videoId']);
					for (let item of json.items) {
						queueSong(msg, 'https://www.youtube.com/watch?v=' + item.contentDetails['videoId']);
					}
				}
			});
		}
	},
	'remove-song': {
		name: 'remove-song',
		process: (msg, args) => {
			var i = args - 1;
			
			if ((i < 0 || i >= audioQueue.length) && !isNaN(i)) {
				msg.reply('Error: ./remove-song expecting number, either invalid value given or not a number');
				return;
			}
			
			var removed = audioQueue.splice(i, 1);
			msg.reply(' Removed: ' + removed[0]['title']);
		}
	},
	'skip-song': {
		name: 'skip-song',
		process: () => {
			audioHandler.end('skip-song');
		}
	},
	'set-volume': {
		name: 'set-volume',
		process: (msg, args) => {
			if (isNaN(args)) {
				msg.reply('Error: ./set-volume expecting a number. Incorrect args');
			} else if (args < 0 || args > 100) {
				msg.reply('Error: ./set-volume expecting a number between 0 and 100')
			} else {
				audioVolume = args / 100;
				if (audioHandler !== null) {
					audioHandler.setVolume(audioVolume);
				} 
			}
		}
	},
	'pause': {
		name: 'pause',
		process: (msg) => {
			if (audioPaused) {
				audioPaused = false;
				audioHandler.resume();
			} else {
				audioPaused = true;
				audioHandler.pause();
			}
		}
	},
	'reorder-song': {
		name: 'reorder-song',
		process: (msg, args) => {
			if (args.split[","].length !== 2) {
				msg.reply('Error: expecting usage ./reorder-song x,y incorrect args');
			}
			
			var x = args.split(",")[0];
			var y = args.split(",")[1];
			
			x = x - 1;
			y = y - 1;
			
			if (!isNaN(x) || !isNan(y)) {
				return;
			}
			
			var temp = audioQueue[x];
			audioQueue(x, 1);
			audioQueue(y, 0, temp);
		}
	},
	'set-repeat': {
		name: 'repeat',
		process: (msg) => {
			if (audioRepeat) {
				audioRepeat = false;
				msg.channel.send('Repeating Playlist: Off');
			} else {
				audioRepeat = true;
				msg.channel.send('Repeating Playlist: On');
			}
		}
	},
	'shuffle': {
		name: 'shuffle',
		process: (msg) => {
			var i = audioQueue.length;
			
			while (i > 0) {
				let it = Math.floor(Math.random() * i);
				
				it--;
				
				let temp = audioQueue[i];
				audioQueue[i] = audioQueue[it];
				audioQueue[it] = temp;
			}
		}
	}
};

function searchSong(msg, args) {
	request('https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=5&order=relevance&q=' + encodeURIComponent(args) + '&key=' + YOUTUBE_API_KEY, (err, res, body) => {
		var json = JSON.parse(body);
		
		if ('error' in json) {
			msg.reply(`Error parsing request for ${args}`);
		} else if (json.items.length === 0) {
			msg.reply('Error finding results for ${args}');
		} else {
			queueSong(msg, 'https://www.youtube.com/watch?v=' + json.items[0].id['videoId']);
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
			msg.reply('Error: unable to get information for song');
		} else {
			var songInfo = {
				title: info['title'], 
				url: info['video_url'], 
				thumbnail: info['thumbnail_url'], 
				requester: msg.author.username,
			}	
			
			audioQueue.push(songInfo);
			
			const embed = new Discord.RichEmbed()
			  .setColor(0xFF8243)
			  .setAuthor(`Queue Song: #${audioQueue.length}`)
			  .setThumbnail(songInfo['thumbnail'])
			  .setTitle(songInfo['title'])
			  .setURL(songInfo['url']);
			  
			msg.channel.send('', {embed : embed});
			
			if (audioHandler === null && audioQueue.length === 1) {
				playNextSong();
			}
		}
	});
}

function playNextSong() {
	var song = audioQueue[0]['url'];
	
	var stream = ytdl(song, {filter : 'audioonly'});
	setTimeout(() => {
		audioHandler = audioConn.playStream(stream, {volume: audioVolume});
		audioCurrent = audioQueue[0];
	
		audioHandler.once('end', reason => {
			audioHandler = null;
			if (audioRepeat) {
				audioQueue.push(audioCurrent);
			}
			if (audioQueue.length !== 0 && !audioPaused) {
				playNextSong();
			}
		});
		
		audioQueue.splice(0, 1);
	}, 1000);
}