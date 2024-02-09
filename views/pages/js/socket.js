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
        } catch (e) {notify_client("Error", "You did not Select your Team");return}
        isReady = true
        $("#ready_btn").text("Un-Ready?")
        // Checks if the data has all info
        if (Object.keys(data).length !== 3) {notify_client("Error","Sorry But Something was not Entered");return}
        // Emits the data
        socket.emit("clicked_ready", JSON.stringify(data))
    } else if (isReady) {
        isReady = false
        $("#ready_btn").text("Ready?")
        socket.emit("clicked_un_ready")
    }
})

// When the user changes their name
$("#name_inp").change(function() {
    socket.emit("change_id", this.value)
})

// When the user clicks a pick input
$('input[name="draft#"]').click(function() {
    if (this.disabled == true) {
        notify_client("Error", "This Pick Was Already Selected")
        return
    }
    socket.emit("picked_pick", this.value)
})

// If an input error occured
socket.on("input_e", (msg) => {
    if (msg.length == 2) {
        $("#name_inp").val("")
        notify_client("Error", msg[0])
        return
    }
    notify_client("Error",msg)
})

// When Called this will give the client their ID
socket.on("return id", (id) => {uid = id})

// When called it will start the draft
socket.on("start_draft", (data_p) => {
    // data_p | 0 = Team Order | 1 = non draftable players
    $("#teamPicks").hide()
    $("#main").show()
    for (var i = 0; i < data_p[0].length; i++) {
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

// When a team needs to be disabled
socket.on("disable_items", (data) => {
    // 0 = teams | 1 = picks

    // This will disable the teams
    var this_id = ""
    // Checks to see if the current use selected any team yet
    try {this_id = $('.Selected_t')[0].id} catch {} // Error Handler
    // Resets the disabled teams
    $("img[class='teamIcon disabled_team']").attr("class", "teamIcon")
    $("span[class='red']").hide()
    // Disables the given Teams
    console.log(data[0])
    data[0].forEach((item, index) => {
        if (this_id !== item) {
            $(`#${item}`).attr("class","teamIcon disabled_team")
            $(`#strike_${item}`).show()
        }
    });

    // This will disable the picks
    var this_pick = ""
    try {this_pick = $('input[name="draft#"]:checked').val()} catch {}
    // Resets all picks
    $(`input[name="draft#"]`).attr("disabled", false)
    data[1].forEach((item, index) => {
        console.log(item, this_pick)
        if (this_pick !== item) {$(`#rad_${item}`).attr("disabled", true)}
    });
})

// Error Handler
socket.on("connect_error", (err) => {
    // the reason of the error, for example "xhr poll error"
    console.log(err.message);
    if (err.message == "xhr poll error") {
        notify_client("Server Error","Failed to Connect to server. Either the Server is offline of client can not see the hosted server. Please contact the Server Admin.")
        isReady = false
        $("#ready_btn").text("Ready?")
    }
});