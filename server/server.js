// Entry point for the Node.js server
// Here we just create a socket_io server and pass the reference to the login server.

import * as socket_io from "socket.io";
import * as admin_ui from "@socket.io/admin-ui";
import * as world_server from "./world-server.js";
const portNumber = 10000;

function InitalizeServer()
{
    const serverOptions = { cors: { origin: "*"}};
    const io = new socket_io.Server(portNumber,serverOptions);
    admin_ui.instrument(io, {auth: false})
    console.log("Server started on port "+portNumber);

    //Server Started, Pass the IO object to the world server now
    const worldServer = new world_server.WorldServer(io);
    worldServer.Start();
}

InitalizeServer();