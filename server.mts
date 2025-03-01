import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import {Request, Response} from "express";
import {fileURLToPath} from "url";
import {join, dirname} from "node:path";
import {connect, DatabaseError} from "ts-postgres";
import {sha512} from "js-sha512";
import jwt, {VerifyErrors, JwtPayload} from "jsonwebtoken";
import Joi from "joi";

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
    refresh_token: string | undefined
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
        expiresIn: "15m"
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

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (request: Request, response: Response) => {
    const access_token = request.cookies.access_token;
    if (access_token && verifyToken(access_token) === 200) {
        console.log("User is already authenticated, redirecting them to /home.");
        response.redirect("/home");
    } else {
        response.sendFile(join(__dirname, "index.html"));
    }
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

app.get("/home.mjs", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "home.mjs"));
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

app.get("/imgs/show-employees.svg", (request: Request, response: Response) => {
    response.sendFile(join(__dirname, "imgs/show-employees.svg"));
});

app.get("/home", (request: Request, response: Response) => {
    const access_token = request.cookies.access_token;
    if (!access_token) {
        response.status(401).sendFile(join(__dirname, "index.html"));
        return;
    }

    const resultCode = verifyToken(access_token);
    if (resultCode === 200) {
        response.status(resultCode).sendFile(join(__dirname, "home.html"));
    } else {
        console.log("User needs to authenticate again!");
        response.redirect("/");
    }
});

app.get("/employees", (request: Request, response: Response) => {
    const access_token = request.cookies.access_token;
    if (!access_token) {
        response.status(401).sendFile(join(__dirname, "index.html"));
        return;
    }

    const resultCode = verifyToken(access_token);
    if (resultCode === 200) {
        response.status(resultCode).sendFile(join(__dirname, "employees.html"));
    } else {
        response.redirect("/");
    }
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
    const statement = await client.prepare("SELECT id, password FROM Employee WHERE fullname = $1");
    for await (const object of statement.execute([username])) {
        userId = object.id;
        dbPassword = object.password;
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
        refresh_token: undefined
    });

    response.cookie("jwt", refresh_token, {
        httpOnly: true,
        sameSite: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    });

    response.status(200).json({
        success: true,
        message: "Access Granted!",
        token: access_token,
    });

    const user = users.find((user) => user.username === username);

    if (user) {
        user.refresh_token = refresh_token;
    } else {
        users.push({
            id: userId,
            username: username,
            password: hashedPassword,
            refresh_token: refresh_token
        });
    }
});

app.post("/refresh", (request: Request, response: Response) => {
    const refresh_token = request.cookies.jwt;
    if (!refresh_token) {
        response.status(401).json({success: false, message: "Unauthorized"});
        return;
    }

    const user = users.find((user) => user.refresh_token === refresh_token);
    if (!user) {
        response.status(401).json({success: false, message: "Unauthorized"});
        return;
    }

    jwt.verify(refresh_token,
               process.env.REFRESH_TOKEN_SECRET || "",
               (error: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
        if (error) {
            return response.status(401).json({success: false, message: "Unauthorized"});
        }

        const access_token = jwt.sign({
            id: user.id,
            username: user.username,
            password: user.password
        }, process.env.ACCESS_TOKEN_SECRET || "", {
            expiresIn: "15m"
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

    const hashedPassword: string = hash(password);
    const statement = await client.prepare("INSERT INTO Employee (personalId, fullname, password) VALUES ($1, $2, $3)");
    for await (const object of statement.execute([personalId, username, hashedPassword])) {
        if (object instanceof DatabaseError) {
            response.status(400).json({success: false, message: object.message});
            return;
        }
    }

    response.status(201).json({success: true, message: `Employee ${username} successfully created!`});
});

process.on("exit", async () => {
    console.log("Closing DB...");
    await client.end();
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});
