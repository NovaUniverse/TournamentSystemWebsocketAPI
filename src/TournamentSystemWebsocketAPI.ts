import express, { Express, Request, Response } from 'express';
import * as HTTP from 'http';
import * as SocketIO from 'socket.io';
import Client from './Client';
import { ClientType } from './ClientType';

export default class TournamentSystemWebsocketAPI {
	private serverKeys: string[];
	private clientKeys: string[];

	private io;
	private express: Express;
	private http: HTTP.Server;

	private clients: Client[];

	constructor(port: number, serverKeys: string[], clientKeys: string[]) {
		this.clients = [];

		this.serverKeys = serverKeys;
		this.clientKeys = clientKeys;

		this.express = express();
		this.express.set("port", port);
		this.http = new HTTP.Server(this.express);
		this.io = new SocketIO.Server(this.http);

		this.express.use('/test', express.static(__dirname + '/../test'));

		this.io.on("connection", (socket: SocketIO.Socket) => {
			let client = new Client(socket, this);
			this.clients.push(client);
			console.log("Client connected and assigned uuid " + client.uuid + " (Client count: " + this.clients.length + ")");
		});

		this.http.listen(port, (): void => {
			console.log("Listening on port " + port);
		});

		setInterval(() => {
			this.clients = this.clients.filter(c => !c.disconnected);
		}, 1000);
	}

	public tryLogin(key: string): ClientType | null {
		if (this.serverKeys.includes(key)) {
			return ClientType.SERVER;
		}

		if (this.clientKeys.includes(key)) {
			return ClientType.CLIENT;
		}

		return null;
	}

	public broadcast(message: string, data: any) {
		this.clients.filter(c => c.isAuthenticated() && !c.disconnected).forEach(c => c.sendData(message, data));
	}
}