import React, { useState, useEffect } from 'react';
import { Peer } from 'peerjs';
import Axios from 'axios';

var lastPeerId = null;
var peer = null;
var conn = null;

function initialize() {
    peer = new Peer(null, {
        debug: true,
        host: "localhost",
        port: 8000,
        path: "/chatapp"
    });

    peer.on('open', function (id) {
        if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }
        console.log('Peer ID: ' + peer.id);
    });
    
    peer.on('connection', function (c) {
        if (conn && conn.open) {
            c.on('open', function() {
                c.send("Already connected to another client");
                setTimeout(function() { c.close(); }, 500);
            });
            return;
        }
        conn = c;
        console.log("Connected to: " + conn.peer);
    
        conn.on('data', function (data) {
            console.log("Received: " + data)
        });
    
        conn.on('close', function () {
            console.log("Connection closed");
        });
    });
    
    peer.on('close', function() {
        conn = null;
        console.log('Connection destroyed');
    });
    
    peer.on('error', function (err) {
        console.log(err);
        alert('' + err);
    });
}

initialize();

function Sidebar() {

    const [msg, setMsg] = useState();
    const [displayMsg, setDisplayMsg] = useState();
    const [receiverId, setReceiverId] = useState();
    const [friendList, setFriendList] = useState();
    const [peerList, setPeerList] = useState([]);
    
    const activeStyle = "list-group-item list-group-item-action active py-3 lh-sm";
    const inactiveStyle = "list-group-item list-group-item-action py-3 lh-sm";

    const HOST = "http://localhost:";
    const PORT = 8001;
    const API = "/api/getFriendList"

    useEffect(() => {
        Axios.get(HOST + PORT + API).then((response) => {
            setFriendList(response.data);
            console.log(response.data);
        });
    }, []);

    const handleChange = (val) => {
        setReceiverId(val.target.value)
    };

    const handleChangeMsg = (val) => {
        setMsg(val.target.value)
    };

    const handlePickPeer = (val) => {
        // if (peerList.includes(val.id)) {
        //     var newarray = peerList.filter(e => {
        //         return e !== val.id;
        //     })
        //     setFriendList(newarray);
        // }
        // else {
        //     setPeerList(old => [...old, val.id]);
        // }
    }
    
    function join() {
        if (conn) {
            conn.close();
        }
        
        conn = peer.connect(receiverId, {
            reliable: true
        });
        
        conn.on('open', function () {
            console.log("Connected to: " + conn.peer);
            var command = getUrlParam("command");
            if (command)
                conn.send(command);
        });

        conn.on('data', function (data) {
            console.log("Received: " + data)
        });

        conn.on('close', function () {
            console.log("Connection closed");
        });
    };

    function getUrlParam(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results == null)
            return null;
        else
            return results[1];
    };

    function sendMessage() {
        if (conn && conn.open) {
            console.log(msg)
            conn.send(msg);
            console.log("Sent: " + msg);
            setDisplayMsg(msg);

        } else {
            console.log('Connection is closed');
        }
    }

    function createRoom(val) {
        console.log(val);
    }

    // connectButton.addEventListener('click', join);

    return (
        <div className="container py-5">
        <div className="d-flex flex-column align-items-stretch flex-shrink-0 bg-white" styles="width: 380px;">
            <a href="/" className="d-flex align-items-center flex-shrink-0 p-3 link-dark text-decoration-none border-bottom">
                <span className="fs-5 fw-semibold">Friends</span>
            </a>

            {friendList.map((val) => {
                return (
                    <div className="list-group list-group-flush border-bottom scrollarea">
                        <button className={(val.active ? activeStyle : inactiveStyle)} value={val.id} aria-current="true" onClick={createRoom}>
                            <div className="d-flex w-100 align-items-center justify-content-between">
                            <strong className="mb-1">{val.name}</strong>
                            <small>{val.latest_time}</small>
                            </div>
                            <div className="col-10 mb-1 small">{val.latest_msg}</div>
                        </button>
                    </div>
                )
            })}

            <input type="text" className="peer-id" onChange={handleChange} />
            <button id="connect-button" onClick={join}>Connect</button>

            <input type="text" className="message-box" onChange={handleChangeMsg}/>
            <button id="send-button" onClick={sendMessage}>Send</button>

            <span id="message"> {displayMsg} </span>            

        </div>
        </div>
    )
}

export default Sidebar;