import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import {Request, Response} from "express";
import {fileURLToPath} from "url";
import {join, dirname} from "node:path";
import {connect, DatabaseError} from "ts-postgres";
import {sha512} from "js-sha512";
import jwt, {VerifyErrors, JwtPayload} from "jsonwebtoken";
import Joi, {ValidationError} from "joi";

const __dirname = dirname(fileURLToPath(import.meta.url)); const port: number = 8000;
const app = express();

const client = await connect({
    "database": process.env.DATABASE || "",
    "password": process.env.DBPASSWORD || "",
    "user": process.env.DBUSER || ""
});

interface Employee {
    id: number;
    password: string;
};

type User = {
    id: number;
    username: string;
    password: string;
    access_token: string | undefined;
    refresh_token: string | undefined;
};

type PermissionType = {
    plain: string;
};

const users: User[] = [];

const hash = (password: string): string => sha512(password);

const checkUserData = (request: Request, response: Response): boolean => {
    if (!request.body) {
        response.status(400).json({success: false, message: `User data is required.`});
        return false;
    }

    if (!request.body.username) {
        response.status(400).json({success: false, message: `Username is required.`});
        return false;
    }

    if (!request.body.password) {
        response.status(400).json({success: false, message: `Password is required.`});
        return false;
    }

    return true;
};

const createToken = (userData: User): [string, string] => {
    const access_token: string = jwt.sign({
        id: userData.id,
        username: userData.username,
        password: userData.password
    }, process.env.ACCESS_TOKEN_SECRET || "", {
        expiresIn: "2h"
    });

    const refresh_token: string = jwt.sign({
        username: userData.username
    }, process.env.REFRESH_TOKEN_SECRET || "", {
        expiresIn: "1d"
    });

    return [access_token, refresh_token];
};

const verifyToken = (token: string): number => {
    let result: number = -1;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "",
            (error: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
        if (error) {
            result = 401;
        } else {
            result = 200;
        }
    });

    return result;
};

const getPermissions = async (username: string): Promise<[string, boolean]> => {
    const schema = Joi.object({
        username: Joi.string()
                    .alphanum()
                    .min(3)
                    .max(30)
                    .required()
    });

    const {error, value} = schema.validate({username: username});
    if (error) {
        console.log("Username is not valid.");
        return new Promise((resolve, reject) => {
            reject(error.message);
        });
    }

    let idCharge: number;
    let statement = await client.prepare("SELECT id, id_charge FROM Employees WHERE username = $1");
    for await (const object of statement.execute([value.username])) {
        idCharge = object.id_charge;
    }

    let permissions: string = "";
    let bypass: boolean;
    statement = await client.prepare("SELECT permissions, bypass FROM Charges WHERE id = $1");
    for await (const object of statement.execute([idCharge])) {
        permissions = object.permissions;
        bypass = object.bypass;
    }

    await statement.close();

    return new Promise((resolve, reject) => {
        resolve([permissions, bypass]);
    });
};

const isUserAuthorized = async (username: string, permission: string): Promise<[boolean, string]> => {
    let promise: Promise<[boolean, string]>;

    await getPermissions(username)
            .then(([permissions, bypass]) => {
                promise =  new Promise((resolve, reject) => {
                    const authorized = permissions.includes(permission);
                    if (authorized || bypass) {
                        resolve([true, permissions]);
                    } else {
                        reject([false, ""]);
                    }
                    return;
                });
            })
            .catch((error) => {
                promise = new Promise((resolve, reject) => {
                    reject([false, ""]);
                });
            });
    return promise;
}

const setAccessPermissionsCookie = (permissions: string, type: PermissionType, response: Response) => {
    const token: string = jwt.sign({
        permissions: permissions
    }, process.env.ACCESS_TOKEN_SECRET || "", {
        expiresIn: "30m"
    });

    response.cookie(type.plain, token, {
        httpOnly: false,
        sameSite: false,
        secure: false,
        maxAge: 30 * 60 * 1000
    });
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (request: Request, response: Response) => {
    const access_token = request.cookies.access_token;
    if (access_token && verifyToken(access_token) === 200 && users.find((user) => user.access_token === access_token)) {
        console.log("User is already authenticated, redirecting them to /home.");
        response.redirect("/home");
    } else {
        response.sendFile(join(__dirname, "index.html"));
    }
});

/* Front-End file requests */
app.get("/login.js", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "login.js"));
});

app.get("/signup.js", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "signup.js"));
});

