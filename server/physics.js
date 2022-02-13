import CANNON from "cannon";

export class World extends CANNON.World
{
    constructor()
    {
        super();

        this.initalize();
    }

    initalize()
    {
        this.gravity = new CANNON.Vec3(0,-9.81,0);
    }
}

export class DisplayComponent
{
    constructor()
    {
        this.body = null;
    }
}