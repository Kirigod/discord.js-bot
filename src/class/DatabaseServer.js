"use strict";
const child_process = require("child_process");
const mongoose = require("mongoose").set("strictQuery", false);
const fs = require("fs");

class DatabaseServer {
    constructor({host, port, exepath, dbpath, dbname}){
        this.host = host
        this.port = port;
        this.exepath = exepath;
        this.dbpath = dbpath;
        this.dbname = dbname;
        this.ready = false;
    };

    connect(){
        return new Promise((resolve, reject) => {
            fs.existsSync(this.dbpath) === false ? fs.mkdirSync(this.dbpath) : "";
            
            const child = child_process.execFile(this.exepath, ["--dbpath", this.dbpath, "--bind_ip", this.host, "--port", this.port]);
            child.stderr.on("data", data => console.log(`stderr: ${data}`));
            //child.stdout.on("data", data => console.log(`stdout: ${data}`));

            mongoose.connect(`mongodb://${this.host}:${this.port}/${this.dbname}`, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
                this.ready = true;
                resolve();
            }).catch(console.log);
        });
    };
};

module.exports = DatabaseServer;