app.get("/home.js", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "home.js"));
});

app.get("/logout.js", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "logout.js"));
});

app.get("/employees.js", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "employees.js"));
});

app.get("/logout.js", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "logout.js"));
});

app.get("/edit_employees.js", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "edit_employees.js"));
});

app.get("/styles.css", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "styles.css"));
});

app.get("/imgs/login.svg", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "imgs/login.svg"));
});

app.get("/imgs/signup.svg", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "imgs/signup.svg"));
});

app.get("/imgs/logout.svg", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "imgs/logout.svg"));
});

app.get("/imgs/show-employees.svg", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "imgs/show-employees.svg"));
});

app.get("/signup", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "signup.html"));
});

app.get("/home", (request: Request, response: Response) => {
    const access_token = request.cookies.access_token;
    if (!access_token) {
        console.log("Access token not found! User needs to authenticate again!");
        response.redirect("/");
        return;
    }

    const resultCode = verifyToken(access_token);
    if (resultCode === 200) {
        response.status(resultCode).sendFile(join(__dirname, "home.html"));
    } else {
        console.log("Access token is not valid; user needs to authenticate again!");
        response.redirect("/");
    }
});

app.get("/auth/employees/view", async (request: Request, response: Response) => {
    const username = request.headers.username as string;
    if (!username) {
        console.log("Not authorized to view employees; username wasn't provided.");
        response.status(401).json({success: false, message: "Unauthorized."});
        return;
    }

    await isUserAuthorized(username, "view")
            .then(([authorized, permissions]) => {
                console.log(`User ${username} has permissions to view employees!`);
                setAccessPermissionsCookie(permissions, {plain: "view_employees"}, response);
                response.status(200).json({success: true});
            })
            .catch(([authorized, permissions]) => {
                console.log("User has no permissions to view employees.");
                response.status(401).json({success: false, message: "Unauthorized."});
            });
});

app.get("/auth/employees/edit/:username", async (request: Request, response: Response) => {
    const username = request.params.username as string;
    if (!username) {
        console.log("Not authorized to edit employees; username wasn't provided.");
        response.status(401).json({success: false, message: "Unauthorized."});
        return;
    }

    await isUserAuthorized(username, "updateEmployee")
            .then(([authorized, permissions]) => {
                console.log(`User ${username} has permissions to edit employees!`);
                setAccessPermissionsCookie(permissions, {plain: "edit_employees"}, response);
                response.status(200).json({success: true});
            })
            .catch(([authorized, permissions]) => {
                console.log("User has no permissions to edit employees.");
                response.status(401).json({success: false, message: "Unauthorized."});
            });
});


app.get("/employees", (request: Request, response: Response) => {
    const token = request.cookies.view_employees;
    if (token) {
        if (verifyToken(token) === 200) {
            response.status(200).sendFile(join(__dirname, "employees.html"));
            return;
        } else {
            console.log("Access token is not valid; user has no permissions to view employees.");
        }
    } else {
        console.log("Access token not found! User has no permissions to view employees.");
    }

    response.status(401).json({success: false, message: "Unauthorized."});
});

app.get("/employees/edit", (request: Request, response: Response) => {
    const token = request.cookies.edit_employees;
    if (token) {
        if (verifyToken(token) === 200) {
            if (request.query.userToEdit) {
                response.cookie("userToEdit", request.query.userToEdit, {
                    httpOnly: false,
                    sameSite: false,
                    secure: false,
                    maxAge: 60 * 1000
                });
            }

            response.status(200).sendFile(join(__dirname, "edit_employees.html"));
            return;
        }
    } else {
        console.log("Access token not found!");
    }

    response.status(401).json({success: false, message: "Unauthorized."});
});

app.get("/employees/all", async (request: Request, response: Response) => {
    const token = request.cookies.view_employees;
    if (token) {
        if (verifyToken(token) !== 200) {
            response.status(401).json({success: false, message: "Unauthorized; token is not valid."});
            return;
        }
    } else {
        response.status(401).json({success: false, message: "Unauthorized; token not found."});
        return;
    }

    const users: {
        first_name: string,
        last_name: string,
        username: string,
        charge: string,
        personalId: string,
        salary: string,
        permissions: string,
        bypass: boolean
    }[] = [];

    const statement = await client.prepare("SELECT first_name, last_name, username, personal_id, salary, \
                                           description, permissions, bypass \
                                           FROM Employees \
                                           JOIN Charges ON Charges.id = Employees.id_charge");

    for await (const object of statement.execute()) {
        users.push({
            first_name: object.first_name,
            last_name: object.last_name,
            username: object.username,
            personalId: object.personal_id,
            salary: object.salary,
            charge: object.description,
            permissions: object.permissions,
            bypass: object.bypass
        });
    }

    if (users.length > 0) {
        response.status(200).json(users);
    } else {
        response.status(404).json({success: false, message: "There's no users to show."});
    }
});

