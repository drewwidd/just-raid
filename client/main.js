import * as utilities from "../shared/utilities.js"; 

const accountName = document.getElementById("login-input");
const loginButton = document.getElementById("login-button");
const loginUI = document.getElementById("login-ui");
const loginAuthenticationBox = document.getElementById("login-authentication-box");
const loginErrorBox = document.getElementById("login-error-box");
const loginErrorText = document.getElementById("login-error-text");
const loginErrorButton = document.getElementById("login-error-button");

const lobbyUI = document.getElementById("lobby-ui");
const lobbyBackButton = document.getElementById("back-button");
const lobbyGameRooms = document.getElementById("lobby-game-rooms");
const lobbyNewGameButton = document.getElementById("new-game-button");
const gameUI = document.getElementById("game-ui");
const gameChat = document.getElementById("game-chat");
const gameChatInput = document.getElementById("game-chat-input");
const loginScreenMusic = new Audio("./resources/audio/login_music.mp3");

//Once the page has been fully loaded create our application object
window.addEventListener('DOMContentLoaded',Initalize);

let socket;
let lobbyGameInfo = {};

function Initalize()
{
    loginUI.onclick = StartAudio;

    //Show the Login Screen
    ShowLogin();
}

function LoginButtonClicked()
{
    loginButton.onclick = '';
    socket = io("ws://127.0.0.1:10000",{ upgrade: false, transports: ['websocket'] });
    socket.on("connect_error", (error) => OnConnectionError(error));
    socket.on("connect", () => OnConnect());
    socket.on("disconnect", () => OnDisconnect());
    socket.on("authentication", (response) => OnAuthenticationResponse(response));
}
function ShowLogin()
{
    accountName.value = "";
    if(socket)
    {
        socket.close();
    }
    loginButton.onclick = LoginButtonClicked;
    loginUI.style.visibility = 'visible';
    loginAuthenticationBox.style.opacity = 1;
    loginAuthenticationBox.style.visibility = 'visible';
    loginErrorBox.style.visibility = 'hidden';
    lobbyUI.style.visibility = 'hidden';
    gameUI.style.visibility = 'hidden';
}

function StartAudio()
{
    if(loginScreenMusic.paused)
    {
        loginScreenMusic.volume = 0.5;
        loginScreenMusic.loop = true;
        loginScreenMusic.play();
    }
}

function HideLogin()
{
    loginUI.style.visibility = 'hidden';
    loginAuthenticationBox.style.visibility = 'hidden';
}


function ShowLoginError(error)
{
    loginErrorText.innerHTML = error;
    loginErrorButton.onclick = LoginErrorButtonClicked;
    loginErrorBox.style.visibility = 'visible';
    loginAuthenticationBox.style.opacity = 0.2;
}

function LoginErrorButtonClicked()
{
    ShowLogin();
}

function LobbyBackButtonClicked()
{
    ShowLogin();
}

function LobbyNewGameButtonClicked()
{
    socket.emit("create-room");
}

function OnRoomUpdate(rooms)
{
    console.dir(rooms);
    console.log(`Received room update. Total: ${utilities.GetObjectLength(rooms)}`);
    
    console.log(`Rooms im already displaying: ${utilities.GetObjectLength(lobbyGameInfo)}`)
    //First let's iterate through the old rooms and if there are any in our list that aren't in the new list remove them
    const roomKeys = Object.keys(rooms);
    for (const [id, gameDiv] of Object.entries(lobbyGameInfo))
    {
        if(!roomKeys.includes(id))
        {
            gameDiv.remove();
            delete lobbyGameInfo[id];
        }
    }

    //Now iterate through the new rooms and add/update as appropriate
    const gameDivs = Object.keys(lobbyGameInfo);
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
            newDiv.onclick = function() {OnJoinRoomClick(room.id)};
            lobbyGameRooms.appendChild(newDiv);
            lobbyGameInfo[room.id] = newDiv;
        }
        lobbyGameInfo[id].innerHTML = roomDisplayValue;
    }
}

function OnJoinRoomClick(roomID)
{
    socket.emit("join-room",roomID);
}

function ShowLobby()
{
    HideLogin();
    lobbyBackButton.onclick = LobbyBackButtonClicked;
    lobbyNewGameButton.onclick = LobbyNewGameButtonClicked;
    gameUI.style.visibility = 'hidden';
    lobbyUI.style.visibility = 'visible';
    
    socket.on("rooms", (rooms) => OnRoomUpdate(rooms));
    socket.on("join-room-success", () => OnJoinRoomSuccess());
    socket.emit("get-rooms");
}


function ShowGame()
{
    HideLogin();
    loginScreenMusic.pause();
    lobbyUI.style.visibility = 'hidden';
    gameUI.style.visibility = 'visible';
    
    gameUI.onkeypress = function(key){OnGameKeyPress(key)};
    gameChatInput.onkeypress = function(key){OnChatKeyPress(key)};
    socket.on("server-message", (message) => OnServerMessage(message));
    socket.on("user-message", (message) => OnUserMessage(message));
}

function OnGameKeyPress(key)
{
    var keyCode = key.code || key.key;
    console.log(keyCode);
}
function OnChatKeyPress(key)
{
    var keyCode = key.code || key.key;
    if(keyCode=="Enter" || keyCode=="NumpadEnter")
    {
        var message = gameChatInput.value;
        gameChatInput.value = "";
        if(message)
        {
            socket.emit("chat-message",message);
        }
    }
}

function OnServerMessage(message)
{
    console.log(`Received server message: ${message}`);
    gameChat.innerHTML += message+"<br>";
}

function OnUserMessage(message)
{
    console.log(`Received user message: ${message} ${message.username}: ${message.message}`);
    gameChat.innerHTML += message.username+": "+message.message+"<br>";
    gameChat.scrollTop = gameChat.scrollHeight;
}

function OnConnectionError(error)
{
    socket.close();
    ShowLoginError("Error: Unable to Connect");
}
function OnJoinRoomSuccess()
{
    ShowGame();
}
function OnConnect()
{
    console.log("Connected to the server");
    var authenticationInputs = 
    {
        username: accountName.value,
    };
    accountName.value = "";
    console.log(`Authenticating with username: ${authenticationInputs.username}`)
    socket.volatile.emit("authenticate",authenticationInputs);
}
function OnAuthenticationResponse(response)
{
    var logResponse = `Received authentication response. Authenticated: ${response.authenticated}`;
    if(!response.authenticated)
    {
        logResponse+= ` Error: ${response.error}`;
    }
    console.log(logResponse);
    if(response.authenticated)
    {
        ShowLobby();
    }
    else
    {
        ShowLoginError(response.error);
    }
}
function OnDisconnect()
{
    socket.close();
    console.log("Disconnected from the server");
    ShowLogin();
    ShowLoginError("Disconnected from Server");
}