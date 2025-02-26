import {Request, Response} from "express";
import express from "express";
import {fileURLToPath} from "url";
import process from "node:process";
import path from "node:path";
import {join, dirname} from "node:path";
import {connect} from "ts-postgres";
const __dirname = dirname(fileURLToPath(import.meta.url)); const port: number = 8000;
const app = express();

const client = await connect({
    "database": "workxperience",
    "password": "Brayan*Developer01",
    "user": "brayan"
});

interface Employee {
    password: string;
};

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

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "index.html"));
});

app.get("/login.mjs", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "login.mjs"));
});

app.get("/signup", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "signup.html"));
});

app.get("/signup.mjs", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "signup.mjs"));
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

app.post("/login", async (request: Request, response: Response) => {
    if (!checkUserData(request, response)) {
        return;
    }

    const result = await client.query<Employee>("SELECT password FROM Employee WHERE fullname = $1", [request.body.username]);
    const employee = [...result][0];
    if (!employee) {
        response.status(404).json({success: false, message: `Employee ${request.body.username} not found!`});
        return;
    }

    if (employee.password === request.body.password) {
        response.status(200).json({success: true, message: "Access granted!"});
    } else {
        response.status(401).json({success: false, message: "Password is incorrect."});
    }
});

app.post("/user", async (request: Request, response: Response) => {
    if (!checkUserData(request, response)) {
        return;
    }

    if (!request.body.personalId) {
        response.status(400).json({success: false, message: "Personal ID is required."});
        return;
    }

    if (!request.body.pricePerHour) {
        response.status(400).json({success: false, message: "Price Per Hour is required."});
        return;
    }

    const username: string = request.body.username;
    const personalId: string = request.body.personalId;
    const password: string = request.body.password;
    const pricePerHour: number = parseInt(request.body.pricePerHour);

    await client.query(
        "INSERT INTO Employee (personalId, fullname, password, pricePerHour) VALUES ($1, $2, $3, $4);",
        [personalId, username, password, pricePerHour]
    ).then(() => {
        response.status(201).json({success: true, message: `Employee ${username} successfully created!`});
    }).catch((error) => {
        response.status(400).json({success: false, message: error.message});
    });
});

process.on("exit", async () => {
    console.log("Closing DB...");
    await client.end();
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});
