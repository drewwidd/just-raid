// Abstract ClientScreen Class

export class ClientScreen
{
    constructor()
    {
        if(this.constructor == "ClientScreen")
        {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    show()
    {
        throw new Error("Method show() must be implemented by the derived class.")
    }

    hide()
    {
        throw new Error("Method show() must be implemented by the derived class.")
    }
}