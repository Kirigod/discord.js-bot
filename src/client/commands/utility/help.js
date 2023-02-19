"use strict";
const { EmbedBuilder } = require("discord.js");
const { prefix, RichEmbed } = require('../../../json/definitions.json');

module.exports = {
    name: "help",
    category: "utility",
    description: "Get a list of all available commands.",
    usage: "[command] (optional command)",
    aliases: [],
    execute(client, message, args){

        if(args[0] === undefined){
            const Embed = new EmbedBuilder()
            .setTitle("Standard Commands")
            .setColor(RichEmbed.color)
            .setDescription(`\`${prefix}help [command]\` for more detailed info.`)
            .addFields(
                {
                    name: "moderator",
                    value: client.commands.filter(cmd => cmd.category === "moderator").map(cmd => `\`${cmd.name}\``).join(", ")
                },
                {
                    name: "utility",
                    value: client.commands.filter(cmd => cmd.category === "utility").map(cmd => `\`${cmd.name}\``).join(", ")
                }
            )
            .setFooter({text: message.author.username, iconURL: message.author.displayAvatarURL()})
            
            return message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
        };

        const command = client.commands.get(args[0]) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));

        if(command){
            const EmbedFields = [
                {
                    name: "Description:",
                    value: `\`${command.description}\``
                }
            ];
            if(!!command.usage) EmbedFields.push({name: "Usage:", value: `\`${command.usage.replace("[command]", `${prefix}${args[0]}`)}\``});
            if(command.aliases.length > 0) EmbedFields.push({name: "Aliases:", value: command.aliases.map(aliase => `\`${aliase}\``).join(", ")});
            
            const Embed = new EmbedBuilder()
            .setTitle("Help Menu")
            .setColor(RichEmbed.color)
            .addFields(EmbedFields)
            
            return message.channel.send({embeds: [ Embed ]}).catch(() => void(0));

        }else{

            return message.reply("Command not found!").catch(() => void(0));

        };
    }
};