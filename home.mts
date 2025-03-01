const switchThemeButton: HTMLInputElement = document.getElementById("switchThemeButton") as HTMLInputElement;
const username: HTMLHeadingElement = document.getElementById("username") as HTMLHeadingElement;
const toggleSidebarBtn: HTMLButtonElement = document.getElementById("toggleSidebarBtn") as HTMLButtonElement;
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

username.textContent = localStorage.getItem("username") || "";

switchThemeButton.addEventListener("click", switchTheme);
