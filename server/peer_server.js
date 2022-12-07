const express = require("express");
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const { ExpressPeerServer } = require('peer');
const PORT = process.env.PORT || "8000";
const HOST = "192.168.1.15";

const customGenerationFunction = () => (Math.random().toString(36) + '0000000000000000000').substr(2, 16);

const peerServer = ExpressPeerServer(server, {
    proxied: true,
    debug: true,
    host: HOST,
    path: '/chatapp',
    port: PORT,
    generateClientId: customGenerationFunction
});

app.use(peerServer);

server.listen(PORT, HOST);
console.log('Listening on: ' + HOST + ':' + PORT);