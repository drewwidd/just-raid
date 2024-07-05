import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
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

    //Temporary code here to auto log in as "Drew"
    loginScreen.authenticationBox.accountNameInput.value = "Drew";
    loginScreen.authenticationBox.loginButton.click();
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
    const logResponse = `Received authentication response. Authenticated: ${response.authenticated}`;
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

    //Temporary code for testing to automatically create a new game
    //onNewGameButtonClick();
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
    gameScreen.destroy();
    gameScreen = null;
    lobbyScreen.show();
}