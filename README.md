## Table of contents

- [About](#about)
- [Installation](#installation)
- [Database](#database)
- [Optional Tools](#optional-tools)
- [Basic Settings](#basic-settings)
- [Contributing](#contributing)

## About

A powerful JavaScript open source bot to make your Discord server a better place.

## Installation

**[Node.js](https://nodejs.org) 16.9.0 or newer is required.**

Install all required dependencies: `npm install` (only needed before first use)

## Database

This project uses a local **[MongoDB](https://www.mongodb.com/try/download/community)** database, you can change the default configuration to access an external database, but if you don't want it, it's not necessary, the only thing needed is extract the `mongod.zip` file located in this directory `src/www/mongodb/bin`. Then when starting the bot, a local server on `http://localhost:27017` will be started and the database will connect to it.

## Optional Tools

I strongly recommend the **[MongoDB Compass](https://www.mongodb.com/try/download/compass)** tool; with it you can connect to your database at `http://localhost:27017` and view/edit the database structures easily, and in future updates if the structure changes, with this tool you can export the current data as **JSON**. Then you can update to the new model and deploy the data in the updated format to the database easily and with visual feedback.

## Basic Settings

In the **[Discord Developer Portal](https://discord.com/developers/applications)** you can create a new bot account, if you have doubts about how to configure it correctly, just do a brief search on how to do this; there you will get your bot's **token**, and after copying the token go to this directory `src/json`, open the `definitions.json` file and replace `<your-token-goes-here>` with your bot token, by the way... never share this token with anyone.
<br><br>
Ready? Your bot can now be started. Go to your terminal of choice, access the root directory of the code, and use the command `npm start`. Then after that, check if your bot is online (this may take a few seconds or minutes), and if so, you can see the list of commands by typing `k!help`. Remember to always give the necessary permissions so that your bot can perform the actions correctly.

## Contributing

Before creating an issue, please ensure that it hasn't already been reported/suggested!<br>
The issue tracker is only for bug reports and enhancement suggestions. If you have a question, please ask it in the **[Discord server](https://discord.gg/4D5TtFSWPZ)** instead of opening an issue – you will be redirected there anyway.