// The world server handles:
//  - Clients connecting/disconnecting
//  - Authentication
//  - Users requesting the current available rooms
//  - Users creating/joining rooms

import * as utilities from "../shared/utilities.js"; 
import * as gameServer from "./game-server.js";

class LoginClient
{
    constructor(socket)
    {
        this.socket = socket;
        this.username = "";
        this.authenticated = false;
        this.authenticationError = "";
    }

    get id()
    {
        return this.socket.id;
    }
}

export class WorldServer
{
    #LobbyRoom = "Server::Lobby";
    #GameRoomPrefix = "User::";

    constructor(socket_io)
    {
        this.io = socket_io;
        this.clients = {};
        this.gameServers = {};
    }

    Start()
    {
        this.io.on("connection", socket => this.OnConnect(socket));
    }
    OnConnect(socket)
    {
        console.log(`Connected: ${socket.id}`);
        var loginClient = new LoginClient(socket);
        this.clients[loginClient.id] = loginClient;

        //Register for the other events handled by the world server
        loginClient.socket.on("disconnect", () => this.OnDisconnect(loginClient));
        loginClient.socket.on("authenticate", inputs => this.OnAuthenticate(loginClient,inputs));
        loginClient.socket.on("get-rooms",() => this.OnGetRooms(loginClient));
        loginClient.socket.on("create-room",() => this.OnCreateRoom(loginClient));
        loginClient.socket.on("join-room",roomToJoin => this.OnJoinRoom(loginClient,roomToJoin));
        loginClient.socket.on("leave-room",roomToLeave => this.OnLeaveRoom(loginClient,roomToLeave));
    }
    OnDisconnect(loginClient)
    {
        console.log(`Disconnected: ${loginClient.id}`);
        delete this.clients[loginClient.id];
    }
    OnAuthenticate(loginClient,inputs)
    {
        var usernameValid = inputs.username.length>3 && inputs.username.length<=12 && utilities.IsAllLetters(inputs.username);
        var usernameTaken = false;
        if(usernameValid)
        {
            for(const [id, client] of Object.entries(this.clients)) 
            {
                var clientUsername = client.username;
                if(clientUsername && inputs.username.toLowerCase()==clientUsername.toLowerCase() && client.authenticated)
                {
                    usernameTaken =true;
                    break;
                }
            }
        }
        var authenticationSuccess = usernameValid && !usernameTaken;
        console.log(`Authenticating ${loginClient.id}, Username: ${inputs.username} Success: ${authenticationSuccess}`);
        loginClient.authenticated = authenticationSuccess;
        loginClient.authenticationError = "";
        if(!usernameValid)
        {
            loginClient.authenticationError = "Username is invalid. Must be between 4 and 12 characters and contain only letters";
        }
        else if(usernameTaken)
        {
            loginClient.authenticationError = "Username already in use";
        }
        else
        {
            loginClient.username = inputs.username;

            // Join the user to the lobby where room events will be broadcast
            loginClient.socket.join(this.#LobbyRoom);
        }
    
        var authenticationResponse = 
        {
            authenticated: loginClient.authenticated,
            error: loginClient.authenticationError
        }
    
        loginClient.socket.emit("authentication",authenticationResponse);
    }
    SendRoomData(toWhom)
    {
        toWhom.emit("rooms",this.GetGameServerData());
    }
    OnGetRooms(loginClient)
    {
        this.SendRoomData(loginClient.socket);
    }
    GetGameServerData()
    { 
        var gameServersData = {};
        for(const [id, server] of Object.entries(this.gameServers)) 
        {
            var gameServerData = 
            {
                id: server.id,
                currentPlayers: server.currentPlayers,
                maximumPlayers: server.maximumPlayers
            }
            gameServersData[gameServerData.id] = gameServerData;
        }
        return gameServerData;
    }
    OnCreateRoom(loginClient)
    {
        var newGameRoom = new gameServer.GameServer(this.io,this.#GameRoomPrefix+loginClient.username);
        this.gameServers[newGameRoom.id] = newGameRoom;

        //join the client to the room
        this.OnJoinRoom(loginClient,newGameRoom);
    }
    OnJoinRoom(loginClient,roomToJoin)
    {
        this.gameServers[roomToJoin.id].Join(loginClient);
        //Because the user joined a room, remove them from the lobby so they no longer receive lobby updates
        loginClient.socket.leave(this.#LobbyRoom);

        //Inform everyone in the lobby of the room update
        this.SendRoomData(this.io.in(this.#LobbyRoom));
    }
    OnLeaveRoom(loginClient,roomToLeave)
    {
        this.gameServers[roomToJoin.id].Leave(loginClient);
        //Check if this was the last person in the room, in which case destroy it
        if(this.gameServers[roomToJoin.id].IsEmpty())
        {
            delete this.gameServers[roomToJoin.id];

            //Inform everyone in the lobby of the room update
            this.SendRoomData(this.io.in(this.#LobbyRoom));
        }
        //Because the user left a room, rejoin them to the lobby so they can receive lobby updates
        loginClient.socket.join(this.#LobbyRoom);
    }
}