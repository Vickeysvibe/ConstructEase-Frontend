import React from "react";
import "./Login.css";
import loginimg from "../assets/login.png";
import { Link } from "react-router-dom";
import Navbar from "../Nav/Navbar";
import OuterNav from "../Nav/OuterNav";

const Login = () => {
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
            <form>
              <input type="text" placeholder="UserName" />
              <input type="text" placeholder="Password" />
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
