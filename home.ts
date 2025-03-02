const switchThemeButton = document.getElementById("switchThemeButton") as HTMLInputElement;
const showEmployees = document.getElementById("showEmployees") as HTMLAnchorElement;
const editEmployees = document.getElementById("editEmployees") as HTMLAnchorElement;
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

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

username.textContent = localStorage.getItem("username") || "";
usertype.textContent = localStorage.getItem("usertype") || "";

switchThemeButton.addEventListener("click", switchTheme);

showEmployees.addEventListener("click", async () => {
    await axios.get("/auth/employees/view", { headers: {username: username.textContent} })
            .then((response) => {
                window.location.href = "/employees";
            })
            .catch((error) => {
                alert("You aren't authorized to perform this action!");
            });
});

editEmployees.addEventListener("click", async () => {
    await axios.get(`/auth/employees/edit/${username.textContent}`)
            .then((response) => {
                window.location.href = "/employees/edit";
            })
            .catch((error) => {
                alert("You aren't authorized to perform this action!");
            });
});

ponche.addEventListener("click", async () => {
    await axios.get("/ponche")
            .then((response) => {
                window.location.href = "/ponche";
            })
            .catch((error) => {
                alert(error.response.data.message);
            });
});
