const switchThemeButton = document.getElementById("switchThemeButton") as HTMLInputElement;
const home = document.getElementById("home") as HTMLAnchorElement;
const showEmployees = document.getElementById("showEmployees") as HTMLAnchorElement;
const editEmployees = document.getElementById("editEmployees") as HTMLAnchorElement;
const username = document.getElementById("username") as HTMLHeadingElement;
const usertype = document.getElementById("usertype") as HTMLParagraphElement;
const poncharInput = document.getElementById("poncharInput") as HTMLInputElement;
const editPonche = document.getElementById("editPonche") as HTMLDivElement;
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

const checkIfCanEdit = async (username: string) => {
    let canEdit: boolean;
    await axios.get(`/auth/employees/edit/${username}`)
            .then((response) => {
                canEdit = true;
            })
            .catch((error) => {
                canEdit = false;
            });
    return canEdit;
};

const checkIfPonched = async () => {
    type Response = {
        success: boolean;
        in_date: string;
        out_date: string;
    };

    await axios.get<Response>(`/ponche/${username.textContent}`)
            .then((response) => {
                // TODO: Check if employee has ponched.
                poncharInput.disabled = true;
            })
            .catch((error) => {
                alert(error.response.data.message);
            });
};

const setEditPonche = async () => {
    const user = username.textContent;
    await axios.get(`/auth/ponche/edit/${user}`)
            .then((response) => {
                const col = document.createElement("div");
                const cardHolder = document.createElement("div");
                const a = document.createElement("a");
                const img = document.createElement("img");

                a.classList.add("btn");

                img.src = "/imgs/editPonche.svg";
                img.alt = "Edit Ponche";
                img.style.height = "256px";

                a.title = "Edit Ponche";
                a.href = "javascript:void(0)";
                a.addEventListener("click", async () => {
                    window.location.href = "/ponche/edit";
                });
                a.appendChild(img);

                cardHolder.classList.add("card");
                cardHolder.style.width = "18rem";
                cardHolder.appendChild(a);

                col.classList.add("col-3");
                col.classList.add("mx-auto");
                col.appendChild(cardHolder);

                editPonche.appendChild(col);
            })
            .catch((error) => {
            });
};

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

editEmployees.addEventListener("click", () => {
    if (!checkIfCanEdit(username.textContent)) {
        alert("You aren't authorized to perform this action!");
        return;
    }

    window.location.href = "/employees/edit";
});

poncharInput.addEventListener("click", async () => {
    await axios.post(`/ponche/in/${username.textContent}`)
            .then((response) => {
                poncharInput.disabled = true;
            })
            .catch((error) => {
                alert(error.response.data.message);
            });
});

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

usertype.textContent = localStorage.getItem("usertype") || "";
username.textContent = localStorage.getItem("username") || "";

setEditPonche();
