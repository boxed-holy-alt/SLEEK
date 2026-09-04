import http from "node:http";
import express from "express";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const { routeRequest, routeUpgrade } = await bootstrap();

const app = express();

app.use((req, res, next) => {
	if (routeRequest(req, res)) return;
	next();
});
app.use(express.static("public"));

const server = http.createServer(app);

server.on("upgrade", routeUpgrade);

const port = Number(process.env.PORT || 3030);

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
