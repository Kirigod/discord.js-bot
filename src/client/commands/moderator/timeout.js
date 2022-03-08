"use strict";
const { MessageEmbed } = require("discord.js");
const { RichEmbed } = require('../../../json/definitions.json');
const mongoose = require("mongoose");
const db = mongoose.connection;
const TIMEOUT_COOLDOWN = new Set();

module.exports = {
    name: "timeout",
    category: "moderator",
    description: "Members who are in timeout are temporarily not allowed to chat or react in text channels. They are also not allowed to connect to voice or Stage channels.",
    usage: "[command] [member] [duration] (optional reason)",
    aliases: [],
    cooldown: 30000,//30s;
    permissions: {
        bot: ["MODERATE_MEMBERS"],
        user: ["MODERATE_MEMBERS"]
    },
    execute(client, message, args){
        if(TIMEOUT_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 30s after using this command to use it again.").catch(() => void(0));

        db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
            if(!document === true) return;
            if(document.moderator.active === false) return;
            TIMEOUT_COOLDOWN.add(message.author.id);
            
            const user = message.mentions.members.first();
            if(!user) return message.channel.send("Member not found").catch(() => void(0));
            if(user.permissions.has("ADMINISTRATOR")) return message.channel.send("You can't timeout a administrator.").catch(() => void(0));
            
            const userRoles = user.roles.cache.map(role => role.id);
            const modRoles = document.moderator["roles"];
            if(userRoles.some(roleId => modRoles.includes(roleId))) return message.channel.send("You can't timeout a moderator.").catch(() => void(0));
            
            if(user.id === message.author.id) return message.channel.send("You can't timeout yourself.").catch(() => void(0));
            
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
        
            const duration = args[1]?.match(/\d+|\D+/g) || [0, null];
            const reason = args.slice(2).join(" ") || null;
            if(reason.length > 512) return message.channel.send("The maximum length of reason is 512.").catch(() => void(0));

            const timeout = {
                max: 2419200000,//28d;
                min: 600000,//10m;
                timer: {
                    "d": 86400000,
                    "h": 3600000,
                    "m": 60000
                }
            };
        
            const time = Math.floor(duration[0]);
            const type = duration[1];
        
            const FinalTime = time * timeout.timer[type];
        
            if(!time === true || !timeout.timer[type] === true || FinalTime < timeout["min"] || FinalTime > timeout["max"]){
                const Embed = new MessageEmbed()
                .setColor(RichEmbed.color)
                .setTitle("Invalid time format!")
                .addField("Duration:", "**min:** ``10m``\n**max:** ``28d``")
                .setDescription("**Example format:**\n``10d`` => 10 days\n``10h`` => 10 hours\n``10m`` => 10 minutes")
                
                return message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
            };
        
            message.guild.members.cache.get(user.id).timeout(FinalTime, reason).then(() => {
                message.channel.send(`${user} timed out for ${time}${type}.`).catch(() => void(0));
            }).catch(() => void(0));
    
        }).catch(() => void(0));
        setTimeout(() => TIMEOUT_COOLDOWN.delete(message.author.id), this.cooldown);
    }
};