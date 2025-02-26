const switchThemeButton: HTMLInputElement = document.getElementById("switchThemeButton") as HTMLInputElement;
const usernameInput: HTMLInputElement = document.getElementById("usernameInput") as HTMLInputElement;
const passwordInput: HTMLInputElement = document.getElementById("passwordInput") as HTMLInputElement;
const signinButton: HTMLButtonElement = document.getElementById("signinButton") as HTMLButtonElement;
const signupButton: HTMLButtonElement = document.getElementById("signupButton") as HTMLButtonElement;
const statusMessage: HTMLParagraphElement = document.getElementById("statusMessage") as HTMLParagraphElement;
const savedTheme: string = localStorage.getItem("theme") || "";

const switchTheme = () => {
    if (switchThemeButton.checked) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
        localStorage.setItem("theme", "light");
    }
};

if (savedTheme === "dark") {
    switchThemeButton.checked = true;
    switchTheme();
}

switchThemeButton.addEventListener("click", switchTheme);
signinButton.addEventListener("click", () => {
    if (usernameInput.value === "") {
        statusMessage.textContent = "Username is required.";
        setTimeout(() => {statusMessage.textContent = ""}, 3000);
        return;
    }

    if (passwordInput.value === "") {
        statusMessage.textContent = "Password is required.";
        setTimeout(() => {statusMessage.textContent = ""}, 3000);
        return;
    }
});
