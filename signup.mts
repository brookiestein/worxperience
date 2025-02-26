const switchThemeButton: HTMLInputElement = document.getElementById("switchThemeButton") as HTMLInputElement;
const registerForm: HTMLFormElement = document.getElementById("registerForm") as HTMLFormElement;
const personalIdInput: HTMLInputElement = document.getElementById("personalIdInput") as HTMLInputElement;
const usernameInput: HTMLInputElement = document.getElementById("usernameInput") as HTMLInputElement;
const passwordInput: HTMLInputElement = document.getElementById("passwordInput") as HTMLInputElement;
const confirmPasswordInput: HTMLInputElement = document.getElementById("confirmPasswordInput") as HTMLInputElement;
const pricePerHourInput: HTMLInputElement = document.getElementById("pricePerHourInput") as HTMLInputElement;
const registerButton: HTMLButtonElement = document.getElementById("registerButton") as HTMLButtonElement;
const backButton: HTMLButtonElement = document.getElementById("backButton") as HTMLButtonElement;
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
        showMessage("Passwords match.");
    } else {
        showMessage("Passwords don't match.");
    }
};

const showMessage = (message: string) => {
    const container: HTMLDivElement = document.getElementById("statusMessage") as HTMLDivElement;

    while (container.firstChild) {
        container.removeChild(container.lastChild as ChildNode);
    }

    const close = () => {
        container.removeChild(p);
        container.removeChild(closeButton);
        container.classList.remove("show");
    };

    const p: HTMLParagraphElement = document.createElement("p");
    const closeButton: HTMLButtonElement = document.createElement("button");
    closeButton.addEventListener("click", close);

    container.classList.add("show");
    closeButton.classList.add("btn-close");

    p.textContent = message;

    container.appendChild(p);
    container.appendChild(closeButton);

    clearTimeout(timeout);
    timeout = setTimeout(close, 3000);
};

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

registerForm.addEventListener("submit", (e) => { e.preventDefault(); });
backButton.addEventListener("click", () => { history.back(); });
switchThemeButton.addEventListener("click", switchTheme);
passwordInput.addEventListener("input", checkPasswords);
confirmPasswordInput.addEventListener("input", checkPasswords);

registerButton.addEventListener("click", async () => {
    if (personalIdInput.value === "") {
        showMessage("Personal ID is required.");
        return;
    }

    if (usernameInput.value === "") {
        showMessage("Full name is required.");
        return;
    }

    if (passwordInput.value === "") {
        showMessage("Password is required.");
        return;
    }

    if (confirmPasswordInput.value === "") {
        showMessage("Password confirmation is required.");
        return;
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
        return;
    }

    if (pricePerHourInput.value === "") {
        showMessage("Price Per Hour is required.");
        return;
    } else if (isNaN(parseInt(pricePerHourInput.value))) {
        showMessage("Price Per Hour is invalid.");
        return;
    }

    axios.post("/user", {
        "personalId": personalIdInput.value,
        "username": usernameInput.value,
        "password": passwordInput.value,
        "pricePerHour": pricePerHourInput.value
    })
    .then((response) => {
        showMessage(`Employee ${usernameInput.value} successfully created!`);
        personalIdInput.value = "";
        usernameInput.value = "";
        passwordInput.value = "";
        confirmPasswordInput.value = "";
        pricePerHourInput.value = "";
    })
    .catch((error) => {
        if (error.response.data.message.includes("unique")) {
            showMessage("User already exists.");
        } else {
            showMessage("We're so sorry! Something bad happened on our behalf.");
        }
    });
});
