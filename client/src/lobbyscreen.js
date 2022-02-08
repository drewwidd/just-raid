import * as cs from "./clientscreen.js";

export class LobbyScreen extends cs.ClientScreen
{
    constructor(onBackButtonClick,onJoinGameClick)
    {
        super();
        this.onBackButtonClick = onBackButtonClick;
        this.onJoinGameClick = onJoinGameClick;
        this.container = document.getElementById("lobby-ui");
        this.backButton = document.getElementById("lobby-back-button");
        this.newGameButton = document.getElementById("lobby-newgame-button");
        this.gameRooms = document.getElementById("lobby-game-rooms");
        this.backButton.onclick = this.onBackButtonClick;
        this.gameInfo = {};
    }
    show()
    {
        this.container.style.visibility = "visible";
    }
    hide()
    {
        this.container.style.visibility = "hidden";
    }
    onRoomUpdate(rooms)
    {
        //First let's iterate through the old rooms and if there are any in our list that aren't in the new list remove them
        const roomKeys = Object.keys(rooms);
        for (const [id, gameDiv] of Object.entries(this.gameInfo))
        {
            if(!roomKeys.includes(id))
            {
                gameDiv.remove();
                delete this.gameInfo[id];
            }
        }

        //Now iterate through the new rooms and add/update as appropriate
        const gameDivs = Object.keys(this.gameInfo);
        for(const [id, room] of Object.entries(rooms)) 
        {
            const displayedRoomName = room.id.substring(6);   //Cut off the User:: part
            const roomDisplayValue = displayedRoomName + "&#160;&#160;&#160;&#160;&#160;"+room.currentPlayers+"/"+room.maximumPlayers;
            if(!gameDivs.includes(id))
            {
                console.log(`Room: ${room.id} Current Players: ${room.currentPlayers} Maximum Players: ${room.maximumPlayers}`);
                
                const newDiv = document.createElement("div");
                newDiv.classList.add("lobby-game-room");
                newDiv.id = `lobby-game-${room.id}`;
                newDiv.onclick = () => this.onJoinGameClick(room.id);
                this.gameRooms.appendChild(newDiv);
                this.gameInfo[room.id] = newDiv;
            }
            this.gameInfo[id].innerHTML = roomDisplayValue;
        }
    }
}