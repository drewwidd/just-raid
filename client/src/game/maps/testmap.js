import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { DisplayComponent } from "../physics.js";

export class TestMap
{
    #components;
    constructor(game,scene,componentlist)
    {
        this.game = game;
        this.#components = [];
        this.name = "TEST_ROOM";

        this.initalize();
        this.add(scene,componentlist);
    }
    initalize()
    {
        this.addGround();
        this.addBox();
        this.addLight();
        //this.addSphere();
    }
    addLight()
    {
        const pointLight = new THREE.PointLight(0xFFFFFF,1,5000);
        pointLight.position.set(10,0,25);
        const light = new DisplayComponent();
        light.display = pointLight;
        this.#components.push(light);
    }
    addGround()
    {
        const gridWidth = 300;
        const gridHeight = 300;

        //This adds a grid helper to this plane for development purposes
        const gridHelper = new DisplayComponent();
        const grid = new THREE.GridHelper(gridWidth,gridWidth/10); //Each grid box will be a 10x10 representation
        grid.rotation.set(0,0,0);
        gridHelper.display = grid;
        //this.#components.push(gridHelper);

        const ground = new DisplayComponent();
        const groundGeometry = new THREE.PlaneGeometry(gridWidth,gridHeight);
        const groundMaterial = new THREE.MeshBasicMaterial(
            {
                color: 0xFFFFFF,
                side: THREE.DoubleSide,
                wireframe:false,
                //map: this.game.groundTexture
            }
        );
        ground.display = new THREE.Mesh(groundGeometry,groundMaterial);
        ground.display.rotation.x = -0.5 * Math.PI;
        this.#components.push(ground);
    }
    addBox()
    {
        const boxWidth = 10;
        const boxHeight = 10;
        const boxDepth = 10;
        const boxGeometry = new THREE.BoxGeometry(boxWidth,boxHeight,boxDepth);
        const boxMaterial = new THREE.MeshBasicMaterial(
            {
                color: 0x0000FF,
                wireframe: true
            }
        )
        const boxMesh = new THREE.Mesh(boxGeometry,boxMaterial);
        boxMesh.position.y = 30;
        const boxComponent = new DisplayComponent();
        boxComponent.display = boxMesh;
        this.#components.push(boxComponent);
    }
    addSphere()
    {
        const sphereRadius = 5;
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius);
        const sphereMaterial = new THREE.MeshBasicMaterial(
            {
                color: 0x00FF00,
                wireframe: true
            }
        )
        const sphereMesh = new THREE.Mesh(sphereGeometry,sphereMaterial);
        const sphereComponent = new DisplayComponent();
        sphereComponent.display = sphereMesh;
        this.#components.push(sphereComponent);
    }
    getComponents()
    {
        return this.#components;
    }
    add(scene,componentlist)
    {
        const components = this.#components;
        for(let i=0; i<components.length; i++)
        {
            const component = components[i];
            component.add(scene);
            componentlist.push(component);
        }
    }
}