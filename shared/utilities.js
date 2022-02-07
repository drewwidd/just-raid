export function IsAllLetters(inputtxt)
{
    const letters = /^[A-Za-z]+$/;
    if(inputtxt.match(letters))
    {
        return true;
    }
    else
    {
        return false;
    }
}
export function GetObjectLength(obj)
{
    return Object.keys(obj).length
}