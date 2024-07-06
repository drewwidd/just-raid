import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { Renderer } from "./renderer.js";
import { Scene } from "./scene.js";
import { Camera, ThirdPartyCamera } from "./camera.js";
import { TestMap } from "./maps/testmap.js";
import { DisplayComponent } from "./physics.js";

let Development = true;

class BasicCharacterController
{
    constructor(params)
    {
        this.initalize(params);
    }
    initalize(params)
    {
        this.params = params;
        this.input = new BasicCharacterControllerInput();
    }
}

class BasicCharacterControllerInput 
{
    constructor() 
    {
      this.initalize();    
    }
  
    initalize() 
    {
        this.keys = 
        {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false,
            shift: false,
        };
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    }
  
    onKeyDown(event) 
    {
        switch (event.keyCode) 
        {
            case 'W'.charCodeAt(0):     // w
                this.keys.forward = true;
                break;
            case 'A'.charCodeAt(0):     // a
                this.keys.rotateleft = true;
                break;
            case 'S'.charCodeAt(0):     // s
                this.keys.backward = true;
                break;
            case 'D'.charCodeAt(0):     // d
                this.keys.rotateright = true;
                break;
            case 'Q'.charCodeAt(0):     // q
                this.keys.strafeleft = true;
                break;
            case 'E'.charCodeAt(0):     // e
                this.keys.straferight = true;
                break;
            case 32: // SPACE
                this.keys.space = true;
                break;
            case 16: // SHIFT
                this.keys.shift = true;
                break;
        }
    }
  
    onKeyUp(event) 
    {
        switch(event.keyCode)
        {
            case 87: // w
                this.keys.forward = false;
                break;
            case 65: // a
                this.keys.rotateleft = false;
                break;
            case 83: // s
                this.keys.backward = false;
                break;
            case 68: // d
                this.keys.rotateright = false;
                break;
            case 81: // q
                this.keys.strafeleft = false;
                break;
            case 69: // e
                this.keys.straferight = false;
                break;
            case 32: // SPACE
                this.keys.space = false;
                break;
            case 16: // SHIFT
                this.keys.shift = false;
                break;
        }
    }
};

