const switchThemeButton = document.getElementById("switchThemeButton") as HTMLInputElement;
const home = document.getElementById("home") as HTMLAnchorElement;
const editEmployees = document.getElementById("editEmployees") as HTMLAnchorElement;
const ponche = document.getElementById("ponche") as HTMLAnchorElement;
const tableBody = document.getElementById("table-body") as HTMLTableElement;
const username = document.getElementById("username") as HTMLHeadingElement;
const usertype = document.getElementById("usertype") as HTMLParagraphElement;
const savedTheme: string = localStorage.getItem("theme") || "";

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

usertype.textContent = localStorage.getItem("usertype") || "";
username.textContent = localStorage.getItem("username") || "";
const canEdit = checkIfCanEdit(username.textContent);

type Employee = {
    first_name: string;
    last_name: string;
    username: string;
    charge: string;
    personalId: string,
    salary: string,
    permissions: string;
    bypass: boolean;
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

const getEmployees = async () => {
    await axios.get<Employee[]>("/employees/all")
            .then((response) => {
                setEmployees(response.data);
            })
            .catch((error) => {
                alert(error);
            });
};

const setEmployees = (employees: Employee[]) => {
    for (const employee of employees) {
        const newRow = tableBody.insertRow();
        const firstName = newRow.insertCell();
        const lastName = newRow.insertCell();
        const username = newRow.insertCell();
        const personalId = newRow.insertCell();
        const salary = newRow.insertCell();
        const charge = newRow.insertCell();
        const edit = newRow.insertCell();

        const editTag = document.createElement("a");
        editTag.textContent = "Edit";
        editTag.href = "javascript:void(0)";
        if (canEdit) {
            editTag.onclick = async () => {
                window.location.href = `/employees/edit?userToEdit=${employee.username}`;
            };
        }

        firstName.appendChild(document.createTextNode(employee.first_name));
        lastName.appendChild(document.createTextNode(employee.last_name));
        username.appendChild(document.createTextNode(employee.username));
        personalId.appendChild(document.createTextNode(employee.personalId));
        salary.appendChild(document.createTextNode(employee.salary));
        charge.appendChild(document.createTextNode(employee.charge));
        edit.appendChild(editTag);
    }
};

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

getEmployees();

switchThemeButton.addEventListener("click", switchTheme);

home.addEventListener("click", async () => {
    window.location.href = "/home";
});

editEmployees.addEventListener("click", () => {
    if (!canEdit) {
        alert("You aren't authorized to perform this action!");
        return;
    }

    window.location.href = "/employees/edit";
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
