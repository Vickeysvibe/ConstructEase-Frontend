import "./Home.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";



// Icons
import { FiMenu } from "react-icons/fi";
import { MdOutlineLocationOn } from "react-icons/md";
import { GoArrowUpRight } from "react-icons/go";
import { IoClose } from "react-icons/io5";
import { IoMdEye } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";

// Images
import EgSite1 from "../assets/Eg-Site.png";
import EgSite2 from "../assets/Eg-Site1.png";
import EgSite3 from "../assets/Eg-Site2.png";
import Navbar from "../Nav/Navbar";
import OuterNav from "../Nav/OuterNav";
const api = import.meta.env.VITE_API


export default function Home({LoggedOut,Added}) {
  const [content, setContent] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuContent, setAddContent] = useState(0);
  const [expandedSupervisorId, setExpandedSupervisorId] = useState(null);
  const [file, setFile] = useState(null);
  const [cardsData, setCardsData] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [supervisorsData, setSupervisorsData] = useState([]);
  const [supervisorData, setSupervisorData] = useState({
    name: "",
    email: "",
    phoneNo: "",
    address: "",
    password: "",
  });
  useEffect(() => {
    const fetchSites = async () => {

      try {
        const token = localStorage.getItem("authToken");
        const role = localStorage.getItem("userRole");
        setUserRole(role);
        if (!token) {
          console.error('token expired')
        }

        const response = await axios.get(`${api}/sites/getallsites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { sites } = response.data;
        setCardsData(sites);
        if (role === "Engineer") {
          const supervisorsResponse = await axios.get(`${api}/supervisors/getGlobalSupervisors`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setSupervisorsData(supervisorsResponse.data);
        }



      } catch (error) {
        console.error("Error fetching sites:", error);
      }


    }
    fetchSites();
  }, []);

  const validateInputs = () => {
    const { name, email, phoneNo, password } = supervisorData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10,}$/;

    if (!name || !email || !phoneNo || !password) {
      toast.error("All fields are required!");
      return false;
    }
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format!");
      return false;
    }
    if (!phoneRegex.test(phoneNo)) {
      toast.error("Phone number must be at least 10 digits!");
      return false;
    }
    return true;
  };
  const handleAddSupervisor = async () => {
    if (!validateInputs()) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Token expired");
        return;
      }

      const response = await axios.post(
        `${api}/supervisors/create-global`,
        {
          ...supervisorData,
          role: "global",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Supervisor added successfully:", response.data);

      const updatedSupervisors = await axios.get(
        `${api}/supervisors/getGlobalSupervisors`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSupervisorsData(updatedSupervisors.data);

      setMenuOpen(false);
      setAddContent(0);
      setSupervisorData({ name: "", email: "", phoneNo: "", password: "" });
    } catch (error) {
      console.error("Error adding supervisor:", error);
    }
  };

  const handleAddSite = async () => {
    console.log('running')
    if (!file) {
      toast.error("Please upload a site image!");
      return;
    }

    const siteName = document.querySelector(".menu-superadd-input[placeholder='Site Name']").value;
    const siteLocation = document.querySelector(".menu-superadd-input[placeholder='Site Location']").value;

    if (!siteName || !siteLocation) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Token expired");
        return;
      }

      const formData = new FormData();
      formData.append("siteName", siteName);
      formData.append("siteAddress", siteLocation);
      formData.append("image", file);

      const response = await axios.post(`${api}/sites/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Site added successfully!");

      const updatedSites = await axios.get(`${api}/sites/getallsites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCardsData(updatedSites.data.sites);

      setMenuOpen(false);
      setAddContent(0);
      setFile(null);
    } catch (error) {
      console.error("Error adding site:", error);
      toast.error("Failed to add site!");
    }
    
  };



  // const cardsData = [
  //   {
  //     name: "ABC Apartment",
  //     location: "11, 1st cross, Chennai, Tamilnadu",
  //     img: EgSite1,
  //   },
  //   {
  //     name: "XYZ Towers",
  //     location: "22, 2nd cross, Bangalore, Karnataka",
  //     img: EgSite3,
  //   },
  //   {
  //     name: "LMN Residency",
  //     location: "33, 3rd cross, Hyderabad, Telangana",
  //     img: EgSite2,
  //   },
  //   {
  //     name: "PQR Villas",
  //     location: "44, 4th cross, Mumbai, Maharashtra",
  //     img: EgSite1,
  //   },
  // ];

  // const supervisorsData = [
  //   {
  //     id: 1,
  //     name: "Suresh Krishna",
  //     email: "sureshkrishna@gmail.com",
  //     phone: "9090909090",
  //   },
  //   {
  //     id: 2,
  //     name: "Rajesh Kumar",
  //     email: "rajeshkumar@gmail.com",
  //     phone: "8080808080",
  //   },
  //   {
  //     id: 3,
  //     name: "Priya Singh",
  //     email: "priyasingh@gmail.com",
  //     phone: "7070707070",
  //   },
  //   {
  //     id: 4,
  //     name: "Anita Sharma",
  //     email: "anitasharma@gmail.com",
  //     phone: "6060606060",
  //   },
  //   {
  //     id: 5,
  //     name: "Vivek Agarwal",
  //     email: "vivekagarwal@gmail.com",
  //     phone: "5050505050",
  //   },
  // ];

  const toggleSupervisorDetails = (id) => {
    setExpandedSupervisorId(expandedSupervisorId === id ? null : id);
  };


 const handlecreate=()=>{
  handleAddSite();
  Added();
 }
 const handlecreateSup=()=>{
  handleAddSupervisor()
  Added()
 }
  return (
    <>
      <OuterNav />
      {/* --------------------------------------------------------------Add-function------------------------------------------------ */}
      {menuOpen && (
        <div className="home-menu-container">
          {menuContent === 1 ? (
            <div className="menu-addsuper-con">
              <header>
                <p className="menu-superadd-txt">New Site</p>
                <p
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setAddContent(0);
                  }}
                >
                  <IoClose />
                </p>
              </header>
              <label className="menu-superadd-label">Site Image</label>
              <div className="menu-siteadd-filecon">
                {!file && (
                  <p className="menu-siteadd-file-txt">
                    <MdOutlineFileUpload />
                  </p>
                )}
                <input
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                  }}
                  className="menu-siteadd-file"
                  type="file"
                  id="file-upload"
                />
                {file && (
                  <img
                    className="menu-siteadd-img"
                    src={URL.createObjectURL(file)}
                    alt="Uploaded site"
                  />
                )}
              </div>
              <label className="menu-superadd-label">Name</label>
              <input
                type="text"
                className="menu-superadd-input"
                placeholder="Site Name"
              />
              <label className="menu-superadd-label">Location</label>
              <input
                type="text"
                className="menu-superadd-input"
                placeholder="Site Location"
              />
              <p className="menu-superadd-btn" onClick={handlecreate} >Create</p>
              <p className="menu-superadd-sub">Process to Add new Site.</p>
            </div>
          ) : (
            // -----------------------------------------------------------Add-supervisors-----------------------------------
            <div className="menu-addsuper-con">
              <header>
                <p className="menu-superadd-txt">New Supervisor</p>
                <p
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setAddContent(0);
                  }}
                >
                  <IoClose />
                </p>
              </header>
              <label className="menu-superadd-label">Name</label>
              <input
                type="text"
                className="menu-superadd-input"
                placeholder="Supervisor Name"
                value={supervisorData.name}
                onChange={(e) =>
                  setSupervisorData({ ...supervisorData, name: e.target.value })
                }
              />
              <label className="menu-superadd-label">Email</label>
              <input
                type="text"
                className="menu-superadd-input"
                placeholder="Supervisor Mail"
                value={supervisorData.email}
                onChange={(e) =>
                  setSupervisorData({ ...supervisorData, email: e.target.value })
                }
              />
              <label className="menu-superadd-label">Address</label>
              <input
                type="text"
                className="menu-superadd-input"
                placeholder="Supervisor Address"
                value={supervisorData.address}
                onChange={(e) =>
                  setSupervisorData({ ...supervisorData, address: e.target.value })
                }
              />
              <label className="menu-superadd-label">Contact</label>
              <input
                type="text"
                className="menu-superadd-input"
                placeholder="Supervisor Contact"
                value={supervisorData.phoneNo}
                onChange={(e) =>
                  setSupervisorData({ ...supervisorData, phoneNo: e.target.value })
                }
              />
              <label className="menu-superadd-label">Password</label>
              <input
                type="text"
                className="menu-superadd-input"
                placeholder="Set Password"
                value={supervisorData.password}
                onChange={(e) =>
                  setSupervisorData({
                    ...supervisorData,
                    password: e.target.value,
                  })
                }
              />
              <p onClick={handlecreateSup} className="menu-superadd-btn">Create</p>
              <p className="menu-superadd-sub">
                Process to Add new Global Supervisor.
              </p>
            </div>
          )}
        </div>
      )}
      {/* ----------------------------------------------Dashboard---------------------------------------------------- */}
      <main className="home-main">
        {content ? (
          <section className="home-cards-container">
            {cardsData.map((card, index) => (
              <div className="home-card" key={index}>
                <div className="home-card-img-container">
                  <img
                    className="home-card-img"
                    src={card.img || EgSite1}
                    alt={`${card.siteName} Image`}
                  />
                  <div className="home-card-img-overlay"></div>
                </div>
                <div className="home-card-info-container">
                  <p className="home-card-info-name">{card.siteName}</p>
                  <p className="home-card-info-location">
                    <span className="location-icon">
                      <MdOutlineLocationOn />
                    </span>
                    {card.siteAddress}
                  </p>
                  <Link to={`/Company/${card._id}/master/client`}>
                    <p className="home-card-view">
                      <GoArrowUpRight />
                    </p>
                  </Link>
                </div>
              </div>
            ))}
            <div className="addnew-con">
              <p
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setAddContent(1);
                }}
                className="home-addnewsite-btn"
              >
                Add Site +
              </p>
            </div>
          </section>
        ) : (
          <section className="home-super-container">
            <p className="super-head">
              Global Supervisor
              <span
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setAddContent(2);
                }}
                className="super-addbtn"
              >
                +
              </span>
            </p>
            {supervisorsData.map((supervisor, index) => (
              <div className="home-supervisors" key={index}>
                <p className="super-count">{index + 1}</p>
                <div className="super-info-container">
                  <p className="super-name">{supervisor.name}</p>
                  <p className="super-mail">{supervisor.email}</p>
                  <p className="super-ph">{supervisor.phoneNo}</p>
                  {expandedSupervisorId === supervisor._id && (
                    <p className="super-ph">Other Details...</p>
                  )}
                </div>
                <p
                  onClick={() => toggleSupervisorDetails(supervisor._id)}
                  className="home-card-view home-super-view"
                >
                  {expandedSupervisorId === supervisor.id ? (
                    <IoClose />
                  ) : (
                    <IoMdEye />
                  )}
                </p>
              </div>
            ))}
          </section>
        )}
        <footer className="home-footer">
          <p onClick={() => setContent(true)} className={`footer-option ${content ? "footer-option-selected" : ""}`}>Sites</p>
          {userRole === "Engineer" && "|"}
          {userRole === "Engineer" && (
            <p onClick={() => setContent(false)} className={`footer-option ${content ? "" : "footer-option-selected"}`}>
              Supervisors
            </p>
          )}
        </footer>
      </main>
    </>
  );
}
