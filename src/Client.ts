import { Socket } from "socket.io";
import { v4 } from "uuid";
import { ClientType } from "./ClientType";
import TournamentSystemWebsocketAPI from "./TournamentSystemWebsocketAPI";

export default class Client {
	public uuid: string;
	private socket: Socket;
	public clientType: ClientType;
	public disconnected: boolean;
	private server: TournamentSystemWebsocketAPI;

	private timeout: any;

	constructor(socket: Socket, server: TournamentSystemWebsocketAPI) {
		this.uuid = v4();
		this.socket = socket;
		this.disconnected = false;
		this.clientType = ClientType.UNKNOWN;
		this.server = server;

		socket.on("disconnect", () => {
			console.log("Client with id " + this.uuid + " disconnected");
			this.disconnected = true;

			if (this.timeout != null) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
		});

		socket.on("message", (message: string, content: any) => {
			this.handleIncommingMessage(message, content);
		});

		this.timeout = setTimeout(() => {
			console.log("Auth timeout in client with id " + this.uuid);
			this.disconnected = true;
			this.timeout = null;
			this.sendData("auth_timeout", {
				"message": "Socket did not authenticate within 20 seconds. Disconnecting"
			});
			this.socket.disconnect(true);
		}, 20000);
	}

	public sendData(message: string, content: any): void {
		this.socket.send(message, content);
	}

	private handleIncommingMessage(message: string, content: any): void {
		try {
			if (message.toLocaleLowerCase() == "ping") {
				this.socket.send("pong", {
					"client_type": this.clientType,
					"client_uuid": this.uuid
				});
				return;
			}

			if (message.toLocaleLowerCase() == "auth") {
				if (!this.isAuthenticated()) {
					let key = content.key;
					if (key != null) {
						if (typeof key === 'string') {
							let loginResult = this.server.tryLogin(key);
							if (loginResult != null) {
								this.clientType = loginResult;
								console.log("Client with uuid " + this.uuid + " logged in as type " + this.clientType);
								this.sendData("auth_response", { "success": true, "login_type": this.clientType, "uuid": this.uuid });
								if (this.timeout != null) {
									clearTimeout(this.timeout);
									this.timeout = null;
								}
								return;
							}
						}
					}
					if (this.timeout != null) {
						clearTimeout(this.timeout);
						this.timeout = null;
					}
					console.log("Client with uuid " + this.uuid + " failed to login and got disconnected");
					this.sendData("auth_response", { "success": false, "message": "Authentication failed" });
					this.socket.disconnect(true);
				} else {
					this.sendData("auth_response", { "success": false, "message": "Already authenticated" });
				}
				return;
			}


			if (this.clientType == ClientType.SERVER) {
				console.log("Client with id " + this.uuid + " is broadcasting message " + message);
				this.server.broadcast(message, content);
			} else {
				this.sendData("error", {
					"error": "You dont have permission to broadcast server events"
				});
			}
		} catch (err) {
			if (this.timeout != null) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}

			console.error(err);
			this.sendData("error", {
				"error": "Invalid data received. Disconnecting socket"
			});
			this.socket.disconnect(true);
		}
	}

	isAuthenticated(): boolean {
		return this.clientType == ClientType.SERVER || this.clientType == ClientType.CLIENT;
	}
}