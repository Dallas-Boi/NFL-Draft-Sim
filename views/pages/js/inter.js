// Made Wednesday 1-31-24
$(".page").hide()
$("#teamPicks").show()

// This is the items for the current curPick and the drafting teams
var draftPicks = []
var draft_rounds;
var curPick = -1
var totalPick = 0
var current_round = 0
var ids = [] // Change

// Handles the curPick based items
function changeTurn() {
    curPick++
    totalPick++ // This is only used for the trade
    // If the curPick needs to restart
    if (curPick % ids.length == 0) { // If the 
        current_round++
        curPick = 0
        // This will end the draft
        if (current_round == draft_rounds+1) {
            socket.emit("end_draft", current_team)
            window.location.href = "/results"
            return
        } 
    } 
    // Disables all draft btns 
    $(".draft_btn").attr("disabled", true) 
    // Checks if the current turn is this client
    if (draftPicks[current_round][curPick] == current_team) { // Change
        $(".draft_btn").attr("disabled", false)
        notify_client("Your Turn", "It is now your turn to pick.")
    }

    // After changing the curPick it will update the clientData elements
    document.getElementById("cur_name").textContent = draftPicks[current_round][curPick]
    document.getElementById("cur_r").textContent = `${current_round}/${draft_rounds}`
}

// Creates all the players
function placePlayers() {
    for (var i=0; i< allPlayers.length; i++) {
        var amo = allPlayers[i].length
        var con = document.createElement("div")
        var abrivi = ""
        var num = allPlayers[i][amo-4]
        var ovr = allPlayers[i][amo-1]
        var pos = allPlayers[i][amo-2]
        var tm = allPlayers[i][amo-3]
        // Checks if the player has JR/II
        if (amo >= 7) {abrivi = ` ${allPlayers[i][amo-5]}`}
        // Player Container
        con.id = (`${allPlayers[i][0]} ${allPlayers[i][1]}${abrivi}`).toLowerCase()
        con.className = `draftBox ${pos}`
        con.value = tm
        // Player Name
        var pname = document.createElement("div")
        pname.className = "player_name"
        pname.innerHTML = `${allPlayers[i][0]} ${allPlayers[i][1]} ${abrivi}<br>`
        // Player Sub Name
        var sub = document.createElement("div")
        sub.className = "subName"
        sub.textContent = `${pos} (#${num})`
        pname.appendChild(sub)
        // Player OVR
        var p_ovr = document.createElement("div")
        p_ovr.className = "player_ovr"
        p_ovr.innerHTML = `OVR<br>${ovr}`
        // Draft Btn
        let d_btn = document.createElement("button")
        d_btn.id = `draft_${allPlayers[i][0]} ${allPlayers[i][1]}${abrivi}`
        d_btn.className = "draft_btn"
        d_btn.textContent = "+"
        // When the player clicks the draft button
        d_btn.addEventListener("click", function() {
            var n = (this.id).replace("draft_", "") // The player name
            var t = this.parentElement.value
            var p = (this.parentElement.className).replace("draftBox ", "")
            socket.emit("pickDraft", [draftPicks[current_round][curPick] , n, p, t])
        })
        // Appends everything
        con.appendChild(pname)
        con.appendChild(p_ovr)
        con.appendChild(d_btn)
        players.appendChild(con)
    }
}

// This will load the given clients
function placeClients(team, num, id) {
    // Team Box container
    var con = document.createElement("div")
    con.id = `${team}_box`
    con.className = "draftBox teamBox"
    // Team Draft Num
    var dnum = document.createElement("div")
    dnum.className = "draft_num"
    dnum.textContent = num
    // Team Image
    var img = document.createElement("img")
    img.src = `./teams/${team}.png`
    img.className = "teamIcon"
    // Team Name
    var div = document.createElement("div")
    div.className = "team_name"
    div.innerHTML = `${team}<br>`
    // Player Name
    var pn = document.createElement("player_name")
    pn.id = `${team}_pick`
    pn.className = "player_name"
    // Adds to the page
    con.appendChild(dnum)
    con.appendChild(img)
    con.append(div)
    con.append(pn)
    team_picks.appendChild(con)
    // Adds the team to the draftPicks
    ids.push(team)
}

