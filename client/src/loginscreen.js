import * as cs from "./clientscreen.js";

class LoginAuthenticationBox extends cs.ClientScreen
{
    constructor(onLoginButtonClick)
    {
        super();
        this.container = document.getElementById("login-authentication-box");
        this.accountNameInput = document.getElementById("login-accountNameInput");
        this.loginButton = document.getElementById("login-button");
        this.onLoginButtonClick = onLoginButtonClick;
    }
    getInput()
    {
        return this.accountNameInput.value;
    }
    show()
    {
        this.loginButton.onclick = this.onLoginButtonClick;
        this.container.style.opacity = 1;
        this.container.style.visibility = "visible";
    }
    hide()
    {
        this.loginButton.onclick = null;
        this.container.style.visibility = "hidden";
    }
    fadeout()
    {
        this.loginButton.onclick = null;
        this.container.style.opacity = 0.2;
    }
    clearInput()
    {
        this.accountNameInput.value = "";
    }
}

class LoginErrorBox extends cs.ClientScreen
{
    constructor(onButtonClick)
    {
        super();
        this.container = document.getElementById("login-error-box");
        this.text = document.getElementById("login-error-text");
        this.button = document.getElementById("login-error-button");
        this.button.onclick = () => onButtonClick();
    }
    showError(error,onButtonClick)
    {
        this.text.innerHTML = error;
        this.show();
    }
    show()
    {
        this.container.style.visibility = 'visible';
    }
    hide()
    {
        this.container.style.visibility = 'hidden';
    }
}
export class LoginScreen extends cs.ClientScreen
{
    constructor(onLoginButtonClick)
    {
        super();
        this.loginScreenMusic = new Audio("./resources/audio/login_music.mp3");
        this.container = document.getElementById("login-ui");
        this.container.onclick = () => this.startAudio();
        this.authenticationBox = new LoginAuthenticationBox(onLoginButtonClick);
        this.errorBox = new LoginErrorBox(
            () => this.onErrorButtonClick());
    }
    onErrorButtonClick()
    {
        this.errorBox.hide();
        this.authenticationBox.show();
    }
    showLoginError(error)
    {
        this.errorBox.showError(error);
        this.authenticationBox.fadeout();
    }
    startAudio()
    {
        if(this.loginScreenMusic && this.loginScreenMusic.paused)
        {
            this.loginScreenMusic.volume = 0.5;
            this.loginScreenMusic.loop = true;
            this.loginScreenMusic.play();
        }
    }

    stopAudio()
    {
        this.loginScreenMusic.pause();
    }

    show()
    {
        this.errorBox.hide();
        this.authenticationBox.clearInput();
        this.authenticationBox.show();
        this.container.style.visibility = 'visible';
    }

    hide()
    {
        this.container.style.visibility = 'hidden';
    }
}