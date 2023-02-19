"use strict";
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { RichEmbed } = require('../../../json/definitions.json');
const mongoose = require("mongoose");
const db = mongoose.connection;
const RI_COOLDOWN = new Set();

const boolean = {
    true: "Yes",
    false: "No"
};

const DateOptions = {
    weekday: "long",
    day: "numeric",
    year: "numeric",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
};

module.exports = {
    name: "role-info",
    category: "moderator",
    description: "Get information about a particular role.",
    usage: "[command] [role]",
    aliases: [],
    cooldown: 15000,//15s
    permissions: {
        bot: [],
        user: []
    },
    execute(client, message, args){
        if(RI_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 15s after using this command to use it again.").catch(() => void(0));
        
        db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
            if(!document === true) return;
            if(document.moderator.active === false) return;
            RI_COOLDOWN.add(message.author.id);

            if(message.member.permissions.has([PermissionsBitField.Flags.Administrator]) === false){
                const userRoles = message.member.roles.cache.map(role => role.id);
                const modRoles = document.moderator["roles"];

                if(userRoles.some(roleId => modRoles.includes(roleId)) === false){
                    return message.channel.send(`${message.author}, you can't use that.`).catch(() => void(0));
                };
            };
        
            const taggedRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
            if(!taggedRole) return message.channel.send("Role not found!");
        
            const Embed = new EmbedBuilder()
            .setColor(RichEmbed.color)
            .setTimestamp()
            .setDescription(`
            **Role:** ${taggedRole}
            **ID:** \`${taggedRole.id}\`
            **Users:** \`${taggedRole.members.size}\`
            **Color:** \`${taggedRole.hexColor}\`
            **Display separately:** \`${boolean[taggedRole.hoist]}\`
            **Mentionable:** \`${boolean[taggedRole.mentionable]}\`
            **Created on:** \`${new Date(taggedRole.createdAt).toLocaleString("en-US", DateOptions)}\``)
            .setFooter({text: message.author.username, iconURL: message.author.displayAvatarURL()});
            
            message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
        
        }).catch(() => void(0));
        setTimeout(() => RI_COOLDOWN.delete(message.author.id), this.cooldown);
    }
};