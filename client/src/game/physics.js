export class DisplayComponent
{
    constructor()
    {
        this.display = null;
        this.body = null;
    }

    add(scene)
    {
        if(this.display!=null)
        {
            scene.add(this.display);
        }
    }
}