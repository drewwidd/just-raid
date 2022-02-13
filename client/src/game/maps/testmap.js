import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { DisplayComponent } from "../physics.js";

export class TestMap
{
    #components;
    constructor(scene,world,componentlist)
    {
        this.#components = [];
        this.name = "TEST_ROOM";

        this.initalize();
        this.add(scene,world,componentlist);
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
        const gridWidth = 100;
        const gridHeight = 100;

        //This adds a grid helper to this plane for development purposes
        const gridHelper = new DisplayComponent();
        const grid = new THREE.GridHelper(gridWidth,gridWidth/10); //Each grid box will be a 10x10 representation
        grid.rotation.set(0,0,0);
        gridHelper.display = grid;
        this.#components.push(gridHelper);

        const ground = new DisplayComponent();
        const groundGeometry = new THREE.PlaneGeometry(gridWidth,gridHeight);
        const groundMaterial = new THREE.MeshBasicMaterial(
            {
                color: 0x000000,
                side: THREE.DoubleSide,
                wireframe:true
            }
        );
        ground.display = new THREE.Mesh(groundGeometry,groundMaterial);
        ground.body = new CANNON.Body(
            {
                shape: new CANNON.Box(new CANNON.Vec3(gridWidth/2,gridHeight/2,0.0001)),
                type: CANNON.Body.STATIC
            }
        );
        ground.body.quaternion.setFromEuler(-Math.PI/2,0,0);    //Move the plane to the Z-axis
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
        const boxBody = new CANNON.Body(
            {
                shape: new CANNON.Box(new CANNON.Vec3(boxWidth/2,boxHeight/2,boxDepth/2)),
                type: CANNON.Body.STATIC,
                //mass: 10,
                position: new CANNON.Vec3(0,5,0)
            }
        )

        const boxComponent = new DisplayComponent();
        boxComponent.display = boxMesh;
        boxComponent.body = boxBody;
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
        const sphereBody = new CANNON.Body(
            {
                shape: new CANNON.Sphere(sphereRadius),
                mass: 10,
                position: new CANNON.Vec3(0,60,0)
            }
        )

        const sphereComponent = new DisplayComponent();
        sphereComponent.display = sphereMesh;
        sphereComponent.body = sphereBody;
        this.#components.push(sphereComponent);
    }
    getComponents()
    {
        return this.#components;
    }
    add(scene,world,componentlist)
    {
        const components = this.#components;
        for(let i=0; i<components.length; i++)
        {
            const component = components[i];
            component.add(scene,world);
            componentlist.push(component);
        }
    }
}