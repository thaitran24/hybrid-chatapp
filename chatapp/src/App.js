import React, { useState, useEffect } from 'react';
import { Route, Link, Routes } from 'react-router-dom';
import Chat from './pages/Chat';
import Login from './pages/Login';
import SignUp from './pages/Signup';

function App() {
    return (
        <>
            <Routes>
                <Route exact path="/" element={<Login />}/>
                <Route exact path="/chat" element={<Chat />}/>
                <Route exact path="/signup" element={<SignUp />}/>
            </Routes>
        </>
  );
}

export default App;
