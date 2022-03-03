"use strict";
const { MessageEmbed } = require("discord.js");
const { RichEmbed } = require('../../src/json/definitions.json');
const mongoose = require("mongoose");
const db = mongoose.connection;
const KICK_COOLDOWN = new Set();

module.exports = {
    name: "kick",
    category: "moderator",
    description: "Kick the user from the server. (Will be able to rejoin again with a new invite.)",
    usage: "[command] [member] (optional reason)",
    aliases: [],
    cooldown: 30000,//30s;
    permissions: {
        bot: ["KICK_MEMBERS"],
        user: ["KICK_MEMBERS"]
    },
    execute(client, message, args){
        if(KICK_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 30s after using this command to use it again.").catch(() => void(0));
        
        db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
            if(!document === true) return;
            if(document.moderator.active === false) return;
            KICK_COOLDOWN.add(message.author.id);

            const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if(!user) return message.channel.send("Member not found").catch(() => void(0));
            if(user.permissions.has("ADMINISTRATOR")) return message.channel.send("You can't kick a administrator.").catch(() => void(0));
            
            const userRoles = user.roles.cache.map(role => role.id);
            const modRoles = document.moderator["roles"];
            if(userRoles.some(roleId => modRoles.includes(roleId))) return message.channel.send("You can't kick a moderator.").catch(() => void(0));
            
            if(user.id === message.author.id) return message.channel.send("You can't kick yourself.").catch(() => void(0));
            
            if(user.roles.highest.rawPosition >= message.guild.me.roles.highest.rawPosition){
                return message.channel.send("I can't do that because my **highest role** is **too low** in the hierarchy.").catch(() => void(0));
            };

            if(message.member.permissions.has("ADMINISTRATOR") === false){
                const roles = message.member.roles.cache.map(role => role.id);
                if(modRoles.some(roleId => roles.includes(roleId)) === false){
                    const PERMISSION = this.permissions["user"].some(perm => {
                        if(!message.member.permissions.has(perm)){
                            return message.channel.send(`${message.author}, you can't use that.`).catch(() => void(0));
                        };
                    });
                    if(PERMISSION) return;
                };
            };
        
            if(message.guild.me.permissions.has("ADMINISTRATOR") === false){
                const PERMISSION = this.permissions["bot"].some(perm => {
                    if(!message.guild.me.permissions.has(perm)){
                        return message.channel.send(`I can't do that because I'm missing the **${perm}** permission.`).catch(() => void(0));
                    };
                });
                if(PERMISSION) return;
            };
            
            const reason = args.slice(1).join(" ") || "Unspecified";
            if(reason.length > 512) return message.channel.send("The maximum length of reason is 512.").catch(() => void(0));

            user.kick(reason).then(member => {
                const Embed = new MessageEmbed()
                .setColor(RichEmbed.color)
                .setAuthor({ name: `${member.user.tag} has been kicked`, iconURL: member.displayAvatarURL({ format: "png", size: 256 })})
                .setDescription(`**Reason:** ${reason}`)

                message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
            }).catch(() => void(0));
        }).catch(() => void(0));
        setTimeout(() => KICK_COOLDOWN.delete(message.author.id), this.cooldown);
    }
};