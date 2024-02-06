// Made Tuesday 2-6-24

// Places the players that were in the draft
function placeBoxes(data) {
    console.log("helo")
    var players = Object.keys(data) // All players
    console.log(players)
    // Goes through each player
    for (var i=0; i < players.length; i++) {
        var cur = data[players[i]]
        var cap = cur["name"].charAt(0).toUpperCase() + cur["name"].slice(1)
        // Makes Elements
        var box = document.createElement("div")
        box.className = "top_con result"
        // Navbar
        var nav = document.createElement("div")
        nav.className = "navbar"
        // Players Drafted Players
        var d_pick = document.createElement("div")
        d_pick.id = cap
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
        // Shows all drafted players
        for (var t=0; t < cur["draft"].length; t++) {
            // 0 = team | 1 = Name | 2 = Position
            d_pick.appendChild(placePick(cur["draft"][t][0], cur["draft"][t][1], cur["draft"][t][2]))
        }
        box.appendChild(d_pick)
        $("#main").append(box)
    }
}

// Places the player
function placePick(tm, play, pos) {
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

// gets the draft.json data from server
const getData = async() => {
    const data = await fetch(`/draft`)
        .then((res) => res.json())
    return data
}
getData().then(d => placeBoxes(d))