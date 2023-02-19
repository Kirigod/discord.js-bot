const mongoose = require("mongoose");
const DatabaseServer = require('../class/DatabaseServer.js');
const ServerDB = new DatabaseServer({
    host: "0.0.0.0",
    port: 27017,
    exepath: __dirname + "/../www/mongodb/bin/mongod.exe",
    dbpath: __dirname +"/../db",
    dbname: Buffer.from("Adelson da Silva Filho").toString("hex"),
});
ServerDB.connect().then(() => console.log("MongoDB Connected!"));

//String - Array - Number - Boolean;
const GuildsSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    invites: {
        type: String,
        default: "Disabled"
    },
    levels: {
        active: {
            type: Boolean,
            default: true
        },
        xp: {
            rate: {
                type: Number,
                default: 1//.25, .5, .75, 1, 1.5, 2, 2.5, 3;
            },
            blacklist: {
                roles: {
                    type: Array,
                    default: []//["id", "id"];
                },
                channels: {
                    type: Array,
                    default: []//["id", "id"];
                }
            }
        },
        levelroles: {
            rewards: {
                type: Array,
                default: []//[{level: 5, roles: ["id", "id"]},{level: 1, roles: ["id"]}];
            },
            removePrevious: {
                type: Boolean,
                default: false
            }
        },
        announce: {
            active: {
                type: Boolean,
                default: true
            },
            message: {
                type: String,
                default: "Noice {user}, you just advanced to level {level}!"//limit 1k;
            },
            channel: {
                current: {
                    type: Boolean,
                    default: true//if false use customId;
                },
                customId: {
                    type: String,
                    default: ""
                }
            }
        }
    },
    moderator: {
        active: {
            type: Boolean,
            default: true
        },
        roles: {
            type: Array,
            default: []///["id", "id"];
        }//,
        //events;
    },
    users: {
        type: Array,
        default: []//{_id: "1234567890",level: 0,xp: 0,coins: 0,infractions: []};
    }
});

const Guilds = mongoose.model("Guilds", GuildsSchema.set("versionKey", false));
module.exports.Guilds = Guilds;

const UsersSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    about: {
        type: String,
        default: ""
    },
    rep: {
        type: Number,
        default: 0
    }
});

const Users = mongoose.model("Users", UsersSchema.set("versionKey", false));
module.exports.Users = Users;