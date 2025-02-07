import "../App.css";
import "./Navbar.css";
import Sidemenu from "./Sidemenu";

import logo from "../assets/logo.png";
import { LuMenu } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
const api = import.meta.env.VITE_API
import axios from "axios";



import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

export default function Navbar({ companyLogo }) {
  const location = useLocation();
  const { companyName, siteId } = useParams();
  console.log(siteId);
  const [ddopn, setddopn] = useState(false);
  const [inlogin, setinlogin] = useState(true);
  const [sidemenuval, setsidemenuval] = useState(null);
  const userRole=localStorage.getItem('userRole');

  const Navlinks = [
    { title: "Master", link: `/${companyName}/${siteId}/master/client` },
    {
      title: `Attendance`,
      link: `/${companyName}/${siteId}/attendance/labour`,
    },
    {
      title: `Purchase Management`,
      link: `/${companyName}/${siteId}/purchase/order`,
    },
    { title: `Site Activity`, link: `/${companyName}/${siteId}/activity/todo` },
    {
      title: `Report Generation`,
      link: `/${companyName}/${siteId}/report/labourwise`,
    },
  ];

  const handleCheckOut = async (card) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("No authentication token found. Please log in.");
      return;
    }
  
    const apiEndpoint = `${api}/auth/checkout?siteId=${siteId}`;
    console.log("API Endpoint:", apiEndpoint);
  
    try {
      const response = await axios.post(apiEndpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      console.log("Check-out Response:", response);
      alert(response.data.message || "Check-Out successful!");
    } catch (error) {
      console.error("Check-out Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "An error occurred.");
    }
  };
  

  useEffect(() => {
    const excludedPaths = ["/", "/login", "/dashboard"];
    setinlogin(excludedPaths.some((path) => location.pathname.includes(path)));
  }, [location.pathname]);

  return (
    <nav>
      <div className="navcon">
        <div className="logocon">
          <img src={companyLogo || logo} alt="Logo" />
          <p>{companyName || "ConstructEaze"}</p>
        </div>
        {inlogin && (
          <div className="navlinkscon">
            {Navlinks.map((val, key) => (
              <Link
                key={key}
                to={val.link}
                onClick={() => setsidemenuval(key)}
                className={`navlinks ${
                  location.pathname.includes(val.link.split("/")[3])
                    ? "active"
                    : ""
                }`}
              >
                {val.title}
              </Link>
            ))}
          </div>
        )}
        <div className="sidebtn">

      {userRole == "Supervisor" &&(
        <div
          className="logoutbtn"
          
          onClick={() => {handleCheckOut(siteId)
            window.location.href = "/dashboard";
          }
          }


        >
          Checkout                
        </div>
      )}  
        <div
          className="logoutbtn"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          Logout
        </div></div>
        <p onClick={() => setddopn((prev) => !prev)} className="burgerbtn">
          {ddopn ? <IoClose /> : <LuMenu />}
        </p>
      </div>

      {ddopn && (
        <div className="navdropdown">
          {Navlinks.map((val, key) => (
            <Link
              key={key}
              onClick={() => {
                setddopn(false);
                setsidemenuval(key);
              }}
              to={val.link}
              className="navlinksdd"
            >
              {val.title}
            </Link>
          ))}
          <p
            style={{ color: "red" }}
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            Logout
          </p>
        </div>
      )}

      {inlogin && (
        <Sidemenu
          companyName={companyName}
          siteId={siteId}
          navlink={Navlinks[sidemenuval]}
        />
      )}
    </nav>
  );
}
