const switchThemeButton = document.getElementById("switchThemeButton") as HTMLInputElement;
const home = document.getElementById("home") as HTMLAnchorElement;
const showEmployees = document.getElementById("showEmployees") as HTMLAnchorElement;
const ponche = document.getElementById("ponche") as HTMLAnchorElement;
const username = document.getElementById("username") as HTMLHeadingElement;
const usertype = document.getElementById("usertype") as HTMLParagraphElement;
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

const setUserData = () => {
    let userToEdit: string = "";
    document.cookie.split(';').find((cookie) => {
        let name = cookie.substring(0, cookie.indexOf('='));
        if (name === "userToEdit") {
            userToEdit = cookie.substring(cookie.indexOf('=') + 1, cookie.length);
            return;
        }
    });

    if (userToEdit === "") {
        return;
    }

    alert(`User to edit is: ${userToEdit}.`);
}

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

usertype.textContent = localStorage.getItem("usertype") || "";
username.textContent = localStorage.getItem("username") || "";

switchThemeButton.addEventListener("click", switchTheme);

home.addEventListener("click", () => {
    window.location.href = "/home";
});

showEmployees.addEventListener("click", async () => {
    await axios.get("/auth/employees/view", {headers: {username: username.textContent}})
            .then((response) => {
                window.location.href = "/employees";
            })
            .catch((error) => {
                alert("You aren't authorized to perform this action!");
            });
});

ponche.addEventListener("click", async () => {

});
