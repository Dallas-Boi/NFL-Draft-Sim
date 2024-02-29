// Made Feb 2-9-24
// Handles everything with the previous draft picking phase

// This will load the nav data
socket.on("loading old draft", (data) => {
    $("#teamPicks").hide()
    $("#main").hide()
    $("#previous").show()
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

var y_ch_elm = [] // Checked trade elements
var o_ch_elm = [] // Other Trade Elements
var trading = false

// When the player starts to trade
$("#trade_btn").click(function() {
    y_ch_elm = []
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
    // This will show the picks
    newTab(document.getElementById("y_opt_picks"), "y")
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
            }
            allP++
        }
        tp = 0 // Resets the tp (this pick)
    }
    return pks
}

// Load and show the players draft pick
function loadPicks(team) {
    // 0 = Team | 1 = round | 2 = pick | 3 = total pick
    this_pks = findPicks(team) // Gets the clients picks
    let elm = "y"
    if (team !== current_team) {elm = "o"}
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
        $(sel).click(function() {check_action(this, elm)})
        // Appends everything together
        title.appendChild(title_sub)
        con.appendChild(title)
        con.appendChild(sel)
        if (y_ch_elm.includes(con.outerHTML)) {sel.checked = true}
        else if (o_ch_elm.includes(con.outerHTML)) {sel.checked = true}
        // If the given team is this players team
        $(`#${elm}_trade_items`).append(con)
    }
}

// Gets the draft.json data from server
async function tt(team) {
    var tdata = await fetch(`/trade`, {
        method: "post",
        headers: {
            'Content-Type': 'application/json'
        },
    
        //make sure to serialize your JSON body
        body: JSON.stringify({
            t: team
        })
    }).then(response => response.json())
    return tdata
}

// Loads the clients players in the trade menu
function loadPlayers(team) {
    if (team == "none") {return} // This will not send if the team hasn't been selected
    // Shows the teams players
    tt(team).then(res => {
        var elm = "y"
        if (team !== current_team) {elm = "o"}
        // Goes through each player
        for (var thisPlay of res) {
            var con = placePlayer(thisPlay, true) // Gets the player box
            // Trade Select
            var sel = document.createElement("input")
            sel.type = "checkBox"
            sel.className = "select_draft"
            // When the client clicks a checkbox it will save the item
            $(sel).click(function() {check_action(this, elm)})
            con.appendChild(sel)

            if (y_ch_elm.includes(con.outerHTML)) {sel.checked = true}
            else if (o_ch_elm.includes(con.outerHTML)) {sel.checked = true}
            // Checks if the item had been selected already
            $(`#${elm}_trade_items`).append(con)
        }   
    })
}

// When called it will add an click action
function check_action(box, cred) {
    let elm = box.parentElement.outerHTML
    console.log(box)
    console.log(elm)
    if (cred == "y") {
        if (box.checked == true) {y_ch_elm.push(elm)} // Adds elm
        else { // Removes elm
            let t = y_ch_elm.indexOf(elm)
            y_ch_elm.splice(t, 1)
        }
    } else {
        if (box.checked == true) {o_ch_elm.push(elm)} // Adds elm
        else { // Removes elm
            let t = o_ch_elm.indexOf(elm)
            o_ch_elm.splice(t, 1)
        }
    }
}

// Resets the trade menu when the client clicks a opt btn
function newTab(btn, box) {
    // Removes the html
    $(`#${box}_trade_items`).html("")
    // Removes the selected call from all the btns
    $(`.${box}_btn`).attr("class", `${box}_btn`)
    // Sets the clicked btn to selected
    $(btn).attr("class", `${btn.className} selected`)
    // Loads the correct data
    if (btn.textContent == "Draft Picks") { // If its draft picks
        if (box == "y") {loadPicks(current_team)} // If its the players picks
        else if (box == "o") {loadPicks($("#playerSel").val())}
    } else if (btn.textContent == "Players") {
        if (box == "y") {loadPlayers(current_team)} // If its the players picks
        else if (box == "o") {loadPlayers($("#playerSel").val())}
    }
}

// When the client clicks draft picks in the trade
$(".y_btn").click(function() {newTab(this, "y")})
// When the client clicks Other draft picks in the trade
$(".o_btn").click(function() {newTab(this, "o")})

