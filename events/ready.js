module.exports = {
    name: "ready",
    once: true,
    execute(client){
        console.log("Online!");
        //console.log(client.commands);
    }
};