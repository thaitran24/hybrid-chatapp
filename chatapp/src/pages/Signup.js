import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import '../css/login.css'
import Axios from "axios";

const HOST = "http://localhost:";
const PORT = 8001;

function SignUp() {
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [name, setName] = useState();
    const [user, setUser] = useState();
    const [userState, setUserState] = useState(null);
    const [show, setShow] = useState(false);
    const [errMsg, setErrMsg] = useState();
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (userState) {
            navigate("/chat");
        }
    }, [userState])

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
            setUserState(true);
        }
    },[]);

    const handleRegister = (e) => {
        e.preventDefault();
        Axios.get(HOST + PORT + "/api/register", {
            params: {username: username, password: password, name: name}
        }).then((response) => {
            console.log("response: ", response.data);
            let data = response.data
            if (data.success === true) {
                localStorage.setItem('id', response.data.id);
                localStorage.setItem('name', response.data.name);
                setUser({
                    id: response.data.id,
                    name: response.data.name
                });
                setUserState(true);
            }
            else {
                setErrMsg(response.data.error);
                handleShow();
            }
        });
    }

    return (
    <div className="wrapper fadeInDown">
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Notice</Modal.Title>
            </Modal.Header>
            <Modal.Body>{errMsg}</Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>
        
        <div id="formContent">
        <form>
            <input type="text" id="login" className="fadeIn second" placeholder="Username" 
                onChange={(e) => setUsername(e.target.value)}/>
            <input type="password" id="password" className="fadeIn third" placeholder="Password" 
                onChange={(e) => setPassword(e.target.value)}/>
            <input type="text" id="name" className="fadeIn third" placeholder="Name" 
                onChange={(e) => setName(e.target.value)}/>
            <input type="submit" value="Register" onClick={(e) => {handleRegister(e)}}/>
        </form>
        </div>
    </div>
    );
}

export default SignUp;
