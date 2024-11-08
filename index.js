const express = require('express');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
const passport = require('./config/passport'); // Adjust the path based on your folder structure
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const { Chess } = require('chess.js');
const authRoutes = require('./routes/auth'); // Adjust the path based on your folder structure

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'W';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'your_secret_key', // Change this to a strong secret
    resave: false,
    saveUninitialized: false
}));
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(flash());

// Routes
// app.use('/auth', authRoutes); // Use the authentication routes

app.get('/chess', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

// Socket.io configuration
io.on('connection', function (socket) {
    console.log('connected');
    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'W');
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'B');
    } else {
        socket.emit('spectatorRole');
    }

    socket.on('disconnect', function () {
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

    socket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && socket.id !== players.white) return;
            if (chess.turn() === 'b' && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            } else {
                console.log('Invalid move:', move);
                socket.emit('invalidMove', move);
            }
        } catch (err) {
            console.log(err);
            socket.emit('invalidMove', move);
        }
    });

    socket.on('restart', () => {
        chess.reset();
        io.emit('restart');
        io.emit('boardState', chess.fen());
    });
});

server.listen(8080, function () {
    console.log('Server is running on port 8080');
});
