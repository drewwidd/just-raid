import { World } from "./physics.js";
import * as utilities from "../shared/utilities.js"; 
import { TestMap } from "./maps/testmap.js";
import CANNON from "cannon";

class Player
{
    #client;
    body;
    constructor(loginClient,world)
    {
        this.#client = loginClient;
        this.leader = false;
        this.id = loginClient.id;
        this.size = new CANNON.Vec3(10,20,10);
        this.class = "Mage";
        this.canJump = false;

        this.spawn(world);
    }

    spawn(world)
    {
        this.body = new CANNON.Body(
        {
            shape: new CANNON.Box(new CANNON.Vec3(this.size.x/2,this.size.y/2,this.size.z/2)),
            mass: 100,
            material: world.physicsMaterial,
            position: new CANNON.Vec3(0,100,0),
            angularDamping:1,   //this keeps the player box from tipping over
        });
        this.body.addEventListener('collide', (e) => 
        {
            if (e.contact.ni.y==1)
            {
                this.canJump = true;
            }
        });
        world.addBody(this.body);
    }

    despawn(world)
    {
        world.removeBody(this.body);
    }

    getInfo()
    {
        const info =
        {
            id : this.id,
            leader: this.leader,
            size: this.size,
            position: this.body.position,
            quaternion: this.body.quaternion,
            name: this.#client.username,
            class: this.class
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
        //console.log("Starting Update "+JSON.stringify(Object.entries(this.players)));
        const playerInfo = {};
        for (const [id, player] of Object.entries(this.players))
        {
            //console.log("adding player info");
            playerInfo[id] = player.getInfo();
        }
        const gameState = 
        {
            rooms: this.rooms,
            players: playerInfo,
            t: Date.now()
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
        loginClient.socket.on("user-update", update => this.OnUserUpdate(loginClient,update));

        //join the user to the socket room
        loginClient.socket.join(this.id);

        loginClient.socket.emit("join-room-success",this.id);

        //send server chat message to everyone in the room
        this.#io.in(this.id).emit("server-message",`${loginClient.username} has joined the room.`);

        this.onUpdate();
    }
    OnUserUpdate(loginClient,update)
    {
        //console.log("Received update from client "+JSON.stringify(loginClient.username)+" Forward: "+JSON.stringify(update["inputs"]["keys"]["forward"]));
        //this.players[loginClient.id].
        if(this.players[loginClient.id])
        {
            const forward = update["inputs"]["keys"]["forward"];
            const backward = update["inputs"]["keys"]["backward"];
            const left = update["inputs"]["keys"]["left"];
            const right = update["inputs"]["keys"]["right"];
            const space = update["inputs"]["keys"]["space"];
            const shift = update["inputs"]["keys"]["shift"];

            const runVelocity = 40;
            const backVelocity = runVelocity * (-2/3)
            const shiftBoost = 1.5;

            if(forward && !backward)
            {
                var velocityToSet = runVelocity;
                if(shift)
                {
                    velocityToSet *= shiftBoost;
                }
                this.players[loginClient.id].body.velocity.x = velocityToSet;
            }
            else if(!forward && backward)
            {
                this.players[loginClient.id].body.velocity.x = backVelocity;
            }
            if(space && this.players[loginClient.id].canJump)
            {
                this.players[loginClient.id].body.velocity.y = 55;
                this.players[loginClient.id].canJump = false;
            }
        }
    }

    OnDisconnect(loginClient)
    {
        console.log(`Player ${loginClient.username} disconnected.`);
        this.Leave(loginClient);
    }

    Leave(loginClient)
    {
        this.players[loginClient.id].despawn(this.world);
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