app.get("/charges", async (request: Request, response: Response) => {
    const token = request.cookies.edit_employees;
    if (!token) {
        response.status(401).json({success: false, message: "Unauthorized; token not found!"});
        return;
    }

    const charges: string[] = [];
    const statement = await client.prepare("SELECT description FROM Charges");
    for await (const object of statement.execute()) {
        charges.push(object.description);
    }

    response.status(200).json(charges);
});

app.post("/auth/login", async (request: Request, response: Response) => {
    if (!checkUserData(request, response)) {
        return;
    }

    const {username, password} = request.body;

    const schema = Joi.object({
        username: Joi.string()
                    .alphanum()
                    .min(3)
                    .max(30)
                    .required()
    });

    const {error, value} = schema.validate({username: username});
    if (error) {
        response.status(401).json({success: false, message: "Username is invalid."});
        return;
    }

    let userId: number = -1;
    let dbPassword: string = "";
    let usertype: string = "";
    const statement = await client.prepare("SELECT Employees.id, password, description \
                                           FROM Employees \
                                           JOIN Charges ON Employees.id_charge = Charges.id \
                                           WHERE username = $1");

    for await (const object of statement.execute([value.username])) {
        userId = object.id;
        dbPassword = object.password;
        usertype = object.description;
    }

    if (userId < 0) {
        response.status(404).json({success: false, message: `Employee ${username} not found!`});
        return;
    }

    const hashedPassword: string = hash(password);
    if (dbPassword !== hashedPassword) {
        response.status(401).json({success: false, message: "Credentials are incorrect."});
        return;
    }

    await statement.close();

    const [access_token, refresh_token] = createToken({
        id: userId,
        username: username,
        password: hashedPassword,
        access_token: undefined,
        refresh_token: undefined
    });

    response.cookie("jwt", refresh_token, {
        httpOnly: true,
        sameSite: false,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    });

    response.status(200).json({
        success: true,
        message: "Access Granted!",
        token: access_token,
        usertype: usertype
    });

    const user = users.find((user) => user.username === value);

    if (user) {
        user.refresh_token = refresh_token;
    } else {
        users.push({
            id: userId,
            username: username,
            password: hashedPassword,
            access_token: access_token,
            refresh_token: refresh_token
        });
    }
});

app.post("/refresh", (request: Request, response: Response) => {
    const refresh_token = request.cookies.jwt;
    if (!refresh_token) {
        response.status(401).json({success: false, message: "Unauthorized; refresh token not found!"});
        return;
    }

    const user = users.find((user) => user.refresh_token === refresh_token);
    if (!user) {
        response.status(401).json({success: false, message: "Unauthorized; user is not logged in!"});
        return;
    }

    jwt.verify(refresh_token,
               process.env.REFRESH_TOKEN_SECRET || "",
               (error: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
        if (error) {
            return response.status(401).json({success: false, message: "Unauthorized; refresh token is not valid!"});
        }

        const access_token = jwt.sign({
            id: user.id,
            username: user.username,
            password: user.password
        }, process.env.ACCESS_TOKEN_SECRET || "", {
            expiresIn: "2h"
        });

        response.status(200).json({
            success: true,
            message: "Access Granted!",
            token: access_token,
        });
    });
});

app.post("/auth/register", async (request: Request, response: Response) => {
    if (!checkUserData(request, response)) {
        return;
    }

    if (!request.body.personalId) {
        response.status(400).json({success: false, message: "Personal ID is required."});
        return;
    }

    const username: string = request.body.username;
    const personalId: string = request.body.personalId;
    const password: string = request.body.password;

    const schema = Joi.object({
        username: Joi.string()
                    .alphanum()
                    .min(3)
                    .max(30)
                    .required(),
        password: Joi.string()
                    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
                    .required(),
        repeat_password: Joi.ref("password"),
        personalId: Joi.string()
                    .pattern(new RegExp("[0-9]{3}-?[[0-9]]{7}-?[0-9]"))
                    .required()
    });

    const {error, value} = schema.validate({
        username: username,
        password: password,
        personalId: personalId
    });

    if (error) {
        response.status(400).json({success: false, message: "User data is invalid."});
        return;
    }

    const hashedPassword: string = hash(value.password);

    await client.query("BEGIN");

    const statement = await client.prepare("INSERT INTO Employee (personalId, fullname, password) VALUES ($1, $2, $3)");
    for await (const object of statement.execute([value.personalId, value.username, hashedPassword])) {
        if (object instanceof DatabaseError) {
            await client.query("ROLLBACK");
            response.status(400).json({success: false, message: object.message});
            return;
        }
    }

    await client.query("COMMIT");
    await statement.close();

    response.status(201).json({success: true, message: `Employee ${username} successfully created!`});
});

