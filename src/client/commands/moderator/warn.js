"use strict";
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { RichEmbed } = require('../../../json/definitions.json');
const mongoose = require("mongoose");
const db = mongoose.connection;
const WARN_COOLDOWN = new Set();

module.exports = {
    name: "warn",
    category: "moderator",
    description: "Warns a user.",
    usage: "[command] [member] (optional reason)",
    aliases: [],
    cooldown: 30000,//30s;
    permissions: {
        bot: [],
        user: []
    },
    execute(client, message, args, system){
        if(system !== true){
            if(WARN_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 30s after using this command to use it again.").catch(() => void(0));
            
            db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
                if(!document === true) return;
                if(document.moderator.active === false) return;
                WARN_COOLDOWN.add(message.author.id);
            
                const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
                if(!user) return message.channel.send("Member not found").catch(() => void(0));
                if(user.permissions.has([PermissionsBitField.Flags.Administrator])) return message.channel.send("You can't warn a administrator.").catch(() => void(0));
                
                const userRoles = user.roles.cache.map(role => role.id);
                const modRoles = document.moderator["roles"];
                if(userRoles.some(roleId => modRoles.includes(roleId))) return message.channel.send("You can't warn a moderator.").catch(() => void(0));
                
                if(user.id === message.author.id) return message.channel.send("You can't warn yourself.").catch(() => void(0));
                
                if(message.member.permissions.has([PermissionsBitField.Flags.Administrator]) === false){
                    const roles = message.member.roles.cache.map(role => role.id);
                    if(modRoles.some(roleId => roles.includes(roleId)) === false){
                        return message.channel.send(`${message.author}, you can't use that.`).catch(() => void(0));
                    };
                };
            
                const reason = args.slice(1).join(" ") || "Unspecified";
                if(reason.length > 512) return message.channel.send("The maximum length of reason is 512.").catch(() => void(0));
                
                const searchUserId = document.users.findIndex(search => search.id === user.id);
            
                const Embed = new EmbedBuilder()
                .setColor(RichEmbed.color)
                .setAuthor({ name: `${user.user.tag} has been warned`, iconURL: user.displayAvatarURL({ format: "png", size: 256 })})
                .setDescription(`**Reason:** ${reason}`)
                
                const newInfraction = {reason: reason, createdTimestamp: Date.now()};
            
                if(searchUserId > -1){
                    db.collection("guilds").updateOne({_id: message.guild.id, "users.id": user.id}, {
                        "$push": {
                            ["users.$.infractions"]: {
                                "$each": [newInfraction],
                                "$position": 0
                            }
                        }
                    }).then(() => {
                        message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
                    }).catch(() => void(0));
                }else if(searchUserId === -1){
                    const newGuildUserSchema = {
                        id: user.id,
                        infractions: [newInfraction],
                        level: 0,
                        xp: 0
                    };
                
                    db.collection("guilds").updateOne({_id: message.guild.id}, {"$push": {users: newGuildUserSchema}}).then(() => {
                        message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
                    }).catch(() => void(0));
                };
            }).catch(() => void(0));
            setTimeout(() => WARN_COOLDOWN.delete(message.author.id), this.cooldown);
        }else if(system === true){
            db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
                if(!document === true) return;
            
                const user = message.guild.members.cache.get(args[0]);
                if(!user) return;
            
                const reason = args.slice(1).join(" ") || "Unspecified";
                if(reason.length > 512) return;
                
                const searchUserId = document.users.findIndex(search => search.id === user.id);
            
                const Embed = new EmbedBuilder()
                .setColor(RichEmbed.color)
                .setAuthor({ name: `${user.user.tag} has been warned`, iconURL: user.displayAvatarURL({ format: "png", size: 256 })})
                .setDescription(`**Reason:** ${reason}`)
                
                const newInfraction = {reason: reason, createdTimestamp: Date.now()};
            
                if(searchUserId > -1){
                    db.collection("guilds").updateOne({_id: message.guild.id, "users.id": user.id}, {
                        "$push": {
                            ["users.$.infractions"]: {
                                "$each": [newInfraction],
                                "$position": 0
                            }
                        }
                    }).then(() => {
                        message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
                    }).catch(() => void(0));
                }else if(searchUserId === -1){
                    const newGuildUserSchema = {
                        id: user.id,
                        infractions: [newInfraction],
                        level: 0,
                        xp: 0
                    };
                
                    db.collection("guilds").updateOne({_id: message.guild.id}, {"$push": {users: newGuildUserSchema}}).then(() => {
                        message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
                    }).catch(() => void(0));
                };
            }).catch(() => void(0));
        };
    }
};
