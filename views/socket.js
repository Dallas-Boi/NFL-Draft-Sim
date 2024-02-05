// Made Friday, Feburary 2nd, 2024
// Handles all the socket connections
const socket = io();

// Variables
var uid = ""
var current_team = ""
var isReady = false

// When the client clicks the ready button
$("#ready_btn").bind("click", function() {
    if (!(isReady)) { // If player is un-ready become ready
        
        // client Data
        try {
            var data = {
                name: $("#name_inp").val(),
                pick: $('input[name="draft#"]:checked').val(),
                team: $(".Selected_t")[0].value
            }
        } catch (e) {alert("Sorry, But Something went Wrong or Something was not entered");return}
        isReady = true
        $("#ready_btn").text("Un-Ready?")
        // Checks if the data has all info
        if (Object.keys(data).length !== 3) {alert("Sorry But Something is not entered for you to continue");return}
        // Emits the data
        socket.emit("clicked_ready", JSON.stringify(data))
    } else if (isReady) {
        isReady = false
        $("#ready_btn").text("Ready?")
        socket.emit("clicked_un_ready")
    }
})

// If an input error occured
socket.on("input_e", (msg) => {
    alert(msg)
})

// When Called this will give the client their ID
socket.on("return id", (id) => {uid = id})

// When called it will start the draft
socket.on("start_draft", (data_p) => {
    // data_p | 0 = Team Order | 1 = non draftable players
    $("#teamPicks").hide()
    $("#main").show()
    for (var i = 0; i < data_p.length; i++) {
        placeClients(data_p[0][i]["team"], data_p[0][i]["pick"], data_p[0][i]["id"])
    }
    changeTurn(uid)
    placePlayers()
    // Removes 
    for (var i=0; i < data_p[1].length-1; i++) {
        $(`div[id='${data_p[1][i]}']`).remove()
    }
})

// When Called this will change all clients turn
socket.on("change turn", (turn_id) => {
    changeTurn(turn_id)
})

// Executes the pickDraft function
socket.on("pick draft", (data) => {
    // 0 = Team | 1 = player
    pickDraft(data[0], data[1])
})