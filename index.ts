const express = require("express");
const path = require("node:path");

const port: number = 8000;
const app = express();

app.get("/", (request, response) => {
    response.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login.js", (request, response) => {
    response.sendFile(path.join(__dirname, "login.js"));
});

app.get("/styles.css", (request, response) => {
    response.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/imgs/login.svg", (request, response) => {
    response.sendFile(path.join(__dirname, "imgs/login.svg"));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});
