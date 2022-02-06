export function IsAllLetters(inputtxt)
{
    var letters = /^[A-Za-z]+$/;
    if(inputtxt.match(letters))
    {
        return true;
    }
    else
    {
        return false;
    }
}
export function GetMapLength(map)
{
    return Object.keys(map).length
}