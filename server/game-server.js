import * as utilities from "../shared/utilities.js"; 

class Player
{
    #client;
    constructor(loginClient)
    {
        this.#client = loginClient;
        this.leader = false;
    }
}
export class GameServer
{
    #io;            //This field MUST be private so that we don't transmit it and cause an endless recursion

    constructor(io,id,onUpdate,onDestroy)
    {
        this.#io = io;
        this.players = {};
        this.id = id;
        this.maximumPlayers = 20;
        this.onUpdate = onUpdate;
        this.onDestroy = onDestroy;
    }

    Join(loginClient)
    {
        console.log(`Player ${loginClient.username} joined room ${this.id}`);
        loginClient.socket.on("disconnect", () => this.OnDisconnect(loginClient));
        const newPlayer = new Player(loginClient);
        if(this.IsEmpty())
        {
            console.log(`Making Player ${loginClient.username} the leader.`);
            newPlayer.leader = true;    //If this is the first person to join the room make them the leader
        }
        this.players[loginClient.id] = newPlayer;
        loginClient.socket.on("chat-message", message => this.OnChatMessage(loginClient,message));

        //join the user to the socket room
        loginClient.socket.join(this.id);

        loginClient.socket.emit("join-room-success",this.id);

        //send server chat message to everyone in the room
        this.#io.in(this.id).emit("server-message",`${loginClient.username} has joined the room.`);

        this.onUpdate();
    }

    OnDisconnect(loginClient)
    {
        console.log(`Player ${loginClient.username} disconnected.`);
        this.Leave(loginClient);
    }

    Leave(loginClient)
    {
        console.log(`Player ${loginClient.username} left room ${this.id}`);

        //Clean up the loginClient socket
        loginClient.socket.removeAllListeners("chat-message");
        //We should remove our listener for the disconnect call too but the problem is this will remove it elsewhere and we don't want that. Need to revisit this
        // ideally we would just remove our listener but that does not seem to be working

        //send server chat message to everyone in the room
        this.#io.in(this.id).emit("server-message",`${loginClient.username} has left the room.`);
        delete this.players[loginClient.id];

        //Promote someone else to leader or if the room is now empty close the room
        if(!this.IsEmpty())
        {
            //Promote the first person to leader
            const playerID = Object.keys(this.players)[0];
            this.players[playerID].leader = true;
        }
        else
        {
            //Close the room
            this.onDestroy(this);
        }
        this.onUpdate();
    }

    OnChatMessage(loginClient,message)
    {
        var broadcastMessage = 
        {
            username:loginClient.username,
            message: message
        }
        console.log(`Recived message from ${broadcastMessage.username}: ${broadcastMessage.message}`)
        this.#io.in(this.id).emit("user-message",broadcastMessage);
    }

    get currentPlayers()
    {
        var totalPlayers = 0;
        if(this.players)
        {
            totalPlayers = utilities.GetObjectLength(this.players);
        }
        return totalPlayers;
    }

    IsEmpty()
    {
        return this.currentPlayers==0;
    }
}