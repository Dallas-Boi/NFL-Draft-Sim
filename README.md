<h3>About</h3>
<p>I made this <b style="color:red">N</b><b style="color:blue">F</b>L Draft Simulator to help me and my friends play our own fantasy draft in madded 23 with madded 23 players. Not all players in Madded 23 are in the players.json because this JSON file had all players on release and then I removed all players below 70 OVR.</p>

<h3>NFL Draft Simulator (2022 Season)</h3>
<p>To start the draft. Have everyone connected to the <a href="#Instructions">nodeJS</a> server.</p>

<h3 id="Instructions">Instructions</h3>
<ul>
    <li>1. Change the "id" in <b>draft_settings.json</b> to your own draft ID</li>  
    <li>2. Add any players you don't want in the draft to "not_draftable" in <b>draft_settings.json</b> (It has to be their first,last, and abrriviation (Jr, II, etc.) exactly how it is in the <b>/views/players.json<b> file )</li>
    <li>3. Use "node index.js"</li>
    <li>4. Connect all clients (This uses socket io to auto connect clients to the server)</li>
    <li>5. Have all players enter their name, draft pick, and team icon. Once ready click the ready Button</li>
    <li>6. Once all players are ready the draft simulator will start.</li>
    <li>7. After the Draft you can see all drafted player's by either using the Link on the main page or by going to {hostname}/results</li>
</ul>