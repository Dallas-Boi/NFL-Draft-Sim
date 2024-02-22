// Made Feb 2-9-24
// Handles everything with the previous draft picking phase

// This will load the nav data
socket.on("loading old draft", (data) => {
    $("#teamPicks").hide()
    $("#main").hide()
    $("#previous").show()
    console.log(data)
    // Makes Image
    var img = document.createElement("img")
    img.src = `teams/${data["team"]}.png`
    img.className = "teamIcon"
    // Makes the clients name
    var c_name = document.createElement("div")
    c_name.className = "p_name"
    c_name.textContent = data["name"]

    $("#pre_nav").append(img)
    $("#pre_nav").append(c_name)
    loadOld_players(data["draft"])
})

// When the server says this client is ready
socket.on("ready this client", () => {
    $(".page").hide()
    $("#ready").show()
})

// When the player does not have a previous draft
socket.on("invalid player", () => {
    $(".page").hide()
    $("#ready").show()
})

// This will create all the old players from the previous drafted players
function loadOld_players(all) {
    for (var i=0; i< all.length; i++) {
        // Player Container
        var con = document.createElement("div")
        con.id = `${all[i][1]}`
        con.className = `draftBox ${all[i][2]}`
        con.value = all[i][0]
        // Player Name
        var pname = document.createElement("div")
        pname.className = "player_name"
        pname.innerHTML = `${all[i][1]}<br>`
        // Player Sub Name
        var sub = document.createElement("div")
        sub.className = "subName"
        sub.textContent = `${all[i][2]}`
        pname.appendChild(sub)
        // Draft Btn
        let d_btn = document.createElement("button")
        d_btn.id = `draft_${i}`
        d_btn.className = "draft_btn"
        d_btn.textContent = "+"
        // When the player clicks the draft button
        d_btn.addEventListener("click", function() {
            var id = this.id.replace("draft_", "")
            socket.emit("pick old player", id)
            this.parentElement.remove() // Removes the player box
        })
        // Appends everything
        con.appendChild(pname)
        con.appendChild(d_btn)
        $("#pick_players").append(con)
    }
}

// ===============
// Trading
// ===============

var ch_elm = [] // Checked trade elements
var trading = false

// When the player starts to trade
$("#trade_btn").click(function() {
    ch_elm = []
    // Shows the Menu
    $("#trade_con").show()
    $("#opt_picks").attr("class", "selected")
    $("#opt_players").attr("class", "")
    // Adds the teams to the list
    $("#playerSel").html("<option value='none'>Pick A Team</option>")
    for (var i=0; i < ids.length; i++) {
        if(ids[i] == current_team) {continue} // Skips the team if this is the clients team
        else {
            var op = document.createElement("option")
            op.value = ids[i]
            op.textContent = ids[i]
            $("#playerSel").append(op)
        }
    }
    // This will get what is shown
    loadPicks(current_team)
})

// finds the players draft picks
function findPicks(team) {
    $("#trade_items").children().remove() // Deletes all children
    // Places his picks
    var pks = [] // 0 = Team | 1 = round | 2 = pick | 3 total pick
    var tp = curPick
    var allP = totalPick
    // Finds all the picks for the player
    for (var i=current_round; i < draft_rounds+1; i++) { // Rounds
        for (var p=tp; p < Object.keys(draftPicks[i]).length; p++) { // Players
            if (draftPicks[i][p] == team) { // If this team is the players team
                // 0 = Team | 1 = round | 2 = pick | 3 = total pick
                pks.push([current_team, i, p+1, allP])
                console.log("Push")
            }
            allP++
        }
        tp = 0 // Resets the tp (this pick)
    }
    console.log(pks)
    return pks
}

// Load and show the players draft pick
function loadPicks(team) {
    // 0 = Team | 1 = round | 2 = pick | 3 = total pick
    this_pks = findPicks(team) // Gets the clients picks
    // Your Traded items
    for (var i=0; i < this_pks.length; i++) {
        // pick container
        var con = document.createElement("div")
        con.className = "draftBox trade"
        con.id = `${this_pks[i][1]}-${this_pks[i][2]}`
        // Pick name
        var title = document.createElement("div")
        title.className = "player_name"
        title.innerHTML = `Draft Pick #${this_pks[i][3]}<br>`
        // The Pick Subname
        var title_sub = document.createElement("div")
        title_sub.className = "subName"
        title_sub.textContent = `Round #${this_pks[i][1]} | Pick #${this_pks[i][2]}`
        // Trade CheckBox
        var sel = document.createElement("input")
        sel.type = "checkBox"
        sel.className = "select_draft"
        sel.value = `${this_pks[i][1]}-${this_pks[i][2]}`
        // When the client clicks a checkbox it will save the item
        $(sel).click(function() {check_action(this)})
        if (ch_elm.includes(con.id)) {sel.checked = true}
        // Appends everything together
        title.appendChild(title_sub)
        con.appendChild(title)
        con.appendChild(sel)
        // If the given team is this players team
        if (team == current_team) {$("#y_trade_items").append(con)}
        else {$("#o_trade_items").append(con)}
    }
}

