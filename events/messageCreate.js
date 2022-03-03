"use strict";
const { prefix } = require('../src/json/definitions.json');
const database = require('../src/js/database.js');
const mongoose = require("mongoose");
const db = mongoose.connection;
const XP = {
    COOLDOWN: new Set(),
    GENERATE: function({ min=15, max=25, rate=1 } = {}){
        this.min = Math.ceil(min);
        this.max = Math.floor(max);
        this.rate = rate;
        return Math.floor((Math.floor(Math.random() * (this.max - this.min + 1)) + this.min) * this.rate);
    },
    REQUIRED: function({ level=999 } = {}){
        this.required = 5 * (level * level) + (50 * level) + 100;
        return this.required;
    }
};

module.exports = {
    name: "messageCreate",
    once: false,
    execute(client, message){
        try{
            if(!message.content.startsWith(prefix) || message.author.bot) return;
            const args = message.content.slice(prefix.length).trim().split(/\s+/g);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            
            if(!command) return;console.log(commandName);

            command.execute(client, message, args);
        }catch(error){
            console.error(error);
            message.reply("Oops... an unexpected error occurred!").catch(() => void(0));
        }finally{

            if(message.author.bot) return;
        
            /* ------- XP/LEVELS ------- */
            if(XP.COOLDOWN.has(message.author.id) === false){
                db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
                    
                    if(!!document === true){
                        
                        if(document.levels.active === false) return;
                        if(document.levels.xp.blacklist.channels.includes(message.channel.id)) return;
                        const roles = message.member.roles.cache.map(role => role.id);
                        if(document.levels.xp.blacklist.roles.some(element => roles.includes(element))) return;

                        const searchAuthorId = document.users.findIndex(search => search.id === message.author.id);

                        if(searchAuthorId > -1){
                            const UserData = document.users[searchAuthorId];
                            const CurrentXP = UserData.xp + XP.GENERATE({rate: document.levels.xp.rate});
                            const RequiredXP = XP.REQUIRED({level: UserData.level});
                        
                            if(CurrentXP >= RequiredXP){
                                //passed level;
                                const UserLevel = UserData.level + 1;
                                db.collection("guilds").updateOne({_id: message.guild.id, "users.id": message.author.id}, {
                                //db.collection("guilds").updateOne({_id: message.guild.id}, {
                                    "$set": {
                                        [`users.$.level`]: UserLevel,
                                        [`users.$.xp`]: 0
                                        //[`users.${searchAuthorId}.level`]: UserLevel,
                                        //[`users.${searchAuthorId}.xp`]: 0
                                    }
                                }).then(() => {
                                    if(document.levels.announce.active === false) return;
                                    const messageContent = document.levels.announce.message.replace(/{user}/g, message.author).replace(/{level}/g, UserLevel);
                                    if(document.levels.announce.channel.current){
                                        message.channel.send(messageContent).catch(() => void(0));//missing permissions;
                                    }else{
                                        const channel = message.guild.channels.cache.get(document.levels.announce.channel.customId);
                                        if(!channel === false) channel.send(messageContent).catch(() => void(0));//missing permissions;
                                    };
                                }).catch(console.log);

                                //levelroles;
                                if(message.guild.me.permissions.has("MANAGE_ROLES") === false) return;
                            
                                if(document.levels.levelroles.rewards.length === 0) return;
                                const searchRewardIndex = document.levels.levelroles.rewards.findIndex(search => search.level === UserLevel);
                                if(searchRewardIndex === -1) return;
                            
                                if(document.levels.levelroles.rewards[searchRewardIndex].roles.length === 0) return;
                                
                                document.levels.levelroles.rewards[searchRewardIndex].roles.forEach(roleId => {
                                    const role = message.guild.roles.cache.get(roleId);
                                    if(!role === false) message.member.roles.add(role).catch(() => void(0));//missing permissions;
                                });
                            
                                if(document.levels.levelroles.removePrevious === false) return;
                                const searchPreviousIndex = document.levels.levelroles.rewards.findIndex(search => search.level === UserLevel - 1);
                                if(searchPreviousIndex === -1) return;
                                if(document.levels.levelroles.rewards[searchPreviousIndex].roles.length === 0) return;
                            
                                document.levels.levelroles.rewards[searchPreviousIndex].roles.forEach(roleId => {
                                    if(message.member.roles.cache.has(roleId) === false) return;
                                    const role = message.guild.roles.cache.get(roleId);
                                    if(!role === false) message.member.roles.remove(role).catch(() => void(0));//missing permissions;
                                });
                            }else{
                                //add xp;
                                db.collection("guilds").updateOne({_id: message.guild.id, "users.id": message.author.id}, {
                                //db.collection("guilds").updateOne({_id: message.guild.id}, {
                                    "$set": {
                                        [`users.$.xp`]: CurrentXP
                                        //[`users.${searchAuthorId}.xp`]: CurrentXP
                                    }
                                }).catch(console.log);
                            };
                            //to avoid spamming, earning xp is limited to 1 message per minute.
                            XP.COOLDOWN.add(message.author.id);
                            setTimeout(() => XP.COOLDOWN.delete(message.author.id), 60000);//1 min;
                        }else if(searchAuthorId === -1){
                            const newGuildUserSchema = {
                                id: message.author.id,
                                infractions: [],//{"reason": "...", "createdTimestamp": 1644189843611};
                                level: 0,
                                xp: 0
                            };
                            db.collection("guilds").updateOne({_id: message.guild.id}, {"$push": {users: newGuildUserSchema}}).catch(console.log);
                        };
                    }else{
                        const server = new database.Guilds({
                            _id: message.guild.id
                        });
                        server.save();
                    };
                
                }).catch(console.log);
            };

            /* ------- ANTI-INVITES ------- */
            console.log("passou");
        };
    }
};