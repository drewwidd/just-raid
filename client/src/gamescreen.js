import * as cs from "./clientscreen.js";

class GameMenu
{
    constructor(socket,onLogout,roomID)
    {
        this.socket = socket;
        this.onLogout = onLogout;
        this.roomID = roomID;
        this.container = document.getElementById("game-menu");
        this.logoutButton = document.getElementById("game-logout-button");
        this.logoutButton.onclick = () => this.onLogoutButtonClick()
        this.returnToGameButton = document.getElementById("game-return-button");
        this.returnToGameButton.onclick = () => this.hide();
    }
    onLogoutButtonClick()
    {
        this.socket.emit("leave-room",this.roomID);
        this.onLogout();
    }
    toggle()
    {
        if(this.isShown())
        {
            this.hide();
        }
        else
        {
            this.show();
        }
    }
    show()
    {
        this.container.style.visibility = "visible";
    }
    hide()
    {
        this.container.style.visibility = "hidden";
    }
    isShown()
    {
        return this.container.style.visibility=="visible";
    }
}
export class GameScreen extends cs.ClientScreen
{
    constructor(socket,onLogout,roomID)
    {
        console.log("Creating the game screen");
        super();
        this.socket = socket;
        this.roomID = roomID;
        this.container = document.getElementById("game-ui");
        this.gameChat = document.getElementById("game-chat");
        this.gameChat.innerHTML = null;
        this.gameChatInput = document.getElementById("game-chat-input");
        this.gameMenu = new GameMenu(socket,onLogout,roomID);
        
        document.onkeydown = (key) => this.onGameKeyPress(key);
        this.gameChatInput.onkeydown = (key) => this.onChatKeyPress(key);
        this.socket.on("server-message", (message) => this.onServerMessage(message));
        this.socket.on("user-message", (message) => this.onUserMessage(message));
    }
    //not sure if JS has destructors so we'll do this for now
    destroy()
    {
        this.hide();
        document.onkeydown = null;
        this.gameChatInput.onkeydown = null;
        this.socket.removeAllListeners("server-message");   //socket.off wasn't working but this does (as long as no other classes are also listening for this message)
        this.socket.removeAllListeners("user-message");     //socket.off wasn't working but this does (as long as no other classes are also listening for this message
    }
    onGameKeyPress(key)
    {
        var keyCode = key.code || key.key;
        if(keyCode=="Escape" && this.isShown())
        {
            this.gameMenu.toggle();
        }
    }
    onChatKeyPress(key)
    {
        var keyCode = key.code || key.key;
        if(keyCode=="Enter" || keyCode=="NumpadEnter")
        {
            var message = this.gameChatInput.value;
            this.gameChatInput.value = "";
            if(message)
            {
                console.log("sending message");
                this.socket.emit("chat-message",message);
            }
        }
    }
    onServerMessage(message)
    {
        console.log(`Server message!: ${message}`);
        const messageToUpdate = message;
        this.updateChatBox(messageToUpdate);
    }
    
    onUserMessage(message)
    {
        console.log(`User message!: ${message}`);
        const messageToUpdate = message.username+": "+message.message;
        this.updateChatBox(messageToUpdate);
    }
    updateChatBox(message)
    {
        console.log(`Updaitng chatbox with ${message}`);
        const currentTime = new Date().toLocaleTimeString();
        //this.gameChat.innerHTML += "["+currentTime.getHours()+":"+currentTime.getMinutes()+":"+currentTime.getSeconds()+"] "+message+"<br>";
        this.gameChat.innerHTML += "["+currentTime+"] "+message+"<br>";
        this.gameChat.scrollTop = this.gameChat.scrollHeight;
    }
    show()
    {
        this.container.style.visibility = "visible";
    }
    hide()
    {
        this.gameMenu.hide();
        this.container.style.visibility = "hidden";
    }
    isShown()
    {
        return this.container.style.visibility=="visible";
    }
}