const validateAndClearIncomingData = (edited_field: string, new_value: string, response: Response): string | undefined => {
    const schema = Joi.object({
        first_name: Joi.string().min(3).max(30).pattern(new RegExp("^[a-zA-z].+")),
        last_name: Joi.string().alphanum().min(3).max(30),
        personal_id: Joi.string().alphanum().min(11).max(13).pattern(new RegExp("^[0-9]{3}-?[0-9]{7}-?[0-9]$")),
        salary: Joi.number().min(1),
        charge: Joi.string().pattern(new RegExp("(Director|Manager|InCharge|Coordinator|Analyst|AdminIT)"))
    });

    let error: ValidationError;
    let value: {
        first_name: string;
        last_name: string;
        personal_id: string;
        salary: number;
        charge: string;
    };

    switch (edited_field) {
    case "first_name":
        ({error, value} = schema.validate({first_name: new_value}));
        if (error) {
            const message = `Name ${new_value} is not valid.`;
            console.log(message);
            response.status(400).json({success: false, message: message });
            return undefined;
        }
        return value.first_name;
    case "last_name":
        ({error, value} = schema.validate({last_name: new_value}));
        if (error) {
            const message = `Last name ${new_value} is not valid.`;
            console.log(message);
            response.status(400).json({success: false, message: message});
            return undefined;
        }
        return value.last_name;
    case "personal_id":
        ({error, value} = schema.validate({personal_id: new_value}));
        if (error) {
            const message = `Personal ID ${new_value} is not valid.`;
            console.log(message);
            response.status(400).json({success: false, message: message});
            return undefined;
        }
        return value.personal_id;
    case "salary":
        ({error, value} = schema.validate({salary: new_value}));
        if (error) {
            const message = `Salary ${new_value} is not valid.`;
            console.log(message);
            response.status(400).json({success: false, message: message});
            return undefined;
        }
        return `${value.salary}`;
    case "charge":
        ({error, value} = schema.validate({charge: new_value}));
        if (error) {
            const message = `Charge ${new_value} is not valid.`;
            response.status(400).json({success: false, message: message});
            return undefined;
        }
        return value.charge;
    default:
        response.status(400).json({success: false, message: `Field '${edited_field}' is invalid.`});
        return undefined;
    }
}

app.patch("/updateEmployee", async (request: Request, response: Response) => {
    const edited_field = request.body.edited_field;
    const new_value = request.body.new_value;
    const username = request.body.username;

    if (!request.body || !edited_field || !new_value || !username) {
        response.status(400).json({success: false, message: "No employee data was provided."});
        return;
    }

    const value = validateAndClearIncomingData(edited_field, new_value, response);
    if (!value) {
        return;
    }

    await client.query("BEGIN");

    await client.query(`UPDATE Employees SET ${edited_field} = '${value}' WHERE username = '${username}'`)
                .then(async () => {
                    await client.query("COMMIT");
                    response.status(200).json({success: true, message: `Field ${edited_field} updated to ${value}`, new_value: value});
                })
                .catch(async (error) => {
                    console.log(error);
                    await client.query("ROLLBACK");
                    response.status(400).json({success: false, message: `An error occurred while updating Employee ${username}!`});
                });
});

app.delete("/user/logout/:username", (request: Request, response: Response) => {
    const user = users.find((user) => user.username === request.params.username);
    if (user) {
        const index = users.indexOf(user);
        let username: string = "";
        if (index >= 0) {
            username = user.username;
            console.log(`User ${username} has logged out!`);
            users.splice(index, 1);
        }

        response.status(202).json({success: true, message: `User: ${username} successfully logged out.`});
    } else {
        response.status(204).json({success: false, message: `User not found!`});
    }
});

process.on("exit", async () => {
    console.log("Closing DB...");
    await client.end();
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});
