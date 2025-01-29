import "../App.css";
import "./Navbar.css";
import logo from "../assets/logo.png";

const OuterNav = ({ companyLogo, companyName }) => {
  return (
    <nav>
      <div className="navcon">
        <div className="logocon">
          <img src={companyLogo || logo} alt="Logo" />
          <p>{companyName || "ConstructEaze"}</p>
        </div>

        <div
          className="logoutbtn"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          Logout
        </div>
      </div>
    </nav>
  );
};
export default OuterNav;
