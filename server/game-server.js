import * as utilities from "../shared/utilities.js"; 

export class GameServer
{
    #io;            //This field MUST be private so that we don't transmit it and cause an endless recursion
    #players = {};  //This field MUST be private as it contains socket information that we don't want to pass to all players

    constructor(io,id)
    {
        this.#io = io;
        this.id = id;
        this.maximumPlayers = 20;
    }

    Join(loginClient)
    {
        console.log(`Player ${loginClient.username} joined room ${this.id}`);
        this.#players[loginClient.id] = loginClient;
        loginClient.socket.on("authenticate", message => this.OnChatMessage(loginClient,message));

        //join the user to the socket room
        loginClient.socket.join(this.id);

        //send server chat message to everyone in the room
        this.#io.in(this.id).emit("server-message",`${loginClient.username} has joined the room.`);
    }

    Leave(loginClient)
    {
        console.log(`Player ${loginClient.username} left room ${this.id}`);

        //send server chat message to everyone in the room
        this.#io.in(this.id).emit(`${loginClient.username} has left the room.`);
        delete this.#players[loginClient.id];
    }

    OnChatMessage(loginClient,message)
    {
        var broadcastMessage = 
        {
            username:loginClient.username,
            message: message
        }
        this.#io.in(this.id).emit("user-message",broadcastMessage);
    }
    get currentPlayers()
    {
        var totalPlayers = 0;
        if(this.#players)
        {
            totalPlayers = utilities.GetMapLength(this.#players);
        }
        console.log(`Returning ${totalPlayers}`);
        return totalPlayers;
    }

    IsEmpty()
    {
        return this.currentPlayers()==0;
    }
}