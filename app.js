const express = require('express');
const http = require('http');  
const { Server } = require('socket.io');
const { Chess } = require("chess.js");
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chess = new Chess();
let players = {};
let currentplayer = "w";

app.set("view engine", "ejs");
// ✅ FIX: Serve both directories
app.use(express.static(path.join(__dirname, "public")));        // For CSS
app.use(express.static(path.join(__dirname, "views/public")));  // For JS

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (socket) {
    console.log("connection");
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconnect", function () {
        // ✅ FIX: Change uniquesocket to socket
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

    socket.on("move", (move) => {
        try {
            // ✅ FIX: Change uniquesocket to socket
            if (chess.turn() === 'w' && socket.id !== players.white) return;
            if (chess.turn() === 'b' && socket.id !== players.black) return;
            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("invalid move:", move);
                // ✅ FIX: Change uniquesocket to socket + consistent event name
                socket.emit("invalid move", move);
            }
        } catch (err) {
            console.log(err);
            // ✅ FIX: Change uniquesocket to socket + consistent event name
            socket.emit("invalid move", move);
        }
    });
});

server.listen(3000, function () {
    console.log("listening on port 3000");
});