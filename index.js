// Made 2-1-24
const express = require("express");
const partials = require('express-partials');
const fs = require("fs");
const { parse } = require("csv-parse");
const axios = require('axios');
const cors = require("cors")
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
// -----------
const https = require("https")
const http = require('http');

// This will enable the gAPI Scripts ( If Available )
// Comment the line below to disable google sheet API
const { getPicks, addPicks } = require("./gAPI/gSheets")

// HTTPS creds
/*const options = {
    key: fs.readFileSync('ssl/server.key', 'utf8'),
    cert: fs.readFileSync('ssl/server.crt', 'utf8')
};*/
// ------------
const app = express();
const port = 3000;
// ------------
// http_s creating
const server = http.createServer(app);
//const server = https.createServer(options, app);
// ------------
const io = new Server(server);

const opts = require("./draft_settings.json")
const id = opts["id"] // ID for the season

// http_s Headers
app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);
app.use('/', express.static(__dirname+'/views/pages'));
app.set('socketio', io);
app.use(partials())
// BodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// CORS
const allowedOrigins = ['www.example1.com', 'www.example2.com'];
app.use(cors({
  origin: function(origin, callback){
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }

}));

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

// When called this will return the draft data
app.post('/trade', (req, res) => {
    var d = require("./drafts.json")
    // Goes through the players picks
    var c_play = d[id][req.body.t]["draft"]
    var reData = []
    for (var i=0; i < c_play.length; i++) { // Every Drafted Player 
        reData.push(play[c_play[i][1]])
    }
    res.send(reData)
})

// When Called Returns the give Players stats
app.post("/getStats", (req, res) => {
    res.send(play[req.body.n])
})

// Capitalize the string given
const capitalize = (str, lower = false) =>(lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());

var a = [] // Players
var cats = []
var play = {}
// Reads the Madden Ratings CSV
function makeData() {
    fs.createReadStream("./m24_ratings.csv")
        .pipe(parse({ delimiter: ",", from_line: 1 }))
        .on("data", function (row) {
            if (row[0] == "Team") {cats = row;return} // Makes the cats
            a.push(row)
        })
        // Once the data has been made
        .on("end", function () {
            for (var p = 0; p < a.length; p++) {
                if (play[a[p][2]]) {continue}
                play[a[p][2]] = {}
                for (var i=0;i < cats.length; i++) {
                    play[a[p][2]][cats[i]] = a[p][i]
                }
            }
        })
        .on("error", function (error) {
            console.log(error.message);
        });
}

makeData()
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
var s = require("./draft_settings.json");
const { getAuthToken } = require("./gAPI/gSheets");
var old_play = s["not_draftable"]
var draft_picks = {}

// Checks the ready variable
function check_ready() {
    // Checks if all players are ready
    if (ready == Object.keys(con).length) {
        var d = require("./drafts.json") // gets JSON file
        var s = require("./draft_settings.json")
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
                draft: con[keys[i]]["old_picks"]
            }                
        }
        // sets up the draft picks
        for (var i=0; i < s["rounds"]; i++) {
            draft_picks[i+1] = {}
            for (var p=0; p < order.length; p++) {
                draft_picks[i+1][p] = order[p]["team"]
            }
        }

        fs.writeFile("drafts.json", JSON.stringify(d, null, 4),err => {
            // Checking for errors 
            if (err) throw err;
        });
        ready = 0
        // Tells all clients to start the draft
        io.emit("start_draft", [order, old_play, s["rounds"], draft_picks])
        draft_picks = {}
    }
}

// Pauses the code
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


// This will send all the responses to the sheet ( Once the Draft is Over )
async function endDraft() {
    if (s["sendForm"]["active?"] == false) {return} // Cancels the request if sendForm is inactive
    var d = require("./drafts.json")
    var per = Object.keys(d[id])
   
    for (var z = 0; z < per.length; z++) {  // Every Player
        var tis = d[id][per[z]]
        for (var ll=0; ll < tis["draft"].length; ll++) { // Every Players Draft
            await addPicks([id, tis["name"], tis["draft"][ll][0], tis["draft"][ll][1], tis["draft"][ll][2]])
        }
    }
}

