const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const PORT = 8001;
const HOST = "192.168.1.15";

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

function notValidStr(str) {
    if (str == '')
        return true;
    else if (!str)
        return true;
    return str.trim().length === 0;
}

function addUser(username, password, name) {
    let userJson = fs.readFileSync('./database/users.json');
    let userList = JSON.parse(userJson);
    existUser = userList.filter(e => e.username === username);
    
    let userId = uuidv4();
    let existId = userList.filter(e => e.id === userId);
    while (existId.length > 0) {
        userId = uuidv4();
        existId = userList.filter(e => e.id === userId);
    }

    let newUser = { 
        "id": userId,
        "username": username,
        "password": password,
        "name": name
    }
    userList.push(newUser);
    userJson = JSON.stringify(userList);
    fs.writeFileSync('./database/users.json', userJson);
    return userId;
}

app.get('/api/getActiveList', (req, res) => {
    let activeJson = fs.readFileSync('./database/active.json');
    let activeList = JSON.parse(activeJson);
    res.send(activeList);
});

app.get('/api/getPeerId', (req, res) => {
    let activeJson = fs.readFileSync('./database/active.json');
    let activeList = JSON.parse(activeJson);
    let user = activeList.filter(e => e.id == req.query.id);
    res.send(user[0].peerId);
});

app.get('/api/authentication', (req, res) => {
    let usersJson = fs.readFileSync('./database/users.json');
    let users = JSON.parse(usersJson);
    let user = users.filter(e => e.username == req.query.username);
    if (user.length == 0) {
        res.send({
            success: false,
            id: '',
            name: '',
            username: '',
            error: 'Invalid Username'
        });
    }
    else {
        if (user[0].password !== req.query.password) {
            res.send({
                success: false,
                id: '',
                name: '',
                username: '',
                error: 'Wrong Password'
            });
        }
        else {
            res.send({
                success: true,
                id: user[0].id,
                name: user[0].name,
                username: user[0].username,
                error: ''
            })
        }
    }
});

app.get('/api/register', (req, res) => {
    let usersJson = fs.readFileSync('./database/users.json');
    let users = JSON.parse(usersJson);
    if (notValidStr(req.query.username)) {
        res.send({
            success: false,
            id: '',
            name: '',
            username: '',
            error: "Invalid username"
        });
    }

    if (notValidStr(req.query.name)) {
        res.send({
            success: false,
            id: '',
            name: '',
            username: '',
            error: "Invalid name"
        });
    }

    if (notValidStr(req.query.password)) {
        res.send({
            success: false,
            id: '',
            name: '',
            username: '',
            error: "Invalid password"
        });
    }

    let user = users.filter(e => e.username == req.query.username);
    if (user.length > 0) {
        res.send({
            success: false,
            id: '',
            name: '',
            username: '',
            error: "Username's already existed"
        });
    }
    else {
        if (notValidStr(req.query.username)) {
            res.send({
                success: false,
                id: '',
                name: '',
                username: '',
                error: "Invalid password"
            });
        }
        else {
            let id = addUser(req.query.username, req.query.password, req.query.name);
            res.send({
                success: true,
                id: id,
                name: req.query.name,
                username: req.query.username,
                error: ''
            })
        }
    }
});

app.post('/api/postPeerId', (req, res) => {
    let usersJson = fs.readFileSync('./database/users.json');
    let users = JSON.parse(usersJson);
    let user = users.filter(e => e.id === req.body.id);
    let activeListJson = fs.readFileSync('./database/active.json');
    let activeList = JSON.parse(activeListJson);
    activeList.unshift({
        id: user[0].id,
        name: user[0].name,
        username: user[0].username,
        peerId: req.body.peerId
    });
    activeListJson = JSON.stringify(activeList);
    fs.writeFileSync('./database/active.json', activeListJson, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            res.send({message: "success"});
        }
    });
})

app.post('/api/removePeerId', (req, res) => {
    let activeListJson = fs.readFileSync('./database/active.json');
    let activeList = JSON.parse(activeListJson);
    let removeIdx = activeList.findIndex(e => e.id == req.body.id);
    while (removeIdx != -1) {
        activeList.splice(removeIdx, 1);
        if (activeList.length > 0) {
            removeIdx = activeList.findIndex(e => e.id == req.body.id);
        }
        else break;
    }
    activeListJson = JSON.stringify(activeList);
    fs.writeFileSync('./database/active.json', activeListJson, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            res.send({message: "success"});
        }
    });
})


app.listen(PORT, HOST, () => {
    console.log("Running on:", HOST + ":" + PORT);
})