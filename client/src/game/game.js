import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { Renderer } from "./renderer.js";
import { World } from "./physics.js";
import { Scene } from "./scene.js";
import { Camera } from "./camera.js";
import { TestMap } from "./maps/testmap.js";
import { DisplayComponent } from "./physics.js";

let Development = true;

class BasicCharacterControllerProxy 
{
    constructor(animations) 
    {
        this.animations = animations;
    }
}

class BasicCharacterController
{
    constructor(params)
    {
        this.initalize(params);
    }
    initalize(params)
    {
        this.params = params;
        this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this.acceleration = new THREE.Vector3(1, 0.25, 100.0);
        this.velocity = new THREE.Vector3(0, 0, 0);
    
        this.animations = {};
        this.input = new BasicCharacterControllerInput();
        this.stateMachine = new CharacterFSM(
            new BasicCharacterControllerProxy(this.animations));
        this.CreatePhysicsBody();
        this.LoadModels();
    }
    CreatePhysicsBody()
    {
        const boxWidth = this.params.player.size.x;
        const boxHeight = this.params.player.size.y;
        const boxDepth = this.params.player.size.z;

        this.physicsBody = new CANNON.Body
        (
            {
                shape: new CANNON.Box(new CANNON.Vec3(boxWidth/2,boxHeight/2,boxDepth/2)),
                mass: 100,
                angularDamping:1,
                linearDamping:0.3
            }
        )
        this.physicsBody.position.copy(this.params.player.position);
        this.physicsBody.quaternion.copy(this.params.player.quaternion);
        
        //Create a 3D mesh for development so we can see the hit box
        if(Development)
        {
            const boxGeometry = new THREE.BoxGeometry(boxWidth,boxHeight,boxDepth);
            const boxMaterial = new THREE.MeshBasicMaterial(
                {
                    color: 0xFF0000,
                    wireframe: true
                }
            )
            this.physicsBodyMesh = new THREE.Mesh(boxGeometry,boxMaterial);
        }

        /*            
        const boxComponent = new DisplayComponent();
        boxComponent.display = boxMesh;
        boxComponent.body = boxBody;
        this.#components.push(boxComponent);

        this.players[player.id] = boxComponent;

        boxComponent.body.position.copy(player.position);
        boxComponent.body.quaternion.copy(player.quaternion);

        boxComponent.add(this.scene,this.world);
        */
    }
    LoadModels() 
    {
        const loader = new FBXLoader();
        loader.setPath("./resources/characters/zombie/");
        loader.load('mremireh_o_desbiens.fbx', (fbx) => 
        {
          fbx.scale.setScalar(0.1);
          fbx.traverse(c => {
            c.castShadow = true;
          });
    
          this.model = fbx;
          /* Group our model and our physicsBodyMesh and display it */
          this.model.position.set(0,-1 * this.params.player.size.y/2,0);  //physics body position is based on the center so we need to lower our model by half the height
          this.displayGroup = new THREE.Group();
          this.displayGroup.add(this.model);
          if(this.physicsBodyMesh!=null)
          {
            this.displayGroup.add(this.physicsBodyMesh);
          }

    
          this.mixer = new THREE.AnimationMixer(this.model);
    
          this.manager = new THREE.LoadingManager();
          this.manager.onLoad = () => 
          {
                this.stateMachine.SetState('idle');

                //Now add to the scene
                const newComponent = new DisplayComponent();
                newComponent.display = this.displayGroup;
                newComponent.body = this.physicsBody;
                newComponent.add(this.params.scene,this.params.world);
                this.params.components.push(newComponent);
          };
    
          const OnLoad = (animName, anim) => 
          {
            const clip = anim.animations[0];
            const action = this.mixer.clipAction(clip);
      
            this.animations[animName] = 
            {
                clip: clip,
                action: action,
            };
          };
    
          const loader = new FBXLoader(this.manager);
          loader.setPath('./resources/characters/zombie/');
          loader.load('walk.fbx', (a) => { OnLoad('walk', a); });
          loader.load('run.fbx', (a) => { OnLoad('run', a); });
          loader.load('idle.fbx', (a) => { OnLoad('idle', a); });
          loader.load('dance.fbx', (a) => { OnLoad('dance', a); });
        });
    }
    Update(timeInSeconds) 
    {
        if (!this.model) 
        {
          return;
        }
    
        this.stateMachine.Update(timeInSeconds, this.input);
    
        const velocity = this.velocity;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this.decceleration.x,
            velocity.y * this.decceleration.y,
            velocity.z * this.decceleration.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
            Math.abs(frameDecceleration.z), Math.abs(velocity.z));
    
