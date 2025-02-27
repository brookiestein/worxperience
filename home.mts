const switchThemeButton: HTMLInputElement = document.getElementById("switchThemeButton") as HTMLInputElement;
const showEmployeesButton: HTMLButtonElement = document.getElementById("showEmployeesButton") as HTMLButtonElement;
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

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

switchThemeButton.addEventListener("click", switchTheme);

showEmployeesButton.addEventListener("click", () => {
    axios.get("/employees")
        .then((response) => window.location.href = "/employees")
        .catch((error) => window.location.href = "/");
});
