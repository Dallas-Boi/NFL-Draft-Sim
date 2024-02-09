// Made 2-1-24
const express = require("express");
const partials = require('express-partials');
const fs = require("fs");

const app = express();
const port = 3000;

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const opts = require("./draft_settings.json")
const id = opts["id"] // ID for the season
var nonDraft_Players = opts["not_draftable"] // Players in this list will not appear on the draft list 

// Server Headers
app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);
app.use('/', express.static(__dirname+'/views/pages'));
app.set('socketio', io);
app.use(partials())

// The Home Page
app.get('/', (req, res) => {
    res.render("pages/main")
});

// Show the drafts data
app.get('/results', (req, res) => {
    res.render("pages/results/end")
})

// This will return the drafts.json data
app.get('/draft', (req, res) => {
    var d = require("./drafts.json")
    res.send(d)
})

// Returns the taken teams
function getTaken(dic, loc) {
    var con_k = Object.keys(dic)
    var keys = []
    con_k.forEach(function(item, index) {
        keys.push(dic[item][loc])
    })
    return keys
}

// All variables for the Socket IO connects
var con = {}
var ready = 0

// Socket IO handlers
io.on("connection", (socket) => {
    console.log('a user connected');
    con[socket.id] = {ready: false, team:"", pick:""}
    // Sends to the client that just connected of the taken teams
    socket.emit("disable_items", [getTaken(con, "team"),getTaken(con, "pick")]) 
    // When the client changes their socket id
    socket.on("change_id", (data) => {
        console.log(data)
        // Checks if this socket ID was taken
        if (con[data] !== undefined) {
            socket.emit("input_e", ["This name was already taken.", "change"])
            return
        }
        con[data] = con[socket.id] // Transfers the data
        delete con[socket.id] // deletes old data
        socket.id = data // Changes the ID
    })

    // When the client Disconnects from the server
    socket.on('disconnect', () => {
        if (ready !== 0) {ready--} // Removes that player being ready 
        delete con[socket.id]
        console.log('user disconnected');
        socket.broadcast.emit("disable_items", [getTaken(con, "team"),getTaken(con, "pick")])
    });

    // When a client is ready
    socket.on("clicked_ready", (data_raw) => {
        var data = JSON.parse(data_raw)
        var data_n = ["name", "pick", "team"]
        var data_k = Object.keys(data)
        // This checks the data for any errors
        for (var i=0; i < data_k.length; i++) {
            if (data_k[i] !== data_n[i]) {
                console.log(socket.id)
                socket.emit("input_e", `You forgot to enter the your "${data_n[i]}"`)
            }
        }
        
        con[socket.id] = {ready: true, team: data["team"], pick: data["pick"], name: data["name"], id:socket.id}
        ready++
        socket.emit("return id", socket.id) // Gives the client their ID
        // Checks if all players are ready
        if (ready == Object.keys(con).length) {
            var d = require("./drafts.json") // gets JSON file
            d[id] = {}
            // Sorts the Order based on pick
            var order = []
            var keys = Object.keys(con)
            // Goes through each player and puts them in order
            for (var i=0; i < keys.length; i++) {
                order[parseInt(con[keys[i]]["pick"])-1] = con[keys[i]]
                d[id][con[keys[i]]["id"]] = {
                    name: con[keys[i]]["name"],
                    team: con[keys[i]]["team"],
                    pick: con[keys[i]]["pick"],
                    draft: []
                }                
            }
            fs.writeFile("drafts.json", JSON.stringify(d, null, 4),err => {
                // Checking for errors 
                if (err) throw err;
         
                // Success 
                console.log("Done writing");
            });
            io.emit("start_draft", [order, nonDraft_Players])
        }
    })

    // When a client is unready
    socket.on("clicked_un_ready", (p) => {
        con[socket.id] = {ready: false}
        if (ready !== 0) {ready--} // Removes that player being ready 
    })

    // When the client changes the turn
    socket.on("change_turn", () => {
        io.emit("change turn")
    })

    // This send all clients the pickDraft call
    socket.on("pickDraft", (data) => {
        io.emit("pick draft", data)
        // Replaces the Clients team to the players team
        data[0] = data[3]
        data.pop()
        // Writes everything to the .json File
        var d = require("./drafts.json") // gets JSON file
        d[id][socket.id]["draft"].push(data)
        fs.writeFile("drafts.json", JSON.stringify(d, null, 4),err => {
            // Checking for errors 
            if (err) throw err;
     
            // Success 
            console.log("Done writing");
        });
        
    })

    // Sends the clients a message when a client clicks a team icon
    socket.on("picked_team", (data) => {
        // 0 = team 
        con[socket.id]["team"] = data      
        socket.broadcast.emit("disable_items", [getTaken(con, "team"),getTaken(con, "pick")]) // Sends all clients (except sender) the team to disable
    }) 
    // Sends the clients a message when a client clicks a pick
    socket.on("picked_pick", (data) => {
        con[socket.id]["pick"] = data      
        socket.broadcast.emit("disable_items", [getTaken(con, "team"),getTaken(con, "pick")]) // Sends all clients (except sender) the team to disable
    })
})

// Infinite Server loop
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

