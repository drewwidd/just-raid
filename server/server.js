const socket_io = require("socket.io");
const admin_ui = require("@socket.io/admin-ui");
var portNumber = 10000;

let io = null;
var clients = {};

function Initalize()
{
    const serverOptions =
    {
        cors: 
        {
            origin: "*"
        }
    };
    io = new socket_io.Server(portNumber,serverOptions);
    console.log("Server started on port "+portNumber);
    io.on("connection", socket => onConnect(socket));
}

function onConnect(socket)
{
    clients[socket.id] = socket;
    console.log(`Connected: ${socket.id}`);
    socket.on("disconnect", () => onDisconnect(socket));
    socket.on("authenticate", inputs => onAuthenticate(socket,inputs));
}

function onAuthenticate(socket,inputs)
{
    var usernameValid = inputs.username.length>3 && inputs.username.length<=12;
    var usernameTaken = false;
    if(usernameValid)
    {
        for(const [id, client] of Object.entries(clients)) 
        {
            var clientUsername = client.username;
            if(clientUsername && inputs.username.toLowerCase()==clientUsername.toLowerCase() && client.authenticated)
            {
                usernameTaken =true;
                break;
            }
        }
        console.log(`Authenticating ${socket.id}, Username: ${inputs.username} Available: ${!usernameTaken}`)
    }

    if(!usernameValid)
    {
        socket.authenticationError = "Username is invalid. Must be between 4 and 12 characters";
        socket.authenticated = false;
    }
    else if(usernameTaken)
    {
        socket.authenticationError = "Username already in use";
        socket.authenticated = false;
    }
    else
    {
        socket.authenticationError = "";
        socket.authenticated = true;
    }
    socket.username = inputs.username;

    var authenticationResponse = 
    {
        authenticated: socket.authenticated,
        error: socket.authenticationError
    }

    socket.emit("authentication",authenticationResponse);
}

function onDisconnect(socket)
{
    delete clients[socket.id];
    console.log(`Disconnected: ${socket.id}`);
}

Initalize();
admin_ui.instrument(io, {auth: false})