// Socket IO handlers
io.on("connection", (socket) => {
    console.log('a user connected');
    con[socket.id] = {ready: false, team:"", pick:""}
    io.emit("Give Ratings", play) // Gives the client the players from m23 ratings
    // Sends to the client that just connected of the taken teams
    socket.emit("disable_items", [getTaken(con, "team"),getTaken(con, "pick")]) 
    // When the client Disconnects from the http_s
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
        check_ready()
    })

    // When a client is unready
    socket.on("clicked_un_ready", (p) => {
        con[socket.id] = {ready: false}
        if (ready !== 0) {ready--} // Removes that player being ready 
    })

    // When the client changes the turn
    socket.on("change_turn", () => {io.emit("change turn")})
    // When the Draft is over
    socket.on("end_draft", (team) => {
        // The IF statement just makes sure that it will only send the draft once
        if (team == Object.keys(con)[0]) {console.log("send");endDraft(id)}
        
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
        // Writes the data to the json file
        fs.writeFile("drafts.json", JSON.stringify(d, null, 4),err => {
            // Checking for errors 
            if (err) throw err;
     
            // Success 
            console.log("Done writing");
        })
    })

    // Sends the clients a message when a client clicks a team icon
    socket.on("picked_team", (data) => {
        con[data] = con[socket.id] // Transfers the data
        delete con[socket.id] // deletes old data
        socket.id = data // Changes the ID
        // 0 = team 
        con[socket.id]["team"] = data      
        socket.broadcast.emit("disable_items", [getTaken(con, "team"),getTaken(con, "pick")]) // Sends all clients (except sender) the team to disable
    }) 
    // Sends the clients a message when a client clicks a pick
    socket.on("picked_pick", (data) => {
        con[socket.id]["pick"] = data      
        socket.broadcast.emit("disable_items", [getTaken(con, "team"),getTaken(con, "pick")]) // Sends all clients (except sender) the team to disable
    })

    // ===============================
    // Old Picks
    // ===============================

    // When a player picks one of their old players
    socket.on("load_old", (data) => {
        var con_set = require("./draft_settings.json")
        var draft = require("./drafts.json")

        con[socket.id]["old_picks"] = []
        // Checks if old picks is enabled
        if (con_set["pick_old"]["active?"] == true) {
            
            var old_k = Object.keys(draft[con_set["pick_old"]["pre_id"]])
            // Goes through each entry in the previous season
            for (var ch=0; ch < old_k.length; ch++) { 
                // Checks if the player was in last draft
                if (draft[con_set["pick_old"]["pre_id"]][old_k[ch]]["name"] == con[socket.id]["name"]) {
                    socket.emit("loading old draft", draft[con_set["pick_old"]["pre_id"]][old_k[ch]])
                    return
                }
            }
            socket.emit("invalid player") // If there is no existence of this client
        }
        ready++
        check_ready()
    }) 

    // When a client picks a old player
    socket.on("pick old player", (data) => {
        // Data 0= Old Team | 1 = Position
        var con_set = require("./draft_settings.json")
        var draft = require("./drafts.json")
        // Adds the player to the old pick
        var player_data = draft[con_set["pick_old"]["pre_id"]][data[0]]["draft"][parseInt(data[1])]
        // Writes the data to the draft_settings
        con[socket.id]["old_picks"].push(player_data)
        old_play.push(player_data[1])
        // If the client picked the correct amount of picks
        if (con[socket.id]["old_picks"].length == con_set["pick_old"]["amount"]) {
            socket.emit("ready this client")
            ready++
            check_ready()
        }
    })

    // ===============================
    // Trading
    // ===============================

    // When a player sends a trade request
    socket.on("trade request", (data) => {
        // 0 = From | 1 = To | 2 = items
        socket.broadcast.emit("send_trade", data)
    })
    // When the client accepts the trade
    socket.on("trade_accept", (data) => {
        console.log(data)
        // data[2][0] = From Player Items | data[2][1] = To Player Items
        var d = require("./drafts.json")
        // ===============
        // Completing the trade needs to be finished
        // Only Get the Players then Send the Picks and players to the clients
        // The clients will change the picks
        // ===============

        for (var i=0; i < 2; i++) { // Goes through each player
            if (data[2][i]["player"].length > 0) {
                for (let itm of data[2][i]["player"]) { // Each Players Item
                    var give_team = data[1]
                    var from_team = data[i]
                    // Changes the give_team
                    if (i==1) {give_team = data[0]}
                    // Gives the players
                    for (var p=0; p < d[id][from_team]["draft"].length; p++) { // Each Pick
                        var ind = d[id][from_team]["draft"][p] // Player
                        if (ind[1] == capitalize(itm)) {
                            d[id][give_team]["draft"].push(ind) // Pushes the item to the given team
                            d[id][from_team]["draft"].splice(p, 1) // Removes the item from the giving team
                        }
                    }
                }
            }
        }
        // Saves the drafts file
        fs.writeFile("drafts.json", JSON.stringify(d, null, 4),err => {
            // Checking for errors 
            if (err) throw err;
        });
        // Sends all clients accept trade to change the picks
        io.emit("accept_trade", data)
    })
    // When the client declines the trade
    socket.on("trade_decline", (data) => {
        io.to(data[0]).emit("decline_trade", data)
    })
})

// Listens for the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});