export class World extends CANNON.World
{
    constructor()
    {
        super();

        this.initalize();
    }

    initalize()
    {
        this.gravity = new CANNON.Vec3(0,-9.81*5,0);
    }
}

export class DisplayComponent
{
    constructor()
    {
        this.display = null;
        this.body = null;
    }

    add(scene,world)
    {
        if(this.display!=null)
        {
            scene.add(this.display);
        }
        if(this.body!=null)
        {
            world.addBody(this.body);
        }
    }
}