        velocity.add(frameDecceleration);
    
        const controlObject = this.physicsBody;
        const Q = new THREE.Quaternion();
        const A = new THREE.Vector3();
        const R = controlObject.quaternion.clone();

        const tempR = new THREE.Quaternion(R.x,R.y,R.z,R.w);
    
        const acc = this.acceleration.clone();
        if (this.input.keys.shift) 
        {
            acc.multiplyScalar(2.0);
        }
                
        if (this.stateMachine.currentState && this.stateMachine.currentState.Name == 'dance') 
        {
            acc.multiplyScalar(0.0);
        }
    
        if (this.input.keys.forward) 
        {
            velocity.z += acc.z * timeInSeconds;
        }
        if (this.input.keys.backward) 
        {
            velocity.z -= (acc.z/2) * timeInSeconds;
        }
        if (this.input.keys.left) 
        {
            A.set(0, 1, 0);
            Q.setFromAxisAngle(A, 4.0 * Math.PI * timeInSeconds * this.acceleration.y);
            tempR.multiply(Q);
        }
        if (this.input.keys.right) 
        {
            A.set(0, 1, 0);
            Q.setFromAxisAngle(A, 4.0 * -Math.PI * timeInSeconds * this.acceleration.y);
            tempR.multiply(Q);
        }
    
        //controlObject.quaternion.copy(R);
        controlObject.quaternion.x = tempR.x;
        controlObject.quaternion.y = tempR.y;
        controlObject.quaternion.z = tempR.z;
        controlObject.quaternion.w = tempR.w;
    
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    
        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(controlObject.quaternion);
        sideways.normalize();
    
        sideways.multiplyScalar(velocity.x * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);

        controlObject.position.x += forward.x;
        controlObject.position.y += forward.y;
        controlObject.position.z += forward.z;
        
        controlObject.position.x += sideways.x;
        controlObject.position.y += sideways.y;
        controlObject.position.z += sideways.z;
    
        oldPosition.copy(controlObject.position);
        
        //Update Animations
        if (this.mixer) 
        {
            this.mixer.update(timeInSeconds);
        }
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
                this.keys.left = true;
                break;
            case 'S'.charCodeAt(0):     // s
                this.keys.backward = true;
                break;
            case 'D'.charCodeAt(0):     // d
                this.keys.right = true;
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
                this.keys.left = false;
                break;
            case 83: // s
                this.keys.backward = false;
                break;
            case 68: // d
                this.keys.right = false;
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
  
class FiniteStateMachine 
{
    constructor() 
    {
        this.states = {};
        this.currentState = null;
    }
  
    AddState(name, type) 
    {
        this.states[name] = type;
    }
  
    SetState(name) 
    {
        const prevState = this.currentState;
        
        if (prevState) 
        {
            if (prevState.Name == name) 
            {
                return;
            }
            prevState.Exit();
        }
    
        const state = new this.states[name](this);
    
        this.currentState = state;
        state.Enter(prevState);
    }
  
    Update(timeElapsed, input) 
    {
        if (this.currentState) 
        {
            this.currentState.Update(timeElapsed, input);
        }
    }
};

class CharacterFSM extends FiniteStateMachine 
{
    constructor(proxy)
    {
        super();
        this.proxy = proxy;
        this.initalize();
    }
  
    initalize()
    {
        this.AddState('idle', IdleState);
        this.AddState('walk', WalkState);
        this.AddState('run', RunState);
        this.AddState('dance', DanceState);
    }
};

class State
{
    constructor(parent) 
    {
        this.parent = parent;
    }
  
    Enter() {}
    Exit() {}
    Update() {}
};

class DanceState extends State 
{
    constructor(parent) 
    {
        super(parent);
    
        /*this.FinishedCallback = () => 
        {
            this.Finished();
        }*/
    }
  
    get Name() 
    {
        return 'dance';
    }
  