// Adds the players name to the clients
function pickDraft(team, player) {
    var low_player = player.toLowerCase()
    // Puts the players name / Position / and Number on the draft team side
    document.getElementById(`${team}_pick`).innerHTML = document.getElementById(low_player).children[0].innerHTML

    // This puts the player in the clients "My Picks"
    document.getElementById(low_player).children[2].remove()
    if (current_team == draftPicks[current_round][curPick] ) {player_picks.appendChild(document.getElementById(low_player))}
    else {document.getElementById(low_player).remove()}
    // Changes the curPick for all players
    changeTurn()
}

// Buttons
// Team Buttons
const draft = document.getElementById("draft")
const pick = document.getElementById("their")
var sel_team_btn = draft

// Team Player picks and team picks
const team_picks = document.getElementById("picks_t")
const player_picks = document.getElementById("picks_p")

// Players container
const all_p = document.getElementById("all_btn")
const off_p = document.getElementById("off_btn")
const def_p = document.getElementById("def_btn")
const spe_p = document.getElementById("spe_btn")
var sel_player_btn = all_p

// subNav and Players DIV
const subNav = document.getElementById("subNav")
const players = document.getElementById("draft_players")
const searchBox = document.getElementById("searchPlayer")

// Player Positions Const
const off_pos = ["QB","HB","FB","WR","TE","LT","LG","C","RG","RT"]
const def_pos = ["LE","RE","DT","LOLB","MLB","ROLB","CB","FS","SS"]
const spe_pos = ["K", "P"]
const all_pos = [...off_pos, ...def_pos, ...spe_pos]
var player_pos = {"QB":[],"HB":[],"FB":[],"WR":[],"TE":[],"LT":[],"LG":[],"C":[],"RG":[],"RT":[],"LE":[],"RE":[],"DT":[],"LOLB":[],"MLB":[],"ROLB":[],"CB":[],"FS":[],"SS":[],"K":[],"P":[]}

// This gets all the players within the players.json data
var allPlayers = []
const getData = async() => {
    var pdata = []
    const data = await fetch("/players.json")
        .then((res) => res.json())
        .then((js) => pdata = js)
    return data
}
// 0 = First Name | 1 = Last Name | 2 ~ JR/II | 2 = Number | 3 = Team | 4 = Position | 5 = OVR
getData().then((da) => {
    for (var i=0; i < da.length; i++) {
        var thisPlay = (da[i]["Player Jersey Num Team Position Overall"].split(" "))
        allPlayers.push(thisPlay)
        player_pos[thisPlay[thisPlay.length-2]].push(thisPlay) // Puts the player in their position
    }
    //show_players("all")
})

// This will set the selected team button
function set_sel_team(btn) {
    sel_team_btn.className = ""
    btn.className = "selected";
    sel_team_btn = btn
}

// This will set the selected player button
function set_play_team(btn) {
    sel_player_btn.className = ""
    btn.className = "selected";
    sel_player_btn = btn
}

// Hides all elements that are in the list
function showElms(show) {
    // This shows all players
    if (show == "all") {
        $("#draft_players").children().show()
        return
    }

    $("#draft_players").children().hide()
    // If show is a list
    if (typeof show == "object") {
        for (var i=0; i < show.length;i++) {
            $(`.${show[i]}`).show()
        }
        return
    }
    $(`.${show}`).show()
}

// This will show the items of the given list
function show_subNav(list) {
    subNav.hidden = false // Shows SubNav
    subNav.innerHTML = ""
    // Goes through all offense positions
    for (var i=0; i < list.length; i++) {
        let btn = document.createElement("button")
        btn.id = `${list[i]}_btn`
        btn.textContent = list[i]
        btn.className = "pos_btn"
        btn.addEventListener("click", function() {
            showElms((this.id).replace("_btn", ""))
        })
        subNav.appendChild(btn)
    }
}

