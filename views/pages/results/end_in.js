// Made Tuesday 2-6-24
var d_data;
var players;
var player_data;
// Places the players that were in the draft
function placeBoxes(data) {
    players = Object.keys(data) // All players
    player_data = data
    // Handles all draft players and sorts them
    
    // Goes through each player
    for (var i=0; i < players.length; i++) {
        var cur = data[players[i]]
        var cap = cur["name"].charAt(0).toUpperCase() + cur["name"].slice(1)      
        
        // Makes Elements
        var box = document.createElement("div")
        box.className = "top_con result"
        box.id = "BOX"
        // Navbar
        var nav = document.createElement("div")
        nav.className = "navbar"
        // Players-Drafted Players
        var d_pick = document.createElement("div")
        d_pick.id = players[i]
        d_pick.className = "infoBox"
        // Name
        var name = document.createElement("div")
        name.textContent = `${cap}`
        name.className = "p_name"
        // Player Team
        var team = document.createElement("img")
        team.src = `../teams/${cur["team"]}.png`
        team.className = "teamIcon"
        // Their Draft pick
        var pick = document.createElement("div")
        pick.className = "pick"
        pick.innerHTML = `Draft Pick:<br>${cur["pick"]}`
        // Shows the elements on screen
        nav.appendChild(team)
        nav.appendChild(name)
        nav.append(pick)
        box.appendChild(nav)
        box.appendChild(d_pick)
        $("#main").append(box)
        unsortPicks(players[i])
    }
}

// Sorts the player
function sortPicks(player) {
    $(`#${player}`).text("")
    // Handles all draft players and sorts them
    var d_tm = {}
    // Sorts all players by team
    for (var d=0; d < player_data[player]["draft"].length; d++) {
        var this_p = player_data[player]["draft"][d]
        if (!(d_tm[this_p[0]])) { // if d_tm does not have this team
            d_tm[this_p[0]] = []
        }
        // Adds the player to the team list
        d_tm[this_p[0]].push(this_p)
    }
    // Sets the keys
    var d_tm_k = Object.keys(d_tm)
    // Places the player
    for (var t=0; t < d_tm_k.length; t++) {
        // 0 = team | 1 = Name | 2 = Position
        for (var d=0; d < d_tm[d_tm_k[t]].length; d++) {
            $(`#${player}`).append(placePick(d_tm[d_tm_k[t]][d][0], d_tm[d_tm_k[t]][d][1], d_tm[d_tm_k[t]][d][2]))
        }
    }
}

// Places the unsorted player picks
function unsortPicks(player) {
    $(`#${player}`).text("")
    var cur = player_data[player]
    // Places the player
    for (var t=0; t < cur["draft"].length; t++) {
        // 0 = team | 1 = Name | 2 = Position
        $(`#${player}`).append(placePick(cur["draft"][t][0], cur["draft"][t][1], cur["draft"][t][2]))
    }
}

// Returns the made nfl player element
function placePick(tm, play, pos) {
    // Team = 0 | Name = 1 | Position = 2
    var t_box = document.createElement("div")
    t_box.className = "draftBox"
    // Name 
    var t_name = document.createElement("div")
    t_name.innerHTML = `${play}<br>`
    // subname
    var sub_name = document.createElement("div")
    sub_name.className = "subName"
    sub_name.textContent = `${pos}`
    // Team Name
    var t_img = document.createElement("img")
    t_img.src = `../teams/${tm}.png`
    t_img.className = "teamIcon"
    // Shows Elms
    t_name.appendChild(sub_name)
    t_box.appendChild(t_name)
    t_box.appendChild(t_img)
    return t_box
}

// When the user clicks the sorted / unsorted radio
$('#sort').change(function() {
    for (var i=0; i < players.length; i++) {
        if (this.value == "false") {unsortPicks(players[i])}
        else if (this.value == "true") {sortPicks(players[i])}
    }
})

// When the user changes the draft season
$("#draft_cat").change(function() {
    $("#BOX").remove()
    placeBoxes(d_data[this.value])
})

// This will place the 
function draft_menu(data) {
    d_data = data
    var keys = Object.keys(data)
    // Adds the option to the screen
    for (var i=0; i < keys.length; i++) {
        let opt = document.createElement("option")
        opt.value = keys[i]
        opt.textContent = keys[i]
        $("#draft_cat").append(opt)
    }
    placeBoxes(d_data[keys[0]]) // Places the first entry
}

// gets the draft.json data from server
const getData = async() => {
    const data = await fetch(`/draft`)
        .then((res) => res.json())
    return data
}
getData().then(d => draft_menu(d))