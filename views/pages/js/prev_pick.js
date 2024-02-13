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