import React, { useState } from "react";
import "./Login.css";
import loginimg from "../assets/login.png";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Nav/Navbar";
import OuterNav from "../Nav/OuterNav";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API

  const handleSubmit = async (e) => {
    e.preventDefault();
    const login = async (email, password) => {
      const api = import.meta.env.VITE_API
      try {

        const response = await axios.post(`${api}/auth/login`, {
          email,
          password,
        });
        const { token, user, role } = response.data;

        localStorage.setItem("authToken", token);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userData", JSON.stringify(user));

      } catch (err) {
        setError(err.response?.data?.message || "Something went wrong.");
      }

    }
   
    navigate('dashboard')

  };

  return (
    <>
      <OuterNav />
      <div className="login-pg">
        {/* Nav */}
        <div className="nav">
          <br />
          <br />
        </div>
        {/* content */}
        <div className="login">
          <div className="image">
            <img className="immg" src={loginimg} alt="Login-Img" />
          </div>
          {/* Form */}
          <div className="form">
            <header>
              <h1>Login</h1>
            </header>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="UserName" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </form>
            <Link to={"/dashboard"}>
              <button>Submit</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