    Enter(prevState) 
    {
        const curAction = this.parent.proxy.animations['dance'].action;
        const mixer = curAction.getMixer();
        //mixer.addEventListener('finished', this.FinishedCallback);
    
        if (prevState) 
        {
            const prevAction = this.parent.proxy.animations[prevState.Name].action;
    
            curAction.reset();  
            //curAction.setLoop(THREE.LoopOnce, 1);
            curAction.clampWhenFinished = true;
            curAction.crossFadeFrom(prevAction, 0.2, true);
            curAction.play();
        } 
        else 
        {
            curAction.play();
        }
    }
  
    /*Finished() 
    {
        this.Cleanup();
        this.parent.SetState('idle');
    }
  
    Cleanup() 
    {
        const action = this.parent.proxy.animations['dance'].action;
        
        action.getMixer().removeEventListener('finished', this.CleanupCallback);
    }*/
  
    Exit() 
    {
        //this.Cleanup();
    }
  
    Update(timeElapsed,input)
    {
        if (input.keys.forward || input.keys.backward )
        {
            this.parent.SetState('idle');
        } 
    }
  };
  
class WalkState extends State 
{
    constructor(parent) 
    {
        super(parent);
    }

    get Name() 
    {
        return 'walk';
    }

    Enter(prevState) 
    {
        const curAction = this.parent.proxy.animations['walk'].action;
        if (prevState) 
        {
            const prevAction = this.parent.proxy.animations[prevState.Name].action;

            curAction.enabled = true;

            if (prevState.Name == 'run') 
            {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration;
                curAction.time = prevAction.time * ratio;
            } 
            else 
            {
                curAction.time = 0.0;
                curAction.setEffectiveTimeScale(1.0);
                curAction.setEffectiveWeight(1.0);
            }

            curAction.crossFadeFrom(prevAction, 0.5, true);
            curAction.play();
        } 
        else 
        {
            curAction.play();
        }
    }

    Exit() 
    {
    }

    Update(timeElapsed, input) 
    {
        if (input.keys.forward || input.keys.backward) 
        {
            if (input.keys.shift) 
            {
                this.parent.SetState('run');
            }
            return;
        }
        this.parent.SetState('idle');
    }
};
  
class RunState extends State 
{
    constructor(parent) 
    {
        super(parent);
    }

    get Name() 
    {
        return 'run';
    }

    Enter(prevState) 
    {
        const curAction = this.parent.proxy.animations['run'].action;
        if (prevState) 
        {
            const prevAction = this.parent.proxy.animations[prevState.Name].action;

            curAction.enabled = true;

            if (prevState.Name == 'walk') 
            {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration;
                curAction.time = prevAction.time * ratio;
            } 
            else 
            {
                curAction.time = 0.0;
                curAction.setEffectiveTimeScale(1.0);
                curAction.setEffectiveWeight(1.0);
            }

            curAction.crossFadeFrom(prevAction, 0.5, true);
            curAction.play();
        } 
        else 
        {
            curAction.play();
        }
    }

    Exit() 
    {
    }

    Update(timeElapsed, input)
     {
        if (input.keys.forward || input.keys.backward) 
        {
            if (!input.keys.shift) 
            {
                this.parent.SetState('walk');
            }
            return;
        }

        this.parent.SetState('idle');
    }
};
  
class IdleState extends State 
{
    constructor(parent) 
    {
        super(parent);
    }

    get Name() 
    {
        return 'idle';
    }

    Enter(prevState) 
    {
        const idleAction = this.parent.proxy.animations['idle'].action;
        if (prevState) 
        {
            const prevAction = this.parent.proxy.animations[prevState.Name].action;
            idleAction.time = 0.0;
            idleAction.enabled = true;
            idleAction.setEffectiveTimeScale(1.0);
            idleAction.setEffectiveWeight(1.0);
            idleAction.crossFadeFrom(prevAction, 0.5, true);
            idleAction.play();
        }
        else 
        {
            idleAction.play();
        }
    }

    Exit() 
    {
    }

