import express from "express";
import winston from "winston";

import gradesRouter from "./routes/grades-control.js";

import {promises as fs} from "fs";

const {readFile, writeFile} = fs;

global.fileName = "grades.json";

const {combine, timestamp, label, printf} = winston.format;
const myFormat = printf(({level, message, label, timestamp}) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

global.logger = winston.createLogger({
    level: "silly",
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({filename: "grades-control-api"})
    ],
    format: combine(
        label({label: "grades-control-api"}),
        timestamp(),
        myFormat
    )
});

const app = express();
app.use(express.json());
app.use("/grades", gradesRouter);

app.get("/", (req, res) => {
    res.send("Bem vindo a API Grades control")
});

app.listen(3000, async () => {
    try{
        global.logger.info("API Started!");
        const json = JSON.stringify(await readFile(`./database-json/${global.fileName}`));
        //global.logger.info(json);

    }catch(err){
        global.logger.error(err);
    }
});
