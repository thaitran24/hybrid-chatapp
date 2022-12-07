import { React, useEffect, useState, useRef } from "react";
import { useHistory, useNavigate } from "react-router-dom";
import Peer from "peerjs";
import Axios from "axios";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import '../css/chatbar.css'

const HOST = "http://192.168.1.15:";
const PORT = 8001;
const PEER_HOST = "192.168.1.15"
const PEER_PORT = 8000;

var peer = null;
var conn = null;
var myVideo = null;
var friendVideo = null;

var chunkLength = 1000*6000, file_size, file_name;

function initialize() {
    peer = new Peer(null, {
        debug: true,
        host: PEER_HOST,
        port: PEER_PORT,
        path: "/chatapp"
    });

    peer.on('open', function (id) {
        console.log('Peer ID: ' + peer.id);
    });
}

var countId = 0;
var isInit = false;

function Chat() {
    const RECEIVE_MSG = 0;
    const SEND_MSG = 1;
    const SMALL_FILE = 0;
    const LARGE_FILE = 1;
    if (!isInit) {
        initialize();
        isInit = true;
    }
    const navigate = useNavigate();
    const bottomChatRef = useRef(null);
    const [user, setUser] = useState();
    const [sendMsg, setSendMsg] = useState();
    const [receiverId, setReceiverId] = useState();
    const [enterRoom, setEnterRoom] = useState();
    const [chatMsg, setChatMsg] = useState([]);
    const [activeList, setActiveList] = useState();
    const [searchItem, setSearchItem] = useState('');
    const [files, setFiles] = useState([]);
    const [largeFiles, setLargeFiles] = useState([]);
    const [largeFileMsg, setLargeFileMsg] = useState("Send Large File");
    const [connId, setConnId] = useState();
    const [disableConnId, setDisableConnId] = useState(false);
    const [hideVidCall, setHideVidCall] = useState(true);
    const [show, setShow] = useState(false);
    const [noticeMsg, setNoticeMsg] = useState();
    const [errConn, setErrConn] = useState(false);
    const handleClose = () => {
        setShow(false);
        if (errConn) {
            navigate(0);
        }
    }
    const handleShow = () => {
        setShow(true);  
    } 


    const receiveMsgClass = "small p-2 ms-3 mb-1 rounded-3";
    const receiveMsgStyle = "background-color: #f5f6f7;";
    const sendMsgClass = "small p-2 me-3 mb-1 text-white rounded-3 bg-primary";
    const sendBoxClass = "d-flex flex-row justify-content-end mb-4";
    const receiveBoxClass = "d-flex flex-row justify-content-start mb-4";
    const receiveTimeClass = "small ms-3 mb-3 rounded-3 text-muted";
    const sendTimeClass = "small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end";
    
    useEffect(() => {
        const loggedInUserId = localStorage.getItem("id");
        const loggedInName = localStorage.getItem("name");
        const loggedInUserName = localStorage.getItem("username");
        if (loggedInUserId) {
            setUser({
                id: loggedInUserId,
                name: loggedInName,
                username: loggedInUserName
            });
        }
        else {
            navigate("/");
        }
    }, []);

    useEffect(() => {
        console.log(activeList);
    }, [activeList])

    useEffect(() => {
        getActiveList();
    }, [])

    useEffect(() => {
        if (searchItem.length > 0) {
            search();
        }
        else {
            getActiveList();
        }
    }, [searchItem])

    useEffect(() => {
        join();
    }, [enterRoom])

    useEffect(() => {
        if (largeFiles.length > 0) {
            sendLargeFile();
        }
    }, [largeFiles])

    useEffect(() => {
        bottomChatRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMsg])

    useEffect(() => {
        if (files.length > 0) {
            sendFile();
            setFiles([]);
            document.getElementById("multiple-file").value = null;
        }
    }, [files])

    useEffect(() => {
        if (largeFiles.length > 0) {
            
        }
    })

    useEffect(() => {
        if (peer.id !== null && user) {
            postPeerId();
        }
    }, [peer])

    useEffect(() => {
        if (peer.id !== null && user) {
            postPeerId();
        }
    }, [peer.id])

    window.addEventListener('beforeunload', function (e) {
        if (user.id) {
            removePeerId();
        }
    });

    function postPeerId() {
        if (user.id && peer.id) {
            Axios.post(HOST + PORT + "/api/postPeerId", {
                id: user.id, peerId: peer.id
            }).then(response => {
                console.log(response.status);
            }).catch(error => {
                console.log(error);
            });
            console.log("Broadcasted PeerID!");
        }
    };

    function removePeerId() {
        Axios.post(HOST + PORT + "/api/removePeerId", {
            id: user.id, peerId: peer.id
        }).then(response => {
            console.log(response.status);
        }).catch(error => {
            console.log(error);
        });
    }

    useEffect(() => {
        getActiveList();
    }, []);

    function getActiveList() {
        Axios.get(HOST + PORT + "/api/getActiveList").then((response) => {
            if (user) {
                let aList = response.data;
                let removeIdx = aList.findIndex(e => e.id == user.id);
                while (removeIdx != -1) {
                    aList.splice(removeIdx, 1);
                    if (aList.length > 0) {
                        removeIdx = aList.findIndex(e => e.id == user.id);
                    }
                    else break;
                }
                setActiveList(aList);
            }
            else {
                setActiveList(response.data)
            }
        });
    }

    const handleChangePeerInput = (val) => {
        setReceiverId(val.target.value)
    };

    const handleDisconnect = (val) => {
        conn.close();
        setChatMsg([]);
        navigate(0);
    };

    const handleLogout = (val) => {
        localStorage.removeItem("id");
        localStorage.removeItem("name");
        localStorage.removeItem("username");
        handleDisconnect();
    };

    const handleConnect = (val) => {
        setEnterRoom(true);
    };

    const handleCallVideo = (val) => {
        setHideVidCall(false);
        videoCall();
    }

    const handleConnectChat = (val) => {
        let id = val.target.id;
        Axios.get(HOST + PORT + "/api/getPeerId", {
            params: {id: id}
        }).then((response) => {
            setReceiverId(response.data);
            handleConnect();
        });
    };

    const handleChangeMsg = (val) => {
        setSendMsg(val.target.value);
    };

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const handleFile = (e) => {
        setFiles(e.target.files);
    }

    const handleLargeFile = (e) => {
        setLargeFiles(e.target.files);
    }

    function addHour() {
        var now = new Date();
        var h = now.getHours();
        var m = addZero(now.getMinutes());

        if (h > 12)
            h -= 12;
        else if (h === 0)
            h = 12;

        function addZero(t) {
            if (t < 10)
                t = "0" + t;
            return t;
        };
        return [h, m]
    }

    const videoCall = () => {
        var getUserMedia = navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
        navigator.getUserMedia({ video: true, audio: true }, (stream) => {
            myVideo.srcObject = stream;
            myVideo.play();
        
            const call = peer.call(connId, stream);
        
            call.on('stream', (remoteStream) => {
                friendVideo.srcObject = remoteStream;
                friendVideo.play();
            });
        });
      }

    function join() {
        peer.on('connection', function (c) {
            if (conn && conn.open) {
                c.on('open', function() {
                    console.log("Peer is already connected to another one");
                    setTimeout(function() { c.close(); }, 500);
                });
                return;
            }

            if (peer.id === c.peer) {
                setErrConn(true);
                handleShow();
                setNoticeMsg("Cannot connect to PeerID: " + c.peer);
            }
            else {
                conn = c;
                console.log("Connected to id: " + conn.peer);
                setConnId(conn.peer);
                setDisableConnId(true);
            }

            conn.on('data', function (data) {
                console.log("Received rec: ", data);
                let tm = addHour();
                let time = tm[0] + ":" + tm[1]
                if (data.filetype == "text") {
                    let enc = new TextDecoder("utf-8");
                    let text = enc.decode(data.file);
                    console.log(data.send_username);
                    setChatMsg((chatMsg) => [...chatMsg, {"id": countId, "type": RECEIVE_MSG, "msg": text, "time": time, "send_username": data.send_username, "file": false}]);
                    countId++;
                }
                else {
                    if (data.send_type === SMALL_FILE) {
                        setChatMsg((chatMsg) => [...chatMsg, {"id": countId, "type": RECEIVE_MSG, "msg": data, "time": time, "send_username": data.send_username, "file": true}]);
                        countId++;
                    }
                    else {
                        setLargeFileMsg("Receiving " + data.file_name);
                        handleData(data);
                    }
                }
            });
            
            peer.on('call', (call) => {
                var getUserMedia = navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
          
                navigator.getUserMedia({ video: true, audio: true }, (stream) => {
                    myVideo.srcObject = stream;
                    myVideo.play();
            
                    call.answer(stream);
            
                    call.on('stream', (remoteStream) => {
                        friendVideo.srcObject = remoteStream;
                        friendVideo.play();
                    });
                });
            });

            conn.on('close', function () {
                console.log("Connection closed");
                handleDisconnect();
                conn = null;
            });
        });

        if (conn) {
            conn.close();
            conn = null;
            // handleDisconnect();
        }

        conn = peer.connect(receiverId, {
            reliable: true
        });
        
        conn.on('open', function () {
            console.log("Connected to peer: " + conn.peer);
            setConnId(conn.peer);
            setDisableConnId(true);
            var command = getUrlParam("command");
            if (command)
                conn.send(command);
        });

        conn.on('data', function (data) {
            console.log("Received: ", data);
            let tm = addHour();
            let time = tm[0] + ":" + tm[1];
            if (data.filetype == "text") {
                let enc = new TextDecoder("utf-8");
                let text = enc.decode(data.file);
                setChatMsg((chatMsg) => [...chatMsg, {"id": countId, "type": RECEIVE_MSG, "msg": text, "time": time, "send_username": data.send_username, "file": false}]);
                countId++;
            }
            else {
                if (data.send_type === SMALL_FILE) {
                    setChatMsg((chatMsg) => [...chatMsg, {"id": countId, "type": RECEIVE_MSG, "msg": data, "time": time, "send_username": data.send_username, "file": true}]);
                    countId++;
                }
                else {
                    setLargeFileMsg("Receiving " + data.file_name);
                    handleData(data);
                }
            }
        });

        conn.on('close', function () {
            console.log("Connection closed");
            handleDisconnect();
            conn = null;
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

    function onlySpaces(str) {
        return str.trim().length === 0;
    }

    function saveFile(e) {
        let fileId = e.target.id;
        if (!fileId) {
            return
        }
        let blob = chatMsg.find(e => e.id == fileId);
        if (!blob.file) {
            return
        }
        blob = blob.msg;
        const a = document.createElement('a');
        a.download = blob.filename;
        var binaryData = [];
        binaryData.push(blob.file);
        a.href = window.URL.createObjectURL(new Blob(binaryData, {type: blob.filetype}));
        a.addEventListener('click', (e) => {
            setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });
        a.click();
    }

    function sendLargeFile() {
        var fileSize = largeFiles[0].size;
        var name = largeFiles[0].name;
        var mime = largeFiles[0].type;
        var chunkSize = 64 * 1024;
        var offset = 0;
        var sendProgress = 0;
        function readchunk(first) {
            var data = {};
            data.file_name = largeFiles[0].name;
            data.file_size = largeFiles[0].type;
            data.send_type = LARGE_FILE;

            var r = new FileReader();
            var blob = largeFiles[0].slice(offset, chunkSize + offset);
            r.onload = function(evt) {
                if (!evt.target.error) {
                    offset += chunkSize;
                    console.log("Sending: " + (offset / fileSize) * 100 + "%");
                    setLargeFileMsg("Sending: " + (offset / fileSize) * 100 + "%");
                    if (offset >= fileSize) {
                    data.file = evt.target.result;
                        data.last = true;
                        data.mime = mime;
                        conn.send(data);
                            
                        console.log(evt.target.result)
                            console.log("Done reading file " + name + " " + mime);
                            setLargeFileMsg("Send Large File");
                            setNoticeMsg("Sent successfully: " + name + " " + mime);
                            setLargeFiles([]);
                            handleShow();
                            return;
                    }
                    else {      
                        data.file = evt.target.result;
                        data.last = false; 
                        data.mime = mime;
                        conn.send(data);             
                        // conn.send(evt.target.result);
                    }               
                } else {
                    console.log("Read error: " + evt.target.error);
                    return; 
                }
                readchunk();
            };
            r.readAsArrayBuffer(blob);
        }
        readchunk(Math.ceil(fileSize/chunkSize));
    }

    var receivedSize = 0;
    var recProgress = 0;
    var arrayToStoreChunks = [];
    var counterBytes = 0;

    function handleData(data) {
        receivedSize += data.file.byteLength;
        counterBytes = counterBytes + receivedSize;
        recProgress = (receivedSize / data.file_size) * 100;
        recProgress = parseFloat(recProgress + "" ).toFixed(2);
    
        arrayToStoreChunks.push(data.file); // pushing chunks in array
    
        if (recProgress > 0){
            var speed = formatBytes(counterBytes / 1000, 2) + "/s";
            var sdata = {};
            sdata.type = "progress_info";
            sdata.msg = recProgress; 
            sdata.speed = speed;
            console.log("Trying to send", sdata)
            sendMsg(sdata)
        }
        
        if (data.last) {
            setTimeout(function(){
                var speed = 0
                var sdata = {};
                sdata.type = "progress_info";
                sdata.msg = 100; 
                sdata.speed = 0;
                console.log("Trying to send",sdata)
                sendMsg(sdata)
            }, 500)
        
            const received = new Blob(arrayToStoreChunks);
            setLargeFileMsg("Send Large File");
            saveToDisk(arrayToStoreChunks.join(''), data.file_name, data.file_size, data.mime);
            arrayToStoreChunks = []; 
            recProgress=0;
            receivedSize=0;
        }
    };

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
       
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
       
        const i = Math.floor(Math.log(bytes) / Math.log(k));
       
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function saveToDisk(fileUrl, fileName, fileSize, mime) {
        var save = document.createElement('a');
        save.href = fileUrl;
        save.target = '_blank';
        save.download = fileName || fileUrl;
        save.addEventListener('click', (e) => {
            setTimeout(() => URL.revokeObjectURL(save.href));
        });
        save.click();
    }

    function sendFile() {
        let tm = addHour();
        let time = tm[0] + ":" + tm[1];
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                if (file.size  > 5 * 1024 * 1024) {
                    console.log("Large File");
                    setNoticeMsg("File: " + file.name + " is larger than 5MB. Please select Send Large File for sending this file!");
                    handleShow();
                    continue;
                }
                const blob = new Blob([files[i]], {type: file.type});
                let sendData = {
                    file: blob,
                    filename: file.name,
                    filetype: file.type,
                    send_type: SMALL_FILE,
                    send_id: user.id,
                    send_name: user.name,
                    send_username: user.username
                };
                conn.send(sendData);
                console.log("Sent: ", sendData);
                setChatMsg((chatMsg) => [...chatMsg, {"id": countId, "type": SEND_MSG, "msg": sendData, "time": time, "send_username": user.username, "file": true}]);
                countId++;
            }
            return true
        }
        return false
    }

    function sendMessage() {
        if (conn && conn.open) {
            let tm = addHour();
            let time = tm[0] + ":" + tm[1];
            if (sendMsg === undefined || sendMsg === null || onlySpaces(sendMsg)) {
                return
            }
            const blob = new Blob([sendMsg], {type: "text"});
            let sendData = {
                file: blob,
                filename: '',
                filetype: 'text',
                send_type: SMALL_FILE,
                send_id: user.id,
                send_name: user.name,
                send_username: user.username
            }
            conn.send(sendData);
            console.log("Sent: " + sendMsg);
            setChatMsg((chatMsg) => [...chatMsg, {"id": countId, "type": SEND_MSG, "msg": sendMsg, "time": time, "send_username": user.username, "file": false}]);
            countId++;
            setSendMsg('');
            document.getElementById("enter-msg").value = '';
        } else {
            console.log('Connection is closed');
        }
    }

    const FileIcon = () => {
        return <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-file-earmark-check" viewBox="0 0 16 16">
            <path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/>
            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
        </svg>
    }

    function search() {
        Axios.get(HOST + PORT + "/api/getActiveList").then((response) => {
            if (user) {
                let aList = response.data;
                let removeIdx = aList.findIndex(e => e.id === user.id);
                while (removeIdx !== -1) {
                    aList.splice(removeIdx, 1);
                    if (aList.length > 0) {
                        removeIdx = aList.findIndex(e => e.id === user.id);
                    }
                    else break;
                }
                let item = aList.filter(e => e.username === searchItem);
                setActiveList(item);
            }
            else {
                let item = response.data.filter(e => e.username === searchItem);
                setActiveList(item);
            }
        });
    }

    return (
        
        <section styles="background-color: #CDC4F9;" className="mw-100 mh-100">
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Notice</Modal.Title>
                </Modal.Header>
                <Modal.Body>{noticeMsg}</Modal.Body>
                <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                </Modal.Footer>
            </Modal>

        <div className="container py-5">
        <div className="row">
        <div className="col-md-12">
        <div className="card" id="chat3" styles="border-radius: 15px;">
        <div className="card-body">

            <div className="row">
                <div className="col-md-6 col-lg-5 col-xl-4 mb-4 mb-md-0">
                <div className="p-3">
                    <div className="d-flex justify-content-center">Username: {user && user.username}</div>
                    <div className="d-flex justify-content-center">Your Name: {user && user.name}</div>
                    <div className="d-flex justify-content-center">Your PeerID: {peer && peer.id}</div>
                    <div className="d-flex justify-content-center">{connId ? <p>Connected to {connId}</p> : null}</div>
                    <div className="input-group rounded mb-3 border">
                        <input type="search" className="form-control rounded" placeholder="Search username" aria-label="Search"
                        aria-describedby="search-addon" onChange={(e) => setSearchItem(e.target.value)}/>
                        <span className="input-group-text border-0" id="search-addon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                            </svg>
                        </span>
                    </div>

                    <div className="scroll" data-mdb-perfect-scrollbar="true" styles="position: relative; height: 600px">
                        {activeList && activeList.map((val) => {
                            return (
                                <div className="d-flex justify-content-between border-bottom border-top" id={val.id} onClick={(e) => handleConnectChat(e)}>
                                    <div className="d-flex flex-row" id={val.id}>
                                        <div className="pt-1" id={val.id}>
                                            <p className="fw-bold mb-0" id={val.id}>{val.name}</p>
                                            <p className="small text-muted" id={val.id}>Username: {val.username}</p>
                                        </div>
                                    </div>
                                    <div className="pt-1" id={val.id}>
                                        <span className="badge bg-danger rounded-pill float-end" id={val.id}>online</span>
                                    </div>
                                </div>
                            )
                        })}
                  </div>

                </div>
                </div>

                <div className="col-md-6 col-lg-7 col-xl-8">
                    <div className="card-header d-flex justify-content-between align-items-center p-3 border">
                        <h5 className="mb-0">Chat</h5>
                        <div className="d-flex justify-content-center">
                            <input type="text" className="form-control input-lg border" id="enter-peer-id" placeholder="Connect to PeerID" onChange={handleChangePeerInput} disabled={disableConnId}/>
                        </div>
                        <button type="button" className="btn btn-primary btn-sm" data-mdb-ripple-color="dark" onClick={handleConnect}>Connect</button>
                        <button type="button" className="btn btn-primary btn-sm" data-mdb-ripple-color="dark" onClick={handleDisconnect}>Disconnect</button>
                        <button type="button" className="btn btn-primary btn-sm" data-mdb-ripple-color="dark" onClick={handleLogout}>Logout</button>
                    </div>
                    <div className="pt-3 pe-3 scroll border" data-mdb-perfect-scrollbar="true" styles="position:relative; height: 600px">
                        {chatMsg && chatMsg.map((val) => {
                            return <div className={val.type === RECEIVE_MSG ? receiveBoxClass : sendBoxClass}>
                                        <div>
                                            <p id={val.id} onClick={(e) => saveFile(e)} className={val.type === RECEIVE_MSG ? receiveMsgClass : sendMsgClass} styles={val.type === RECEIVE_MSG ? receiveMsgStyle : ""}>
                                                <p id={val.id}>
                                                    <i>Sender:</i> <b>{val.type === RECEIVE_MSG ? val.send_username : <i>Me</i>}</b> 
                                                </p>
                                                {val.file ? <FileIcon /> : val.msg}
                                                {val.file ? <p id={val.id}>{val.msg.filename}</p> : null}
                                            </p>
                                            <p className={val.type === RECEIVE_MSG ? receiveTimeClass : sendTimeClass}>{val.time}</p>
                                        </div>
                                    </div>
                        })}
                        <div ref={bottomChatRef} />
                    </div>

                    <div className="input-group">
                        <input type="text" className="form-control input-lg border" id="enter-msg" placeholder="Enter messages" onKeyPress={handleEnter} onChange={handleChangeMsg}/>
                        <button className="input-group-text" id="basic-addon1" onClick={handleCallVideo}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video-fill" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/>
                            </svg>
                        </button>
                    </div>

                    <div className="custom-file border">
                        <input className="form-control" type="file" id="multiple-file" multiple onChange={handleFile}/>
                    </div>

                    <div className="custom-file">
                        <input type="file" className="custom-file-input" id="customFile" onChange={handleLargeFile}/>
                        <label className="custom-file-label" for="customFile">{largeFileMsg}</label>
                    </div>
                </div>
            </div>
        </div>
        </div>
        </div>
        </div>
        </div>

        <div className="container py-5" hidden={hideVidCall}>
        <div className="row">
        <div className="col-md-12">
        <div className="card" id="chat3" styles="border-radius: 15px;">
            <div className="d-flex justify-content-center">
                <div>
                    <video ref={ref => myVideo = ref} />
                </div>
                <div>
                    <video ref={ref => friendVideo = ref} />
                </div>
            </div>
        </div>
        </div>
        </div>
        </div>

        </section>
    );
}

export default Chat;

