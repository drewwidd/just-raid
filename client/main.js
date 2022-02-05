const accountName = document.getElementById("login-input");
const loginButton = document.getElementById("login-button");
const loginUI = document.getElementById("login-ui");
const loginAuthenticationBox = document.getElementById("login-authentication-box");
const loginErrorBox = document.getElementById("login-error-box");
const loginErrorText = document.getElementById("login-error-text");
const loginErrorButton = document.getElementById("login-error-button");
const lobbyUI = document.getElementById("lobby-ui");
const gameUI = document.getElementById("game-ui");
const loginScreenMusic = new Audio("./resources/audio/login_music.mp3");

//Once the page has been fully loaded create our application object
window.addEventListener('DOMContentLoaded',Initalize);

let socket;

function Initalize()
{
    loginUI.onclick = StartAudio;

    //Show the Login Screen
    ShowLogin();
}

function LoginButtonClicked()
{
    loginButton.onclick = '';
    socket = io("ws://127.0.0.1:10000");
    socket.on("connect_error", (error) => OnConnectionError(error));
    socket.on("connect", () => OnConnect());
    socket.on("disconnect", () => OnDisconnect());
    socket.on("authentication", (response) => OnAuthenticationResponse(response));
}
function ShowLogin()
{
    accountName.value = "";
    loginButton.onclick = LoginButtonClicked;
    loginUI.style.visibility = 'visible';
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
    console.log(error);
    loginErrorText.innerHTML = error;
    loginErrorButton.onclick = LoginErrorButtonClicked;
    loginErrorBox.style.visibility = 'visible';
    loginAuthenticationBox.style.opacity = 0.2;
}

function LoginErrorButtonClicked()
{
    loginAuthenticationBox.style.opacity = 1;
    ShowLogin();
}

function ShowLobby()
{
    HideLogin();
    gameUI.style.visibility = 'hidden';
    lobbyUI.style.visibility = 'visible';
}

function ShowGame()
{
    HideLogin();
    loginScreenMusic.pause();
    lobbyUI.style.visibility = 'hidden';
    gameUI.style.visibility = 'visible';
}

function OnConnectionError(error)
{
    socket.close();
    ShowLoginError("Error: Unable to Connect");
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