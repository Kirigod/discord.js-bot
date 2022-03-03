"use strict";
const { MessageEmbed } = require("discord.js");
const { prefix, RichEmbed } = require('../../src/json/definitions.json');

module.exports = {
    name: "help",
    category: "utility",
    description: "Get a list of all available commands.",
    usage: "[command] (optional command)",
    aliases: [],
    execute(client, message, args){

        if(args[0] === undefined){
            const Embed = new MessageEmbed()
            .setTitle("Standard Commands")
            .setColor(RichEmbed.color)
            .setDescription(`\`${prefix}help [command]\` for more detailed info.`)
            .addField("moderator", client.commands.filter(cmd => cmd.category === "moderator").map(cmd => `\`${cmd.name}\``).join(", "))
            .addField("utility", client.commands.filter(cmd => cmd.category === "utility").map(cmd => `\`${cmd.name}\``).join(", "))
            .setFooter({text: message.author.username, iconURL: message.author.displayAvatarURL()})
            
            return message.channel.send({embeds: [ Embed ]}).catch(() => void(0));
        };

        const command = client.commands.get(args[0]) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));

        if(command){
            const Embed = new MessageEmbed()
            .setTitle("Help Menu")
            .setColor(RichEmbed.color)
            .addField("Description:", `\`${command.description}\``)
            if(!!command.usage) Embed.addField("Usage:", `\`${command.usage.replace("[command]", `${prefix}${args[0]}`)}\``)
            if(command.aliases.length > 0) Embed.addField("Aliases:", command.aliases.map(aliase => `\`${aliase}\``).join(", "))
            
            return message.channel.send({embeds: [ Embed ]}).catch(() => void(0));

        }else{

            return message.reply("Command not found!").catch(() => void(0));

        };
    }
};