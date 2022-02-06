function allLetter(inputtxt)
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

module.exports = {allLetter};