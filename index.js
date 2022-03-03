"use strict";
const { Client, Intents, Collection} = require("discord.js");
const { token } = require('./src/json/definitions.json');
const fs = require("fs");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES
    ]
});
client.commands = new Collection();

fs.readdir("./commands/", (error, folders) => {
    if(error) return console.error(error);

    for(const folder of folders){
        fs.readdir(`./commands/${folder}`, (error, files) => {
            if(error) return console.error(error);

            const commandFiles = files.filter(file => file.endsWith(".js"));

            for(const file of commandFiles){
                const command = require(`./commands/${folder}/${file}`);
                client.commands.set(command.name, command);
            };
        });
    };
});

fs.readdir("./events/", (error, files) => {
    if(error) return console.error(error);

    const eventFiles = files.filter(file => file.endsWith(".js"));

    for(const file of eventFiles){
        const event = require(`./events/${file}`);
        if(event.once === true){
            client.once(event.name, (...args) => event.execute(client, ...args));
        }else if(event.once === false){
            client.on(event.name, (...args) => event.execute(client, ...args));
        };
    };
});

client.login(token);