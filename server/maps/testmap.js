import CANNON from "cannon";
import { DisplayComponent } from "./../physics.js";

export class TestMap
{
    #components;
    constructor(world)
    {
        this.#components = [];
        this.name = "TEST_ROOM";
        this.initalize();
        this.add(world);
    }
    initalize()
    {
        this.addGround();
        this.addBox();
        //this.addSphere();
    }
    addGround()
    {
        const gridWidth = 100;
        const gridHeight = 100;

        const ground = new DisplayComponent();
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
        const boxBody = new CANNON.Body(
            {
                shape: new CANNON.Box(new CANNON.Vec3(boxWidth/2,boxHeight/2,boxDepth/2)),
                type: CANNON.Body.STATIC,
                //mass: 10,
                position: new CANNON.Vec3(0,5,0)
            }
        )

        const boxComponent = new DisplayComponent();
        boxComponent.body = boxBody;
        this.#components.push(boxComponent);
    }
    addSphere()
    {
        const sphereRadius = 5;
        const sphereBody = new CANNON.Body(
            {
                shape: new CANNON.Sphere(sphereRadius),
                mass: 10,
                position: new CANNON.Vec3(0,60,0)
            }
        )

        const sphereComponent = new DisplayComponent();
        sphereComponent.body = sphereBody;
        this.#components.push(sphereComponent);
    }
    getComponents()
    {
        return this.#components;
    }
    add(world)
    {
        const components = this.#components;
        for(let i=0; i<components.length; i++)
        {
            const component = components[i];
            if(component.body!=null)
            {
                world.addBody(components[i].body);
            }
        }
    }
}