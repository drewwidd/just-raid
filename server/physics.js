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
        this.gravity = new CANNON.Vec3(0,-150,0);
        
        this.physicsMaterial = new CANNON.Material("groundMaterial");
        var groundMaterial = new CANNON.ContactMaterial(
            this.physicsMaterial,      // Material #1
            this.physicsMaterial,      // Material #2
            {
                friction:1.0,
                restitution: 0.0
            });
        this.addContactMaterial(groundMaterial);
    }
}

export class DisplayComponent
{
    constructor()
    {
        this.body = null;
    }
}