import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function SupervisorForm() {
  const { siteId } = useParams()
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [supervisorData, setSupervisorData] = useState([])
  const token = localStorage.getItem("authToken");


  const [clientData, setClientData] = useState([...supervisorData]);
  const [newSupervisor, setNewSupervisor] = useState({
    name: "",
    email: "",
    address: "",
    phoneNo: "",
    password: "",
    role: "local", // Default role is local
    engineerId: "",
  });

  const supervisorHeading = [
    "S.No",
    "Name",
    "Email",
    "Address",
    "Phone number",
    "Role",
    "Action",
  ];
  const api = import.meta.env.VITE_API

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await axios.get(`${api}/supervisors/getsuppervisors?siteId=${siteId}&scope=local`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSupervisorData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Error fetching supervisors:", error);
      }
    };
    fetchSupervisors();
  }, [siteId, token, api]);


  useEffect(() => {
    const result = supervisorData.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, supervisorData]);

  const handleDelete = (index) => {
    const updatedData = clientData.filter((_, i) => i !== index);
    setClientData(updatedData);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  const handleSaveEditObject = (index, field, value) => {
    const updatedData = [...clientData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setClientData(updatedData);

    // Track the edited data
    setEditedData((prev) => ({
      ...prev,
      ...updatedData[index],
      [field]: value,
    }));

    setEditIndex(null);
  };

  const handleSaveRow = () => {
    console.log("Edited Data:", editedData); // Log all tracked edits
    setEditIndex(null); // End editing mode
  };
  const handleAddSupervisor = async () => {
    try {
      const response = await axios.post(
        `${api}/supervisors/create`,
        { ...newSupervisor, siteId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSupervisorData((prev) => [...prev, response.data]);
      setNewSupervisor({
        name: "",
        email: "",
        address: "",
        phoneNo: "",
        password: "",
        role: "local",
        engineerId: "",
      });
      setAddPopupOpen(false);
    } catch (error) {
      console.error("Error adding supervisor:", error);
    }
  };
  return (
    <>
      <main className="mastermain">
        <section className="mastersec">
          <div className="searchcon">
            <h1>Supervisor Management</h1>
            <div className="masterinpcon">
              <div className="searchbox">
                <input
                  type="search"
                  className="search"
                  placeholder="Search by Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <p>Search</p>
              </div>
              <div className="masterbtnscon">
                <p className="masteraddbtn">Upload</p>
                <p
                  className="masteraddbtn"
                  onClick={() => setAddPopupOpen(true)}
                >
                  Add
                </p>
              </div>
            </div>
          </div>
          <div className="tablecon">
            {filteredData.length > 0 ? (
              <table className="mastertable">
                <thead>
                  <tr className="labhead">
                    {supervisorHeading.map((header, index) => (
                      <th
                        className={`masterth ${header !== "Name" && header !== "PhoneNo" && header !== "S.No" && header !== "Action"
                            ? "hide-mobile"
                            : ""
                          }`}
                        key={index}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((supervisor, index) => (
                    <tr key={index}>
                      <td className="mastertd sl">{index + 1}</td>
                      {Object.keys(supervisor)
                        .slice(1, 8)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd ${field !== "name" && field !== "phoneNo"
                                ? "hide-mobile"
                                : ""
                              }`}
                            contentEditable={editIndex === index}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleSaveEditObject(
                                index,
                                field,
                                e.target.innerText
                              )
                            }
                          >
                            {supervisor[field]}
                          </td>
                        ))}
                      <td className="mastertd masteredit">
                        {editIndex === index ? (
                          <button onClick={handleSaveRow}>Save</button>
                        ) : (
                          <>
                            <p onClick={() => handleEdit(index)}>
                              <AiTwotoneEdit />
                            </p>
                            <p onClick={() => handleDelete(index)}>
                              <AiOutlineDelete />
                            </p>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No results found</p>
            )}
          </div>
        </section>
        {addPopupOpen && (
          <article className="masterpopupcon">
            <div className="masterpopupinner">
              <h1>Add New Supervisor</h1>
              <input
                type="text"
                placeholder="Name"
                value={newSupervisor.name}
                onChange={(e) =>
                  setNewSupervisor((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="email"
                placeholder="Email"
                value={newSupervisor.email}
                onChange={(e) =>
                  setNewSupervisor((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Address"
                value={newSupervisor.address}
                onChange={(e) =>
                  setNewSupervisor((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newSupervisor.phoneNo}
                onChange={(e) =>
                  setNewSupervisor((prev) => ({
                    ...prev,
                    phoneNo: e.target.value,
                  }))
                }
              />
              <input
                type="password"
                placeholder="Password"
                value={newSupervisor.password}
                onChange={(e) =>
                  setNewSupervisor((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
              
              <p
                className="mastersubmitbtn"
                onClick={handleAddSupervisor}
              >
                Add Supervisor
              </p>
              <p
                className="mastersubmitcancel"
                onClick={() => setAddPopupOpen(false)}
              >
                X
              </p>
            </div>
          </article>
        )}
      </main>
    </>
  );
}
