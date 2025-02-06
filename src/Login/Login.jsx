import React, { useState } from "react";
import "./Login.css";
import loginimg from "../assets/login.png";
import { useNavigate } from "react-router-dom";
import OuterNav from "../Nav/OuterNav";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
const Login = ({LoggedIn}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API;

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload on form submission
    try {
      const response = await axios.post(`${api}/auth/login`, {
        email,
        password,
      });
      const { token, user, role } = response.data;
      console.log(response.data);

      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userData", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <>
      <OuterNav />
      <div className="login-pg">
        <div className="nav">
          <br />
          <br />
        </div>
        <div className="login">
          <div className="image">
            <img className="immg" src={loginimg} alt="Login-Img" />
          </div>
          <div className="form">
            <header>
              <h1>Login</h1>
            </header>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" onClick={LoggedIn}>
                Submit
              </button>
              
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