// When the client changes the player drop menu value
$("#playerSel").change(function() {
    if (this.value == "none") {
        $("#confirm_trade").attr("disabled", true)
        // This will show the picks
        newTab(document.getElementById("o_opt_picks"), "o")
    }
    else {$("#confirm_trade").attr("disabled", false)}
})

// When the client confirms the trade
$("#confirm_trade").click(function() {
    // Variables to send to clients
    if ($("#playerSel").val() == "none") {notify_client("Error", "You need to select a Team");return}
    $("#trade_btn").attr("disabled", true)
    $("#trade_con").hide()
    notify_client("Successful", `You have Sent a Trade request to ${$("#playerSel").val()}`)
    socket.emit("trade request", [{"team": current_team, "items": y_ch_elm}, {"team": $("#playerSel").val(), "items": o_ch_elm}])
})

// When the client cancels the trade
$("#cancel_trade").click(function() {
    $(".select_draft").attr("checked", false)
    $("#trade_con").hide()
})

// When a client sent a trade request
socket.on("send_trade", (data) => {
    console.log(data)
    // 0 = From Items | 1 = To Items
    if (data[1]["team"] == current_team) {
        var elm_id=[{"pick": [], "player": []},{"pick": [], "player": []}]
        // Shows the menu
        $("#s_trade_con").show()
        // Makes the header
        $("#t_trade_title").html("") // Resets the header
        var asd = ["t", "y"] // This is here just to do a list
        // Team Icon
        for (var i=0; i < asd.length; i++) {
            $(`#${asd[i]}_trade_title`).html("")
            // Team Icon
            var p = document.createElement("img")
            p.src = `./teams/${data[i]["team"]}.png`
            p.className = "teamIcon"
            // Appends to the header
            $(`#${asd[i]}_trade_title`).append(p)
        }
        
        // Shows the elements for the person who started the trade
        for (var i=0; i < asd.length; i++) { // Both sides
            for (var f=0; f < data[i]["items"].length; f++) { // Every Item
                let e = document.createRange().createContextualFragment(data[i]["items"][f]);
                console.log(e)
                $(`#${asd[i]}_traded_items`).append(e)
            }
            // Adds all the IDs to complete the trade
            $(`#${asd[i]}_traded_items`).children().each(function() {
                if (this.className.includes("trade")) {elm_id[i]["pick"].push(this.id)} 
                else {elm_id[i]["player"].push(this.id)}
            })
        }
        console.log(elm_id)
        // Creates Interactivity with the accept and decline btn
        // Allows the accept btn to accept the trade
        $("#accept").click(function() {
            socket.emit("trade_accept", [data[0]["team"], data[1]["team"], elm_id])
            // Resets the html of the trade
            newTrade()
        })
        // Allows the decline btn to decline the trade
        $("#decline").click(function() {
            socket.emit("trade_decline", [data[0]["team"], data[1]["team"]])
            // Resets the html of the trade
            newTrade()
        })
        $(".select_draft").remove()
    } 
})

// Accepts the current Trade
function accept_t(data) {
    // 0 = From | 1 = To | 2 = IDs
    // Checks if the ID is a number ( If it is then it replaces the index with the new team pick)

    // Changes draft picks and removes / adds the new player to their "My Picks" Tab
    for (var i=0; i < 1; i++) {
        var change_to
        // Sets the players
        if (i==0) {change_to = data[1]}
        else if (i==1) {change_to = data[0]}
        // Goes through each Traded Pick
        for (let itm of data[2][i]["pick"]) {
            var sep = itm.split("-")
            let round = parseInt(sep[0])
            let pick = parseInt(sep[1])-1
            draftPicks[round][pick] = change_to
            // This will change the pick if the traded pick is the current round
            if (round == current_round) {
                if (pick == curPick) {
                    totalPick--
                    curPick--
                    if (curPick == -1) {current_round--} 
                    socket.emit("change_turn")
                }
            }
        }   

        // This will update the players under "My Picks"
        tt(current_team).then(res => {
            $("#picks_p").html("") // Resets the Data
            for (var thisPlay of res) { // Each Player
                console.log(thisPlay)
                $("#picks_p").append(placePlayer(thisPlay, true))
            }
        })
    }

    // Sends a notification to the sender that their trade was Accepted
    if (data[0] == current_team) {
        notify_client("Accepted", `${data[0]} Accepted Your Trade Request.`)
        $("#trade_btn").attr("disabled", false)
        // Removes the player from their selected players
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