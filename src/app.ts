import * as FS from "fs";
import TournamentSystemWebsocketAPI from "./TournamentSystemWebsocketAPI";

require('console-stamp')(console, '[HH:MM:ss.l]');

const port: any = process.env.PORT || 8080;

if (!FS.existsSync("./data")) {
	FS.mkdirSync("./data");
}

if (!FS.existsSync("./data/server_keys.json")) {
	FS.writeFileSync("./data/server_keys.json", JSON.stringify([], null, 4), 'utf8');
}

if (!FS.existsSync("./data/client_keys.json")) {
	FS.writeFileSync("./data/client_keys.json", JSON.stringify([], null, 4), 'utf8');
}

const serverKeys: string[] = require("../data/server_keys.json");
const clientKeys: string[] = require("../data/client_keys.json");

if (process.env.WS_API_SERVER_KEY != null) {
	console.log("Adding server key from env variables");
	serverKeys.push(process.env.WS_API_SERVER_KEY);
}

if (process.env.WS_API_CLIENT_KEY != null) {
	console.log("Adding client key from env variables");
	clientKeys.push(process.env.WS_API_CLIENT_KEY);
}

new TournamentSystemWebsocketAPI(port, serverKeys, clientKeys);