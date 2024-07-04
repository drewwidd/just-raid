import { World } from "./physics.js";
import * as utilities from "../shared/utilities.js"; 
import { TestMap } from "./maps/testmap.js";
import CANNON from "cannon";

class Player
{
    #client;
    #body;
    constructor(loginClient,world)
    {
        this.#client = loginClient;
        this.leader = false;
        this.id = loginClient.id;
        this.size = new CANNON.Vec3(10,20,10);

        this.spawn(world);
    }

    spawn(world)
    {
        this.#body = new CANNON.Body(
        {
            shape: new CANNON.Box(new CANNON.Vec3(this.size.x/2,this.size.y/2,this.size.z/2)),
            mass: 100,
            position: new CANNON.Vec3(0,50,0),
            angularDamping:1,
        });
        world.addBody(this.#body);
    }

    despawn(world)
    {
        world.removeBody(this.#body);
    }

    getInfo()
    {
        const info =
        {
            id : this.id,
            leader: this.leader,
            size: this.size,
            position: this.#body.position,
            quaternion: this.#body.quaternion
        }
        return info;
    }
}

export class GameServer
{
    #io;            //This field MUST be private so that we don't transmit it and cause an endless recursion

    constructor(io,id,onUpdate,onDestroy)
    {
        this.#io = io;
        this.players = {};
        this.rooms = [];
        this.id = id;
        this.maximumPlayers = 20;
        this.onUpdate = onUpdate;
        this.onDestroy = onDestroy;

        this.initalize();
        setInterval(() => this.updateGameState(),1000/60);
        setInterval(() => this.updateClients(),100);
    }
    initalize()
    {
        //Create the physics world so we can run server side physics
        this.world = new World();

        //Create the Test Map
        const testMap = new TestMap(this.world);
        this.rooms.push(testMap.name);
    }
    updateGameState()
    {
        const timeBetweenFrames = (1/60);   //60 FPS

        //Update the objects using physics
        this.world.step(timeBetweenFrames);
    }
    updateClients()
    {
        const playerInfo = {};
        for (const [id, player] of Object.entries(this.players))
        {
            playerInfo[id] = player.getInfo();
        }
        const gameState = 
        {
            rooms: this.rooms,
            players: playerInfo
        }
        this.#io.in(this.id).emit("game-update",gameState);
    }

    Join(loginClient)
    {
        console.log(`Player ${loginClient.username} joined room ${this.id}`);
        loginClient.socket.on("disconnect", () => this.OnDisconnect(loginClient));
        const newPlayer = new Player(loginClient,this.world);
        if(this.IsEmpty())
        {
            console.log(`Making Player ${loginClient.username} the leader.`);
            newPlayer.leader = true;    //If this is the first person to join the room make them the leader
        }
        this.players[loginClient.id] = newPlayer;
        loginClient.socket.on("chat-message", message => this.OnChatMessage(loginClient,message));
        loginClient.socket.on("user-update", inputs => this.OnUserUpdate(loginClient,inputs));

        //join the user to the socket room
        loginClient.socket.join(this.id);

        loginClient.socket.emit("join-room-success",this.id);

        //send server chat message to everyone in the room
        this.#io.in(this.id).emit("server-message",`${loginClient.username} has joined the room.`);

        this.onUpdate();
    }
    OnUserUpdate(loginClient,inputs)
    {
    }

    OnDisconnect(loginClient)
    {
        console.log(`Player ${loginClient.username} disconnected.`);
        this.Leave(loginClient);
    }

    Leave(loginClient)
    {
        this.players[loginClient.id].despawn();
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