export class Game
{
    #components;
    constructor(gameCanvas,socket,myID)
    {
        this.gameCanvas = gameCanvas;
        this.socket = socket;
        this.#components = [];
        this.drawnRooms = {};
        this.players = {};
        this.myID = myID;
        this.loadTextures();
        this.initalize();
        console.log("Initalizing game complete.");
    }
    onUpdate(gameState)
    {
        console.log("Received game update: "+JSON.stringify(gameState.players))
        //Let's iterate through the rooms and see if we need to draw anything
        if(gameState.rooms!=null)
        {
            for(let i=0; i<gameState.rooms.length; i++)
            {
                const mapName = gameState.rooms[i];
                if(this.drawnRooms[mapName]===undefined)
                {
                    switch(mapName)
                    {
                        case "TEST_ROOM":
                            console.log(`Adding room: ${gameState.rooms[i]}`);
                            const testMap = new TestMap(this,this.scene,this.#components);
                            this.drawnRooms[testMap.name] = testMap;
                            break;
                    }
                }
            }
        }
        if(gameState.players!=null)
        {
            for (const [id, player] of Object.entries(gameState.players))
            {
                if(player.id==this.myID)    //ignore other players for now
                {
                    if(this.playerController==undefined)
                    {
                        //Create our player controller
                        this.playerController = new BasicCharacterController({camera:this.camera, scene:this.scene, player:player,world:this.world,components:this.#components});

                        //this.camera.lookAt(this.playerController.body.position);
                        setInterval(() => this.updateServer(),1000/30);
                    }
                    //Actually draw our player if we haven't already
                    if(!this.players[id])
                    {
                        this.players[id] = new THREE.Mesh
                        (
                            this.playerGeometry,
                            this.mageMaterial
                        );
                        this.players[id].name = player.name;
                        this.players[id].position.set
                        (
                                player.position.x,
                                player.position.y,
                                player.position.z,
                        );
                        this.scene.add(this.players[id]);

                        this.thirdPartyCamera = new ThirdPartyCamera(
                            {
                                camera: this.camera,
                                target: this.players[this.myID]
                            }
                        );
                    }
                    else    //We've been added already so just move us
                    {
                        this.players[id].position.copy(player.position);
                        /*this.players[id].position.x = ((player.position.x+this.players[id].position.x)/2);
                        this.players[id].position.y = ((player.position.y+this.players[id].position.y)/2);
                        this.players[id].position.z = ((player.position.z+this.players[id].position.z)/2);*/
                    }
                }
            }
        }
    }
    loadTextures()
    {
        this.skybox = new THREE.TextureLoader().load('resources/textures/TestMap_Skybox.png');
        this.groundTexture = new THREE.TextureLoader().load('resources/textures/TestMap_Ground.png');
        this.groundTexture.wrapS = THREE.RepeatWrapping;
        this.groundTexture.wrapT = THREE.RepeatWrapping;
        this.groundTexture.repeat.set(20,20);
        this.wallTexture = new THREE.TextureLoader().load('resources/textures/TestMap_Wall.jpg'); 
        this.wallTexture.wrapS = THREE.RepeatWrapping;
        this.wallTexture.wrapT = THREE.RepeatWrapping;
        this.wallTexture.repeat.set(3,3);
    }
    initalize()
    {
        this.renderer = new Renderer(this.gameCanvas);
        this.scene = new Scene();
        this.camera = new Camera();

        //Add Skybox
        this.scene.background = this.skybox;

        this.orbitControls = new OrbitControls(this.camera,this.renderer.domElement);
        this.orbitControls.enablePan = false;
        this.orbitControls.minDistance = 50;
        this.orbitControls.maxDistance = 300;

        //Load Player Geometry
        const playerWidth = 10;
        const playerHeight = 20;
        const playerDepth = 10;
        this.playerGeometry = new THREE.BoxGeometry(playerWidth,playerHeight,playerDepth);

        //Load Class Materials
        this.mageMaterial = new THREE.MeshBasicMaterial(
            {
                color: 0x3FC7EB,
                wireframe: true
            }
        )

        this.renderer.setAnimationLoop((t) => this.animate(t));

        this.pressedKeys = {};
    }
    updateServer()
    {
        if(this.playerController)
        {
            const update = 
            {
                t: Date.now(),
                inputs: this.playerController.input,
                quaternion: this.players[this.myID].quaternion
            };
            //console.log("Sending server user-update: "+JSON.stringify(update));
            this.socket.emit("user-update",update);
        }
    }
    animate(t)
    {
        if(this.previousRAF===null)
        {
            this.previousRAF = t;
        }

        const timeBetweenFrames = t - this.previousRAF;

        
        if(this.playerController!=null)
        {
            if(this.playerController.input.keys.rotateleft && !this.playerController.input.keys.rotateright)
            {
                this.players[this.myID].rotateY(0.003*timeBetweenFrames);
            }
            else if(this.playerController.input.keys.rotateright && !this.playerController.input.keys.rotateleft)
            {
                this.players[this.myID].rotateY(-0.003*timeBetweenFrames);
            }
        }

        //Client Side Prediction
        /*if(this.playerController!=null)
        {
            if(this.playerController.input.keys.forward)
            {
                this.players[this.myID].position.x+=0.5;
            }
        }*/

        //Update Camera
        if(this.thirdPartyCamera!=null)
        {
            this.thirdPartyCamera.Update(timeBetweenFrames);
        }

        //Render the objects
        this.renderer.render(this.scene,this.camera);

        //Save the last RAF so we know how much to simulate next time
        this.previousRAF = t;
    }
}