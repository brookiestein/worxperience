import {Request, Response} from "express";
import express from "express";
import {join, dirname} from "node:path";

const port: number = 8000;
const app = express();

const users: {id: number, username: string, password: string}[] = [];

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

app.post("/login", (request: Request, response: Response) => {
    if (!checkUserData(request, response)) {
        return;
    }

    response.status(200).json({success: true, message: `Access granted!`});
});

app.post("/user", (request: Request, response: Response) => {
    if (!checkUserData(request, response)) {
        return;
    }

    const username: string = request.body.username;
    const password: string = request.body.password;
    users.push({"id": users.length + 1, "username": username, "password": password});
    console.log(users[users.length - 1]);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});
