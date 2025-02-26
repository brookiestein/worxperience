const switchThemeButton: HTMLInputElement = document.getElementById("switchThemeButton") as HTMLInputElement;

const usernameInput: HTMLInputElement = document.getElementById("usernameInput") as HTMLInputElement;
const passwordInput: HTMLInputElement = document.getElementById("passwordInput") as HTMLInputElement;

const signinButton: HTMLButtonElement = document.getElementById("signinButton") as HTMLButtonElement;
const signupButton: HTMLButtonElement = document.getElementById("signupButton") as HTMLButtonElement;

const statusMessage: HTMLParagraphElement = document.getElementById("statusMessage") as HTMLParagraphElement;
const savedTheme: string = localStorage.getItem("theme") || "";
let timeout: ReturnType<typeof setTimeout>;

const loginForm: HTMLFormElement = document.getElementById("loginForm") as HTMLFormElement;
loginForm.addEventListener("submit", (e) => { e.preventDefault(); });

const switchTheme = () => {
    if (switchThemeButton.checked) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
        localStorage.setItem("theme", "light");
    }
};

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

switchThemeButton.addEventListener("click", switchTheme);
signinButton.addEventListener("click", async () => {
    clearTimeout(timeout);
    if (usernameInput.value === "") {
        statusMessage.textContent = "Username is required.";
        timeout = setTimeout(() => {statusMessage.textContent = ""}, 3000);
        return;
    }

    if (passwordInput.value === "") {
        statusMessage.textContent = "Password is required.";
        timeout = setTimeout(() => {statusMessage.textContent = ""}, 3000);
        return;
    }

    await axios.post("/login", {
        "username": usernameInput.value,
        "password": passwordInput.value
    })
    .then((response) => {
        usernameInput.value = "";
        passwordInput.value = "";
    })
    .catch((error) => {
        statusMessage.textContent = "We're so sorry, something wrong happened on out behalf.";
    });
});

signupButton.addEventListener("click", async () => {
    window.location.href = "signup.html";
});
