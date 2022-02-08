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
        super();
        this.socket = socket;
        this.roomID = roomID;
        this.container = document.getElementById("game-ui");
        this.gameChat = document.getElementById("game-chat");
        this.gameChat.innerHTML = null;
        this.gameChat.style.visibility = "visible";
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
        this.gameChat.style.visibility = "hidden";
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
                this.socket.emit("chat-message",message);
            }
        }
    }
    onServerMessage(message)
    {
        const messageToUpdate = message;
        this.updateChatBox(messageToUpdate);
    }
    
    onUserMessage(message)
    {
        if(message.message.toString().startsWith("/")) //if the message starts with a backslash
        {
            this.processUserCommands(message.message);
        }
        else
        {
            const messageToUpdate = message.username+": "+message.message;
            this.updateChatBox(messageToUpdate);
        }
    }
    processUserCommands(message)
    {
        const command = message.substr(1).split(' ')[0];
        console.log(`Command: $${command}$`);
        console.log(`Command: $${this.gameChat.style.visibility}$`);
        switch(command)
        {
            case "chat":    // toggle teh chat box open or close
                if(this.gameChat.style.visibility=="visible")
                {
                    console.log("Hiding chat");
                    this.gameChat.style.visibility = "hidden";
                }
                else
                {
                    console.log("Showing chat");
                    this.gameChat.style.visibility = "visible";
                }
                break;
        }
    }
    updateChatBox(message)
    {
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











//The following code allows us to drag an item of the UI around. 
/*
var dragItem = gameChat;
var container = gameUI;

var active = false;
var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;

container.addEventListener("touchstart", dragStart, false);
container.addEventListener("touchend", dragEnd, false);
container.addEventListener("touchmove", drag, false);

container.addEventListener("mousedown", dragStart, false);
container.addEventListener("mouseup", dragEnd, false);
container.addEventListener("mousemove", drag, false);

function dragStart(e) {
  if (e.type === "touchstart") 
  {
    initialX = e.touches[0].clientX - xOffset;
    initialY = e.touches[0].clientY - yOffset;
  } 
  else 
  {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }

  if (e.target === dragItem)    //should add a check here and only allow a drag to start if shift is being held
  {
    active = true;
  }
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;

  active = false;
}

function drag(e) {
  if (active) {
  
    e.preventDefault();
  
    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, dragItem);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
}*/