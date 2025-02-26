const switchThemeButton: HTMLInputElement = document.getElementById("switchThemeButton") as HTMLInputElement;
const registerForm: HTMLFormElement = document.getElementById("registerForm") as HTMLFormElement;
const usernameInput: HTMLInputElement = document.getElementById("usernameInput") as HTMLInputElement;
const passwordInput: HTMLInputElement = document.getElementById("passwordInput") as HTMLInputElement;
const confirmPasswordInput: HTMLInputElement = document.getElementById("confirmPasswordInput") as HTMLInputElement;
const registerButton: HTMLButtonElement = document.getElementById("registerButton") as HTMLButtonElement;
const statusMessage: HTMLParagraphElement = document.getElementById("statusMessage") as HTMLParagraphElement;
const savedTheme: string = localStorage.getItem("theme") || "";
let timeout: ReturnType<typeof setTimeout>;

const switchTheme = () => {
    if (switchThemeButton.checked) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
        localStorage.setItem("theme", "light");
    }
};

const checkPasswords = () => {
    if (passwordInput.value === confirmPasswordInput.value) {
        statusMessage.textContent = "Passwords match.";
        statusMessage.style.color = document.documentElement.getAttribute("data-bs-theme") === "dark"
            ? "lightgreen"
            : "green";
    } else {
        statusMessage.textContent = "Passwords don't match.";
        statusMessage.style.color = "red";
    }
};

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

registerForm.addEventListener("submit", (e) => { e.preventDefault(); });

switchThemeButton.addEventListener("click", switchTheme);

passwordInput.addEventListener("input", checkPasswords);
confirmPasswordInput.addEventListener("input", checkPasswords);
registerButton.addEventListener("click", async () => {
    clearTimeout(timeout);
    if (usernameInput.value === "") {
        statusMessage.textContent = "Username is required.";
        statusMessage.style.color = "red";
        timeout = setTimeout(() => { statusMessage.textContent = ""; }, 3000);
        return;
    }

    if (passwordInput.value === "") {
        statusMessage.textContent = "Password is required.";
        statusMessage.style.color = "red";
        timeout = setTimeout(() => { statusMessage.textContent = ""; }, 3000);
        return;
    }

    if (confirmPasswordInput.value === "") {
        statusMessage.textContent = "Password confirmation is required.";
        statusMessage.style.color = "red";
        timeout = setTimeout(() => { statusMessage.textContent = ""; }, 3000);
        return;
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
        return;
    }

    axios.post("/user", {
        "username": usernameInput.value,
        "password": passwordInput.value
    })
    .then((response) => {
        usernameInput.value = "";
        passwordInput.value = "";
        confirmPasswordInput.value = "";
    })
    .catch((error) => {

    });
});
