"use strict";
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "avatar",
    category: "utility",
    description: "Get the avatar of the tagged user(s), or your own avatar.",
    usage: "[command] (optional member)",
    aliases: [],
    cooldown: 30000,//30s;
    execute(client, message){
        if(!message.mentions.users.size){
            sendAvatar(message.author);
        }else{
            message.mentions.users.forEach(user => sendAvatar(user));
        };
        
        function sendAvatar(user){
            const Embed = new MessageEmbed()
            .setTitle(user.tag)
            .setDescription(`[**Avatar URL**](${user.displayAvatarURL()})`)
            .setImage(user.displayAvatarURL({ format: "png", size: 256 }))

            message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
        };
    }
};