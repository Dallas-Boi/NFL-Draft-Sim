// Made 2-1-24

const express = require("express");
const fs = require("fs");

const app = express();
const port = 3000;

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const id="season 2" // ID for the season

// Server Headers
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(__dirname+'/views'));
app.set('socketio', io);

// The Home Page
app.get('/', (req, res) => {
    res.render("main")
});

// Show the drafts data
app.get('/results', (req, res) => {
    res.render("results/end")
})

// This will return the drafts.json data
app.get('/draft', (req, res) => {
    var d = require("./drafts.json")
    res.send(d[id])
})

// All variables for the Socket IO connects
var con = {}
var ready = 0

var nonDraft_Players = [
    "Tom Brady",
    "Josh Allen", 
    "Aaron Rodgers",
    "Myles Garrett"
]

// Socket IO handlers
io.on("connection", (socket) => {
    console.log('a user connected');
    con[socket.id] = {ready: false}

    // When the client Disconnects from the server
    socket.on('disconnect', () => {
        console.log(socket.id)
        console.log('user disconnected');
        delete con[socket.id]
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
        console.log(ready, Object.keys(con).length)
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
        ready--
        console.log(ready)
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
})

// Infinite Server loop
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

