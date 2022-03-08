"use strict";
const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require("discord.js");
const { RichEmbed } = require('../../../json/definitions.json');
const mongoose = require("mongoose");
const db = mongoose.connection;
const IFCS_COOLDOWN = new Set();

module.exports = {
    name: "infractions",
    category: "moderator",
    description: "Shows a user's infraction history.",
    usage: "[command] [member]",
    aliases: [],
    cooldown: 15000,//15s;
    permissions: {
        bot: [],
        user: []
    },
    execute(client, message, args){
        if(IFCS_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 15s after using this command to use it again.").catch(() => void(0));

        db.collection("guilds").findOne({_id: message.guild.id}).then(document => {
            if(!document === true) return;
            if(document.moderator.active === false) return;
            IFCS_COOLDOWN.add(message.author.id);

            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if(!member) return message.channel.send("Member not found").catch(() => void(0));

            const modRoles = document.moderator["roles"];

            if(message.member.permissions.has("ADMINISTRATOR") === false){
                const roles = message.member.roles.cache.map(role => role.id);
                if(modRoles.some(roleId => roles.includes(roleId)) === false){
                    return message.channel.send(`${message.author}, you can't use that.`).catch(() => void(0));
                };
            };

            const searchUserIndex = document.users.findIndex((search) => search.id === member.id);
            const memberInfractions = document.users[searchUserIndex]?.infractions;
            if(searchUserIndex === -1 || memberInfractions?.length === 0){
                const Embed = new MessageEmbed()
                .setColor(RichEmbed.color)
                .setAuthor({ name: `${member.user.tag} has no infractions`, iconURL: member.displayAvatarURL({ format: "png", size: 256 })})

                return message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
            };

            const memberLast10Infractions = memberInfractions.slice(0, 10);
            const memberInfractionMAP = memberLast10Infractions.map((infraction, index) => {
                return `**${infraction.reason}** • <t:${Math.floor(infraction.createdTimestamp / 1000)}:R> [\`${index + 1}\`]`;
            });

            const Embed = new MessageEmbed()
            .setColor(RichEmbed.color)
            .setAuthor({ name: `${member.user.tag}'s infractions`, iconURL: member.displayAvatarURL({ format: "png", size: 256 })})
            .setDescription(`
            **Total:** \`${memberInfractions.length} infractions\`\n
            **Last 10 infractions:**
            ${memberInfractionMAP.join("\n")}`)

            const ButtonMessageAction = new MessageButton()
            .setCustomId("infractions-button")
            .setLabel("Manage Infractions")
            .setStyle("PRIMARY");
            const ButtonAction = new MessageActionRow()
			.addComponents(ButtonMessageAction);
            
            message.channel.send({embeds: [ Embed ], components: [ ButtonAction ]}).then(messageButton => {
                const button = messageButton.createMessageComponentCollector({ componentType: "BUTTON", time: 15000 });//15s;
                
                button.on("collect", async interaction => {
                    if(interaction.user.id !== message.author.id) return;
                    if(interaction.customId !== "infractions-button") return;
                    ButtonMessageAction.setDisabled(true);
                    interaction.deferUpdate();
                    
                    const memberInfractionActionRow = memberLast10Infractions.map((infraction, index) => {
                        return {
                            label: `remove infraction [${index + 1}]`,
                            description: "Select to remove this infraction.",
                            value: JSON.stringify({all: false, createdTimestamp: infraction.createdTimestamp})
                        };
                    });
                    
                    if(memberInfractionActionRow.length > 1) memberInfractionActionRow.push({
                        label: "[remove all infractions]",
                        description: "If selected, deletes all infractions for this user.",
                        value: JSON.stringify({all: true, userID: member.id, guildID: message.guild.id})
                    });

                    const ActionContent = new MessageSelectMenu()
                    .setCustomId("delete-infraction")
                    //.setPlaceholder("Nothing selected")
                    .addOptions([memberInfractionActionRow])
                    
                    const Action = new MessageActionRow()
                    .addComponents(ActionContent);
                    
                    messageButton.edit({ components: [ ButtonAction ] }).then(() => {
                        messageButton.reply({ components: [ Action ] }).then(messageData => {
                            const collector = messageData.createMessageComponentCollector({ componentType: "SELECT_MENU", time: 15000 });//15s;

                            collector.on("collect", interaction => {
                                if(interaction.user.id !== message.author.id) return;
                                if(interaction.customId !== "delete-infraction") return;
                                collector.stop();
                                const selected = memberInfractionActionRow.find(option => option.value == interaction.values);
                                if(selected){
                                    ActionContent.setPlaceholder(selected.label);
                                    messageData.edit({ components: [ Action ] }).catch(() => void(0));
                                };
                                const data = JSON.parse(interaction.values);

                                if(data["all"] === false){
                                    //remove only one infraction;
                                    db.collection("guilds").updateOne({_id: message.guild.id, "users.id": member.id}, {
                                        "$pull": {
                                            ["users.$.infractions"]: {
                                                "createdTimestamp": data.createdTimestamp
                                            }
                                        }
                                    }).then(() => {
                                        interaction.reply({ content: "Infraction deleted", ephemeral: false }).catch(() => void(0));
                                    }).catch(() => void(0));
                                }else if(data["all"] === true){
                                    //remove all infractions;
                                    db.collection("guilds").updateOne({_id: message.guild.id, "users.id": member.id}, {
                                        "$set": {
                                            ["users.$.infractions"]: []
                                        }
                                    }).then(() => {
                                        interaction.reply({ content: "Infractions deleted", ephemeral: false }).catch(() => void(0));
                                    }).catch(() => void(0));
                                };
                            });

                        }).catch(() => void(0));
                    }).catch(() => void(0));
                });

            }).catch(() => void(0));
        }).catch(() => void(0));
        setTimeout(() => IFCS_COOLDOWN.delete(message.author.id), this.cooldown);
    }
};