// Button interactions
// Team interactions
draft.addEventListener("click", function() {
    set_sel_team(draft) // Sets the selected btn
    team_picks.hidden = false
    player_picks.hidden = true
})

pick.addEventListener("click", function() {
    set_sel_team(pick) // Sets the selected btn
    team_picks.hidden = true
    player_picks.hidden = false
})

// Player interactions
all_p.addEventListener("click", function() {
    set_play_team(all_p) // Sets the selected btn
    showElms("all")
    subNav.innerHTML = ""
    var inp = document.createElement("input")
    inp.id = "searchPlayer"
    inp.placeholder = "Player's Name"
    subNav.appendChild(inp)
})

off_p.addEventListener("click", function() {
    set_play_team(off_p) // Sets the selected btn
    show_subNav(off_pos)
    showElms(off_pos)
})

def_p.addEventListener("click", function() {
    set_play_team(def_p) // Sets the selected btn
    show_subNav(def_pos)
    showElms(def_pos)
})

spe_p.addEventListener("click", function() {
    set_play_team(spe_p) // Sets the selected btn
    show_subNav(spe_pos)
    showElms(spe_pos)
})

// When the client uses the search box for their player
$("#searchPlayer").change(function() {
    // If the input for the search box is nothing then it will show all players
    $("#draft_players").children().hide()
    $("#draft_players").find(`div[id*="${this.value}"]`).show()
})

// This will load all the NFL teams in the correct spot
function loadTeams() {
    var n_teams = ["Cowboys", "Giants", "Eagles", "Commanders", "Bears", "Lions", "Packers", "Vikings", "Falcons", "Panthers", "Saints", "Buccaneers", "Cardinals", "Rams", "49ers", "Seahawks"]
    var a_teams = ["Bills", "Dolphins", "Patriots", "Jets", "Ravens", "Bengals", "Browns", "Steelers", "Texans", "Colts", "Jaguars", "Titans", "Broncos", "Chiefs", "Raiders", "Chargers"]
    var sect = ["east", "north", "south", "west"]
    // It will help stuff not be repeated
    const repeat = (name, side, com) => {
        // Makes the image container
        var con = document.createElement("div")
        con.className = "no_touchy"
        // Makes the strike line
        var line = document.createElement("span")
        line.className = "red"
        line.id = `strike_${name}`
        
        // Makes the Img elm
        var img = document.createElement("img")
        img.className = "teamIcon"
        img.tabIndex = "0"
        img.addEventListener("click", function() {
            // Checks if the team is disabled
            console.log(this.className.includes("disabled_team"))
            if (this.className.includes("disabled_team")) {
                notify_client("Error", "This Team Was Already Selected")
                return
            }
            $(".Selected_t").attr('class', 'teamIcon');
            this.className = "teamIcon Selected_t"
            socket.emit("picked_team", this.value)
        })
        
        img.id = name
        img.value = name
        img.src = `./teams/${name}.png`
        // Appends the new elements
        con.appendChild(line)
        con.appendChild(img)
        // Shows element on screen
        $(`#${side}_${com}`).append(con)
        // Hides the strike through line
        $(`#strike_${name}`).hide()
    }
    // Goes through the Section for NFC
    try {
        for (var i=0; i < n_teams.length; i++) { // All players
            for (var j=0; j < 4; j++) { // Every section
                repeat(n_teams[(i*4)+j], "nfc", sect[i])
            }
        }
    } catch (e) {}

    // Goes through the Section for AFC
    try {    
        for (var i=0; i < a_teams.length; i++) { // All players
            for (var j=0; j < 4; j++) { // Every section
                repeat(a_teams[(i*4)+j], "afc", sect[i])
            }
        }
    } catch (e) {}
}

// So I can call this file with out it loading the teams
if (window.location.pathname == "/") {loadTeams()}