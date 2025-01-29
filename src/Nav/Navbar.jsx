import "../App.css";
import "./Navbar.css";
import Sidemenu from "./Sidemenu";

import logo from "../assets/logo.png";
import { LuMenu } from "react-icons/lu";
import { IoClose } from "react-icons/io5";

import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

export default function Navbar({ companyLogo }) {
  const location = useLocation();
  const { companyName, siteId } = useParams();
  const [ddopn, setddopn] = useState(false);
  const [inlogin, setinlogin] = useState(true);
  const [sidemenuval, setsidemenuval] = useState(null);

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
        <div
          className="logoutbtn"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          Logout
        </div>
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
