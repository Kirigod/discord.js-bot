"use strict";
const { MessageAttachment } = require("discord.js");
const Canvas = require("canvas");
const mongoose = require("mongoose");
const db = mongoose.connection;
const RANK_COOLDOWN = new Set();
const PresenceStatusColors = {
	"online": "#44b37f",//(green);
	"idle": "#ffa500",//(orange);
	"dnd": "#f14849",//(red);
	"offline": "#737e8c"//(grey);
};

module.exports = {
    name: "rank",
    category: "utility",
    description: "Get your rank or another user's rank.",
    usage: "[command] (optional member)",
    aliases: ["rk"],
    cooldown: 30000,//30s;
    permissions: {
        bot: ["ATTACH_FILES"],
        user: []
    },
    execute(client, message){
		if(RANK_COOLDOWN.has(message.author.id)) return message.channel.send("Wait 30s after using this command to use it again.").catch(() => void(0));
		
		db.collection("guilds").findOne({_id: message.guild.id}).then(async (document) => {
			if(!document === true) return;
			if(document.levels.active === false) return;
			RANK_COOLDOWN.add(message.author.id);
			
			if(message.guild.me.permissions.has("ADMINISTRATOR") === false){
                const PERMISSION = this.permissions["bot"].some(perm => {
                    if(!message.guild.me.permissions.has(perm)){
                        return message.channel.send(`I'm missing the **${perm}** permission.`).catch(() => void(0));
                    };
                });
                if(PERMISSION) return;
            };
			
			const canvas = Canvas.createCanvas(934, 282);
			const ctx = canvas.getContext("2d");
			
			const user = message.mentions.users.first() || message.author;
			if(user.bot) return message.channel.send(`${user} is a **bot**! Bots aren't invited to the party.`).catch(() => void(0));

			const searchUserIndex = document.users.findIndex((search) => search.id === user.id);
			if(searchUserIndex === -1) return message.channel.send(`**${user.username}** isn't ranked yet.`).catch(() => void(0));
			
			const userRank = document.users.sort((a, b) => b.level - a.level).findIndex(guildUser => guildUser.id === user.id) + 1;
			const userXP = document.users[searchUserIndex].xp;
			const userLevel = document.users[searchUserIndex].level;
			
			const XP = userXP < 1000 ? userXP+" " : abbreviateNumber(userXP);
			const XPXP = 5 * (userLevel * userLevel) + (50 * userLevel) + 100;
			
			let XP_PERCENTAGE = Math.floor(XP / XPXP * 100);
			if(XP_PERCENTAGE > 100) XP_PERCENTAGE = 100;
			if(isNaN(XP_PERCENTAGE)) XP_PERCENTAGE = 0;
			
			const XP_BAR_LENGTH = (38 + XP_PERCENTAGE / 100 * (632-38));
			
			const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: "png", size: 128}));
			
			/* ------- INITIAL BACKGROUND (grey) ------- */
			ctx.beginPath();
			ctx.rect(0, 0, canvas.width, canvas.height);
			ctx.closePath();
			ctx.fillStyle = "#23272A";
			ctx.fill();
			
			/* ------- BACKGROUND WITH CUSTOM IMAGE ------- */
			/*
				IF YOU WANT TO USE CUSTOM IMAGE
				UNCOMMENT THIS AND SET THE PATH TO THE IMAGE
				(need to import the module "path" to use this)
				
				const background = await Canvas.loadImage(path.join(__dirname, "../../path-to-image.png"));
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
			*/
			
			/* ------- SECONDARY BACKGROUND (black) ------- */
			ctx.beginPath();
			ctx.rect(24, 36, 886, 210);
			ctx.closePath();
			ctx.fillStyle = "#000000bf";
			ctx.fill();
			
			//PROGRESS BAR/LEVEL COLOR;
			let colorOfItems = message.guild.members.cache.get(user.id).displayHexColor || message.member.displayHexColor;
			if(colorOfItems === "#000000") colorOfItems = "#23272A";
			
			/* -------------- */
			let rectX = 258;//center in that case;
			const rectY = 184;//almost center in this case;
			const rectWidth = 632;//horizontal (progress bar) length;
			const rectHeight = 36;//vertical width (needs to be the same value);
			const cornerRadius = 36;//horizontal and circumference (needs to be the same value);
			
			ctx.lineJoin = "round";
			ctx.lineWidth = cornerRadius + 2;
			
			ctx.strokeStyle = "whitesmoke";
			ctx.strokeRect(rectX + (cornerRadius / 2), rectY + (cornerRadius / 2), rectWidth - 1 - cornerRadius, rectHeight - cornerRadius);
			
			ctx.lineWidth = cornerRadius;
			ctx.strokeStyle = "#494b4f";
			ctx.strokeRect(rectX + 1.5 + (cornerRadius / 2), rectY + (cornerRadius / 2), rectWidth - 2.5 - cornerRadius, rectHeight - cornerRadius);
			
			/* -------------- */
			let rectWidth2 = XP_BAR_LENGTH;//horizontal (progress bar) length; 38 == 0% || 632 100%;
			ctx.lineJoin = "round";
			ctx.lineWidth = cornerRadius;
			ctx.strokeStyle = colorOfItems;
			ctx.fillStyle = colorOfItems;
			
			ctx.strokeRect(rectX + (cornerRadius / 2), rectY + (cornerRadius / 2), rectWidth2 - 1 - cornerRadius, rectHeight - cornerRadius);
			const applyText = (canvas, text) => {
				const context = canvas.getContext("2d");
				
				//base font size;
				let fontSize = 32;
				
				do{
					//assign the font to the context and decrement it so it can be measured again;
					context.font = `bold ${fontSize -= 2}px Verdana`;
					//compare pixel width of the text to the canvas minus the approximate avatar size;
				}while(context.measureText(text).width > canvas.width - 300);
				
				//return the result to use in the actual canvas;
				return context.font;
			};
			
			/* ------- USERNAME/TAG ------- */
			const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
			gradient.addColorStop(0, "magenta");
			gradient.addColorStop(0.5, "blue");
			gradient.addColorStop(1, "red");
			
			const username = user.username;
			const discriminator = ` #${user.discriminator}`;
			
			ctx.fillStyle = "white";
			ctx.font = applyText(canvas, username + discriminator);
			ctx.fillText(username, 274, canvas.height / 2 + 25);
			
			ctx.fillStyle = "grey";
			ctx.fillText(discriminator, 274 + ctx.measureText(username).width, canvas.height / 2 + 25);
			
			/* ------- CURRENT XP / REQUIRED XP ------- */
			ctx.fillStyle = "grey";
			ctx.font = "extra bold 22px Arial";
			ctx.textAlign = "right";
			
			ctx.fillText(`/ ${XPXP} XP`, 884, canvas.height / 2 + 25)
			ctx.fillStyle = "white";
			ctx.fillText(XP, 884 - ctx.measureText(` / ${abbreviateNumber(XPXP)} XP`).width, canvas.height / 2 + 25)
			
			/* ------- RANK/LEVEL ------- */
			ctx.fillStyle = colorOfItems;
			ctx.font = "60px sans-serif";
			ctx.textAlign = "right";
			
			ctx.fillText(userLevel, 884, canvas.height / 2 - 42)
			
			let levelNumberWidth = ctx.measureText(userLevel).width;
			ctx.fillStyle = colorOfItems;
			ctx.font = "bold 20px sans-serif";
			
			ctx.fillText("LEVEL ", 884 - levelNumberWidth, canvas.height / 2 - 42)
			
			let levelTextWidth = ctx.measureText("   LEVEL").width;
			ctx.fillStyle = "white";
			ctx.font = "60px sans-serif";
			
			ctx.fillText(`#${abbreviateNumber(userRank)}`, 884 - levelNumberWidth - levelTextWidth, canvas.height / 2 - 42)
			
			let rankNumberWidth = ctx.measureText(`#${abbreviateNumber(userRank)}`).width;
			ctx.fillStyle = "white";
			ctx.font = "bold 22px sans-serif";
			ctx.fillText("RANK ", 884 - rankNumberWidth - levelNumberWidth - levelTextWidth, canvas.height / 2 - 42)
			
			/* ------- AVATAR ------- */
			ctx.beginPath();
			ctx.arc(122, 142, 160 / 2, 0, Math.PI * 2);
			ctx.closePath();
			ctx.strokeStyle = gradient;
			ctx.lineWidth = 5;
			ctx.stroke();
			ctx.save();
			ctx.clip();
			
			ctx.drawImage(avatar, 42, 62, 160, 160);
			
			/* ------- STATUS ------- */
			ctx.beginPath();
			ctx.arc(184, 192, 20, 0, Math.PI * 2, true);
			ctx.lineWidth = 6;
			ctx.stroke();
			ctx.fill();
			
			ctx.restore();
			
			ctx.beginPath();
			ctx.arc(184, 192, 20, 0, Math.PI * 2, true);
			ctx.fillStyle = PresenceStatusColors[message.member.presence.status];
			ctx.strokeStyle = "black";
			ctx.lineWidth = 6;
			ctx.stroke();
			ctx.fill();
			
			message.channel.send({files: [ new MessageAttachment(canvas.toBuffer(), "Rank.png") ]}).catch(() => void(0));
		}).catch(() => void(0));
		setTimeout(() => RANK_COOLDOWN.delete(message.author.id), this.cooldown);
	}
};


function abbreviateNumber(number, precision=2){
	try{
		const suffsFromZeros = { 0:"", 3:"K", 6:"M", 9:"B", 12:"T", 15:"Q" };
		const { length } = number.toString();
		const lengthThird = length%3;
		const divDigits = length-(lengthThird || lengthThird+3);
		const calc = ""+(number/(10**divDigits)).toFixed(precision);
		
		return number < 1000 ? ""+number : (calc.indexOf(".") === calc.length-3 ? calc.replace(/\.00/, "") : calc)+suffsFromZeros[divDigits];
	}catch{
		return null;
	};
};