    Update(_, input) 
    {
        if (input.keys.forward || input.keys.backward) 
        {
            this.parent.SetState('walk');
        } 
        else if (input.keys.space) 
        {
            this.parent.SetState('dance');
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
        this.initalize();
    }
    onUpdate(gameState)
    {
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
                            const testMap = new TestMap(this.scene,this.world,this.#components);
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
                    if(this.controls==undefined)
                    {
                        //Create our player controller
                        this.controls = new BasicCharacterController({camera:this.camera, scene:this.scene, player:player,world:this.world,components:this.#components});

                        /*const boxWidth = player.size.x;
                        const boxHeight = player.size.y;
                        const boxDepth = player.size.z;
                        const boxGeometry = new THREE.BoxGeometry(boxWidth,boxHeight,boxDepth);
                        const boxMaterial = new THREE.MeshBasicMaterial(
                            {
                                color: 0xFF0000,
                                wireframe: true
                            }
                        )
                        const boxMesh = new THREE.Mesh(boxGeometry,boxMaterial);
                        const boxBody = new CANNON.Body(
                            {
                                shape: new CANNON.Box(new CANNON.Vec3(boxWidth/2,boxHeight/2,boxDepth/2)),
                                mass: 10,
                                angularDamping:1,
                                linearDamping:0.3
                            }
                        )*/
                        //setInterval(() => this.updateServer(),1000/30);
                    }
                    //Update based on the values sent from the server
                    /*const interpolatedPosition = new CANNON.Vec3
                    (
                        (this.players[player.id].body.position.x + player.position.x)/2,
                        (this.players[player.id].body.position.y + player.position.y)/2,
                        (this.players[player.id].body.position.z + player.position.z)/2,
                    )
                    const interpolatedQuaternion = new CANNON.Quaternion
                    (
                        (this.players[player.id].body.quaternion.x + player.quaternion.x)/2,
                        (this.players[player.id].body.quaternion.y + player.quaternion.y)/2,
                        (this.players[player.id].body.quaternion.z + player.quaternion.z)/2,
                        (this.players[player.id].body.quaternion.w + player.quaternion.w)/2,
                    )*/
                    //this.players[player.id].body.position.copy(interpolatedPosition);
                    //this.players[player.id].body.quaternion.copy(interpolatedQuaternion);
                }
            }
        }
    }
    initalize()
    {
        this.world = new World();
        this.renderer = new Renderer(this.gameCanvas);
        this.scene = new Scene();
        this.camera = new Camera();
        this.orbitControls = new OrbitControls(this.camera,this.renderer.domElement);
        this.orbitControls.enablePan = false;

        this.renderer.setAnimationLoop((t) => this.animate(t));

        this.pressedKeys = {};
    }
    updateServer()
    {
        /*
        const inputData = 
        {
            inputForward: this.pressedKeys['W'.charCodeAt(0)],
            inputBackward: this.pressedKeys['S'.charCodeAt(0)], 
            inputStrafeLeft: this.pressedKeys['Q'.charCodeAt(0)],
            inputStrafeRight: this.pressedKeys['E'.charCodeAt(0)],
            inputRotateLeft: this.pressedKeys['A'.charCodeAt(0)],
            inputRotateRight: this.pressedKeys['D'.charCodeAt(0)],
            inputJump: this.pressedKeys[' '.charCodeAt(0)]
        }
        this.socket.emit("user-update",inputData);*/
    }
    animate(t)
    {
        if(this.previousRAF===null)
        {
            this.previousRAF = t;
        }

        const timeBetweenFrames = t - this.previousRAF;

        //Update the objects using physics
        this.world.step(timeBetweenFrames/1000);

        for(let i=0; i<this.#components.length; i++)
        {
            const component = this.#components[i];
            if(component.display!=null && component.body!=null) //GridHelper and maybe others don't have a body so we don't necessarily do this with EVERYTHING
            {
                component.display.position.copy(component.body.position);
                component.display.quaternion.copy(component.body.quaternion);
            }
        }

        //Render the objects
        this.renderer.render(this.scene,this.camera);

        //Update animation states
        this.updateAnimations(timeBetweenFrames);

        //Save the last RAF so we know how much to simulate next time
        this.previousRAF = t;
    }

    updateAnimations(timeBetweenFrames)
    {
        const timeElapsedS = timeBetweenFrames * 0.001;
        if (this.mixers) 
        {
            this.mixers.map(m => m.update(timeElapsedS));
        }
    
        if (this.controls) 
        {
            this.controls.Update(timeElapsedS);
        }
    }
}