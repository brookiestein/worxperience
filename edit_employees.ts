const switchThemeButton = document.getElementById("switchThemeButton") as HTMLInputElement;
const home = document.getElementById("home") as HTMLAnchorElement;
const showEmployees = document.getElementById("showEmployees") as HTMLAnchorElement;
const ponche = document.getElementById("ponche") as HTMLAnchorElement;
const username = document.getElementById("username") as HTMLHeadingElement;
const usertype = document.getElementById("usertype") as HTMLParagraphElement;
const form = document.getElementById("employees-data-form") as HTMLFormElement;
const firstName = document.getElementById("first-name") as HTMLInputElement;
const lastName = document.getElementById("last-name") as HTMLInputElement;
const usernameInput = document.getElementById("username-input") as HTMLSelectElement;
const personalId = document.getElementById("personal-id") as HTMLInputElement;
const salary = document.getElementById("salary") as HTMLInputElement;
const charges = document.getElementById("charge") as HTMLSelectElement;
const updateEmployee = document.getElementById("updateEmployee") as HTMLButtonElement;
const savedTheme: string = localStorage.getItem("theme") || "";
let modificationsCounter: number = 0;
const modifiedFields = {
    "first_name": false,
    "last_name": false,
    "personal_id": false,
    "salary": false,
    "charge": false
};

type Employee = {
    first_name: string;
    last_name: string;
    username: string;
    charge: string;
    personalId: string;
    salary: string;
    permissions: string;
    bypass: string
};

let employees: Employee[] = [];

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
    const emptyUsername = document.createElement("option");
    const emptyCharge = document.createElement("option");
    emptyUsername.textContent = "";
    emptyCharge.textContent = "";
    usernameInput.appendChild(emptyUsername);
    charges.appendChild(emptyCharge);

    await axios.get<Employee[]>("/employees/all")
            .then(async (response) => {
                employees = (response.data as Employee[]);
                for (const employee of employees) {
                    const item = document.createElement("option");
                    item.textContent = employee.username;
                    usernameInput.appendChild(item);
                }

                await axios.get<string[]>("/charges")
                        .then((response) => {
                            for (const chargeDescription of (response.data as string[])) {
                                const charge = document.createElement("option");
                                charge.textContent = chargeDescription;
                                charges.appendChild(charge);
                            }
                        })
            })
            .catch((error) => {
                alert("You aren't authorized to perform this action!");
            });
};

const setUserData = () => {
    let userToEdit: string = "";
    document.cookie.split(';').find((cookie) => {
        let name = cookie.substring(0, cookie.indexOf('='));
        if (name === " userToEdit") {
            userToEdit = cookie.substring(cookie.indexOf('=') + 1, cookie.length);
            return;
        }
    });

    if (userToEdit === "") {
        return;
    }

    let index: number = -1;
    for (const username of usernameInput.options) {
        ++index;
        if (username.text === userToEdit) {
            usernameInput.selectedIndex = index;

            let event = document.createEvent("HTMLEvents");
            event.initEvent("change", false, true);
            usernameInput.dispatchEvent(event);

            break;
        }
    }
}

const enableUpdate = () => {
    updateEmployee.disabled = modificationsCounter === 0;
}

switchThemeButton.checked = savedTheme === "dark";
if (switchThemeButton.checked) {
    switchTheme();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
});

usernameInput.addEventListener("change", () => {
    const selection: string = usernameInput.options[usernameInput.selectedIndex].text;
    if (selection === "") {
        firstName.value = "";
        lastName.value = "";
        personalId.value = "";
        salary.value = "";
        charges.selectedIndex = 0;
        return;
    }

    const employee = employees.find((e) => e.username === selection);
    if (!employee) {
        return;
    }

    firstName.value = employee.first_name;
    lastName.value = employee.last_name;
    personalId.value = employee.personalId;
    salary.value = employee.salary;

    let index: number = -1;
    for (const charge of charges.options) {
        ++index;
        if (charge.text === employee.charge) {
            charges.selectedIndex = index;
            break;
        }
    }
});

firstName.addEventListener("change", () => {
    const employee = employees.find((employee) => employee.username === usernameInput.value);
    if (!employee) {
        return;
    }

    modifiedFields.first_name = (employee.first_name !== firstName.value);

    if (modifiedFields.first_name) {
        ++modificationsCounter;
    } else {
        --modificationsCounter;
    }

    enableUpdate();
});

lastName.addEventListener("change", () => {
    const employee = employees.find((employee) => employee.username === usernameInput.value);
    if (!employee) {
        return;
    }

    modifiedFields.last_name = (employee.last_name !== lastName.value);

    if (modifiedFields.last_name) {
        ++modificationsCounter;
    } else {
        --modificationsCounter;
    }

    enableUpdate();
});

personalId.addEventListener("change", () => {
    const employee = employees.find((employee) => employee.username === usernameInput.value);
    if (!employee) {
        return;
    }

    modifiedFields.personal_id = (employee.personalId !== personalId.value);

    if (modifiedFields.personal_id) {
        ++modificationsCounter;
    } else {
        --modificationsCounter;
    }

    enableUpdate();
});

salary.addEventListener("change", () => {
    const employee = employees.find((employee) => employee.username === usernameInput.value);
    if (!employee) {
        return;
    }

    if (isNaN(parseFloat(salary.value))) {
        alert("Salary must be a numeric value.");
        return;
    }

    modifiedFields.salary = (employee.salary !== salary.value);

    if (modifiedFields.salary) {
        ++modificationsCounter;
    } else {
        --modificationsCounter;
    }

    enableUpdate();
});

charges.addEventListener("change", () => {
    const employee = employees.find((employee) => employee.username === usernameInput.value);
    if (!employee) {
        return;
    }

    modifiedFields.charge = (employee.charge !== charges.options[charges.selectedIndex].text);

    if (modifiedFields.charge) {
        ++modificationsCounter;
    } else {
        --modificationsCounter;
    }

    enableUpdate();
});

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

updateEmployee.addEventListener("click", async () => {
    type Response = {
        success: boolean;
        message: string;
        new_value: string;
    };

    let updated: boolean = false;

    for (const field in modifiedFields) {
        if (!modifiedFields[field]) {
            continue;
        }

        let new_value: string = "";
        switch(field) {
        case "first_name":
            new_value = firstName.value;
            break;
        case "last_name":
            new_value = lastName.value;
            break;
        case "personal_id":
            new_value = personalId.value;
            break;
        case "salary":
            new_value = salary.value;
            break;
        case "charge":
            new_value = charges.options[charges.selectedIndex].text;
            break;
        default:
            continue;
        }

        await axios.patch<Response>("/updateEmployee", {
            edited_field: field,
            new_value: new_value,
            username: usernameInput.value
        })
        .then((response) => {
            employees[field] = response.data.new_value;
            updated = true;
        })
        .catch((error) => {
            updated = false;
            alert(error.response.data.message);
            return;
        });
    }

    if (updated) {
        alert(`Employee ${usernameInput.value} successfully updated!`);
    }
});

enableUpdate();
await getEmployees();
setUserData();

usertype.textContent = localStorage.getItem("usertype") || "";
username.textContent = localStorage.getItem("username") || "";