// gets the draft.json data from server
const getData = async() => {
    await fetch(`/trade`, {body: {"t": current_team}})
}
getData()

// Loads the clients players in the trade menu
function loadPlayers(team) {
    fetch("/api/")
    // Copys all the clients players into the trade items element
    $("#trade_items").html(data)
    // Adds a check box for the elements
    $("#trade_items").children().each(function() {
        // Trade Select
        var sel = document.createElement("input")
        sel.type = "checkBox"
        sel.className = "select_draft"
        // When the client clicks a checkbox it will save the item
        $(sel).click(function() {check_action(this)})
        if (ch_elm.includes(this.parentElement)) {sel.checked = true}
        this.appendChild(sel)
    })
}

// When called it will add an click action
function check_action(box) {
    let pl = document.createElement("div")
    let e = (box.parentElement).cloneNode(true)
    pl.appendChild(e)
    if (box.checked == true) {ch_elm.push(pl.innerHTML)}
    else {
        let t = ch_elm.indexOf(pl.innerHTML)
        ch_elm.splice(t, 1)
    }
}

// Resets the trade menu when the client clicks a opt btn
function newTab(btn, box) {
    // Removes the html
    $(`#${box}_item`).text("")
    // Removes the selected call from all the btns
    $(`#${box}_opt`).children().attr("class", btn.className)
    // Sets the clicked btn to selected
    $(btn).attr("class", `${btn.className} selected`)
    // Loads the correct data
    if (btn.textContent == "Draft Picks") { // If its draft picks
        if (box == "y_trade") {loadPicks(current_team)} // If its the players picks
        else if (box == "o_trade") {loadPicks($("#playerSel").val())}
    } else if (btn.textContent == "Players") {
        if (box == "y_trade") {loadPicks(current_team)} // If its the players picks
        else if (box == "o_trade") {loadPicks($("#playerSel").val())}
    }
}

// When the client clicks draft picks in the trade
$(".y_btn").click(function() {
    newTab(this, "y_trade", current_team)
})

// When the client changes the player drop menu value
$("#playerSel").change(function() {
    if (this.value == "none") {$("#confirm_trade").attr("disabled", true)}
    else {$("#confirm_trade").attr("disabled", false)}
})

// When the client confirms the trade
$("#confirm_trade").click(function() {
    // Variables to send to clients
    if ($("#playerSel").val() == "none") {notify_client("Error", "You need to select a Team");return}
    $("#trade_btn").attr("disabled", true)
    $("#trade_con").hide()
    notify_client("Successful", `You have Sent a Trade request to ${$("#playerSel").val()}`)
    socket.emit("trade request", [current_team, $("#playerSel").val(), ch_elm])
})

// When the client cancels the trade
$("#cancel_trade").click(function() {
    $(".select_draft").attr("checked", false)
    $("#trade_con").hide()
})

// Accepts the current Trade
function accept_t(data) {
    // 0 = From | 1 = To | 2 = IDs
    // Checks if the ID is a number ( If it is then it replaces the index with the new team pick)
    for (var i=0; i < data[2].length; i++) {
        try {
            let ind = data[2][i].split("-")

            let r = parseInt(ind[0]) // round
            let p = parseInt(ind[1])-1 // pick
            console.log(r, p, data[0])
            draftPicks[r][p] = data[0] // Sets the pick from accepted player
        } catch (e) {
            console.log(e)
        }
    }

    // Sends a notification to the sender that their trade was Accepted
    if (data[1] == current_team) {
        console.log("Me")
        notify_client("Accepted", `${data[0]} Accepted Your Trade Request.`)
        $("#trade_btn").attr("disabled", false)
        // Removes the player from their selected players
        for (var i=0; i < data[2].length; i++) {$(`#${data[2][i]}`).remove()}
    }
}

// Resets the sent trade
function newTrade() {
    // Resets the html of the trade
    $("#trade_title").html("")
    $("#traded_items").html("")
    // Hides the menu
    $("#s_trade_con").hide()
}

// When the client accpets a trade request
socket.on("accept_trade", (data) => {
    console.log("Hello trade")
    accept_t(data)
})

// When the client declines a trade request
socket.on("decline_trade", (data) => {
    // 0 = From | 1 = To
    // Sends a notification to the sender that their trade was declined
    if (data[1] == current_team) {
        notify_client("Declined", `${data[0]} Declined Your Trade Request.`)
        $("#trade_btn").attr("disabled", false)
    }
})