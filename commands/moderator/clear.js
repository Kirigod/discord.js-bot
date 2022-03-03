"use strict";
const mongoose = require("mongoose");
const db = mongoose.connection;
const CLEAR_COOLDOWN = new Set();

module.exports = {
    name: "clear",
    category: "moderator",
    description: "Delete a channel's messages.",
    usage: "[command] (optional amount)",
    aliases: ["prune"],
    cooldown: 10000,//10s;
    permissions: {
        bot: ["MANAGE_MESSAGES"],
        user: ["MANAGE_MESSAGES"]
    },
    execute(client, message, args){
        if(CLEAR_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 10s after using this command to use it again.").catch(() => void(0));
        
        db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
            if(!document === true) return;
            if(document.moderator.active === false) return;
            CLEAR_COOLDOWN.add(message.author.id);
            
            if(!args[0]) return message.channel.send("Please specify the number of messages to clear.").catch(() => void(0));
            
            const amount = parseInt(args[0]);
            if(!amount) return message.channel.send("You need to input a number between 1 and 100.").catch(() => void(0));
            if(amount < 1 || amount > 100) return message.channel.send("You need to input a number between 1 and 100.").catch(() => void(0));

            const modRoles = document.moderator["roles"];
            
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

            message.delete().then(() => {
                message.channel.messages.fetch({ limit: amount }).then(fetched => {
    
                    const messagesToPrune = fetched.filter(message => !message.pinned);
                    return message.channel.bulkDelete(messagesToPrune, true).catch(() => void(0));
    
                }).then(pruned => {
    
                    const warn = pruned.size !== amount ? "\n\n`Because of Discord limitations I can't delete messages past 2 weeks.`" : "";
                    message.channel.send(`I have deleted \`${pruned.size} message${pruned.size !== 1 ? "s" : ""}\`!${warn}`).then(message => {
                        setTimeout(() => message.delete().catch(() => void(0)), 5000);//5s;
                    }).catch(() => void(0));
                
                }).catch(() => void(0));
            });
        }).catch(() => void(0));
        setTimeout(() => CLEAR_COOLDOWN.delete(message.author.id), this.cooldown);
    }
};