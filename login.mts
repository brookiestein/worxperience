const switchThemeButton: HTMLInputElement = document.getElementById("switchThemeButton") as HTMLInputElement;

const usernameInput: HTMLInputElement = document.getElementById("usernameInput") as HTMLInputElement;
const passwordInput: HTMLInputElement = document.getElementById("passwordInput") as HTMLInputElement;

const signinButton: HTMLButtonElement = document.getElementById("signinButton") as HTMLButtonElement;
const signupButton: HTMLButtonElement = document.getElementById("signupButton") as HTMLButtonElement;

const savedTheme: string = localStorage.getItem("theme") || "";
let timeout: ReturnType<typeof setTimeout>;

const loginForm: HTMLFormElement = document.getElementById("loginForm") as HTMLFormElement;
loginForm.addEventListener("submit", (e) => { e.preventDefault(); });

interface Response {
    success: boolean,
    message: string,
    token: string,
};

const switchTheme = () => {
    if (switchThemeButton.checked) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
        localStorage.setItem("theme", "light");
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

switchThemeButton.addEventListener("click", switchTheme);
signinButton.addEventListener("click", async () => {
    clearTimeout(timeout);
    if (usernameInput.value === "") {
        showMessage("Username is required.");
        return;
    }

    if (passwordInput.value === "") {
        showMessage("Password is required.");
        return;
    }

    const username = usernameInput.value;
    let token: string = "";
    let expiresOn: string = "";
    await axios.post<Response>("/auth/login", {
        "username": username,
        "password": passwordInput.value
    }).then((response) => {
        usernameInput.value = "";
        passwordInput.value = "";
        showMessage("Access Granted!");
        token = (response.data as Response).token || "";
    }).catch((error) => {
        showMessage(error.response.data.message);
    });

    /* Not authorized. */
    if (token === "") {
        return;
    }

    document.cookie = `access_token = ${token}`;
    localStorage.setItem("username", username);

    axios.get("/home")
        .then((response) => window.location.href = "/home")
        .catch((error) => window.location.href = "/");
});
