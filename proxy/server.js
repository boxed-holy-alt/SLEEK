import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const { routeRequest, routeUpgrade } = await bootstrap();
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

const app = express();

app.use((req, res, next) => {
	if (routeRequest(req, res)) return;
	next();
});
app.use(express.static(publicDir));

const server = http.createServer(app);

server.on("upgrade", routeUpgrade);

server.listen(3030, () => {
	console.log("Server is running on port 3030");
});
