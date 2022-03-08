"use strict";
const { MessageEmbed } = require("discord.js");
const { RichEmbed } = require('../../../json/definitions.json');
const mongoose = require("mongoose");
const db = mongoose.connection;
const SF_COOLDOWN = new Set();

const DateOptions = {
    weekday: "long",
    day: "numeric",
    year: "numeric",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
};

module.exports = {
    name: "server-info",
    category: "moderator",
    description: "Display info about this server.",
    usage: null,
    aliases: [],
    cooldown: 15000,//15s
    permissions: {
        bot: [],
        user: []
    },
    execute(client, message, args){
        if(SF_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 15s after using this command to use it again.").catch(() => void(0));
        
        db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
            if(!document === true) return;
            if(document.moderator.active === false) return;
            SF_COOLDOWN.add(message.author.id);

            if(message.member.permissions.has("ADMINISTRATOR") === false){
                const userRoles = message.member.roles.cache.map(role => role.id);
                const modRoles = document.moderator["roles"];

                if(userRoles.some(roleId => modRoles.includes(roleId)) === false){
                    return message.channel.send(`${message.author}, you can't use that.`).catch(() => void(0));
                };
            };
        
            const channels = {
                text: message.guild.channels.cache.filter(c => c.type === "GUILD_TEXT").size,
                voice: message.guild.channels.cache.filter(c => c.type === "GUILD_VOICE").size,
                category: message.guild.channels.cache.filter(c => c.type === "GUILD_CATEGORY").size
            };

            const Embed = new MessageEmbed()
            .setColor(RichEmbed.color)
            .setTimestamp()
            .setThumbnail(message.guild.iconURL())
            .setDescription(`
            **Name:** \`${message.guild.name}\`
            **ID:** \`${message.guild.id}\`
            **Owner:** <@!${message.guild.ownerId}>
            **Members:** \`${message.guild.memberCount}\`
            **Channels [${message.guild.channels.cache.size}]:**
            \`${channels["category"]}\` categories
            \`${channels["text"]}\` text
            \`${channels["voice"]}\` voice
            **Roles:** \`${message.guild.roles.cache.size}\`
            **Boost level:** \`${message.guild.premiumTier}\`
            **Number of Boosts:** \`${message.guild.premiumSubscriptionCount}\`
            **Created on:** \`${new Date(message.guild.createdAt).toLocaleString("en-US", DateOptions)}\``)
            .setFooter({text: message.author.username, iconURL: message.author.displayAvatarURL()});
            
            message.channel.send({embeds: [ Embed ]}).catch(() => void(0));

        }).catch(() => void(0));
        setTimeout(() => SF_COOLDOWN.delete(message.author.id), this.cooldown);
    }
};