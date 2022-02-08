import { LoginScreen } from "./src/loginscreen.js";
import { LobbyScreen } from "./src/lobbyscreen.js";
import { GameScreen } from "./src/gamescreen.js";

//Once the page has been fully loaded create our application object
window.addEventListener('DOMContentLoaded',initalize);

let socket;
let loginScreen;
let lobbyScreen;
let gameScreen;

function initalize()
{
    loginScreen = new LoginScreen(onLoginButtonClick);
    loginScreen.show();
}

function onLoginButtonClick()
{
    socket = io("ws://127.0.0.1:10000",{ upgrade: false, transports: ['websocket'] });
    socket.on("connect_error", (error) => onConnectionError(error));
    socket.on("connect", () => onConnect());
    socket.on("disconnect", () => onDisconnect());
    socket.on("authentication", (response) => onAuthenticationResponse(response));
}

function onConnectionError(error)
{
    socket.close();
    loginScreen.showLoginError("Error: Unable to Connect");
}

function onConnect()
{
    console.log("Connected to the server");
    const accountNameInput = loginScreen.authenticationBox.getInput();
    const authenticationInputs = 
    {
        username: accountNameInput,
    };
    loginScreen.authenticationBox.clearInput();
    console.log(`Authenticating with username: ${authenticationInputs.username}`)
    socket.volatile.emit("authenticate",authenticationInputs);
}
function onDisconnect()
{
    socket.close();
    console.log("Disconnected from the server");
    if(gameScreen!=undefined)
    {
        gameScreen.destroy();
        gameScreen = null;
    }
    if(lobbyScreen!=undefined)
    {
        lobbyScreen.hide();
        lobbyScreen = null;
    }
    loginScreen.show();
    loginScreen.showLoginError("Disconnected from Server");
}
function onAuthenticationResponse(response)
{
    var logResponse = `Received authentication response. Authenticated: ${response.authenticated}`;
    if(!response.authenticated)
    {
        logResponse+= ` Error: ${response.error}`;
    }
    if(response.authenticated)
    {
        createLobby();
    }
    else
    {
        loginScreen.showLoginError(response.error);
    }
}

// Create and Show the Lobby
function createLobby()
{
    lobbyScreen = new LobbyScreen(onBackButtonClick,onJoinRoomClick);
    lobbyScreen.newGameButton.onclick = onNewGameButtonClick;
    loginScreen.hide();
    lobbyScreen.show();
    socket.on("rooms", (rooms) => lobbyScreen.onRoomUpdate(rooms));
    socket.on("join-room-success", (roomID) => onJoinGameSuccess(roomID));
    socket.emit("get-rooms");
}

function onBackButtonClick()
{
    lobbyScreen.hide();
    socket.close();
    loginScreen.show();
    lobbyScreen = null;
}
function onNewGameButtonClick()
{
    socket.emit("create-room");
}
function onJoinRoomClick(roomID)
{
    socket.emit("join-room",roomID);
}
function onJoinGameSuccess(roomID)
{
    gameScreen = new GameScreen(socket,onLogout,roomID);
    loginScreen.stopAudio();
    lobbyScreen.hide();
    gameScreen.show();
}
function onLogout()
{
    console.log("User logging out of the game");
    gameScreen.destroy();
    gameScreen = null;
    lobbyScreen.show();
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