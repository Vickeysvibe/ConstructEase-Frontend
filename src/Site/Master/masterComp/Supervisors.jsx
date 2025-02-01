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
  const [supervisorData, setSupervisorData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const token = localStorage.getItem("authToken");


  const [clientData, setClientData] = useState([...supervisorData]);
  const [newSupervisor, setNewSupervisor] = useState({
    name: "",
    email: "",
    address: "",
    phoneNo: "",
    password: "",
    role: "local", // Default role is local
  });

  const supervisorHeading = [
    "S.No",
    "Name",
    "Email",
    "Address",
    "phoneNo",
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

  //search
  useEffect(() => {
    const result = supervisorData.filter((item) =>
      item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, supervisorData]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      console.log('uploded')
      handleUpload(file);  // Call handleUpload with the selected file
    }
  };

  const handleUpload = async (file) => {
    if (!file) {
      console.error("No file selected");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${api}/supervisors/upload?siteId=${siteId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const response = await axios.get(`${api}/supervisors/getsuppervisors?siteId=${siteId}&scope=local`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSupervisorData(response.data);
      setFilteredData(response.data);

      alert("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditedData({ ...filteredData[index] });
  };

  const handleSaveEditObject = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveRow = async () => {
    if (!editedData._id) {
      console.error("No supervisor selected for update");
      return;
    }

    try {
      await axios.put(
        `${api}/supervisors/update/${editedData._id}`,
        editedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSupervisorData((prev) =>
        prev.map((supervisor) =>
          supervisor._id === editedData._id ? editedData : supervisor
        )
      );

      setFilteredData((prev) =>
        prev.map((supervisor) =>
          supervisor._id === editedData._id ? editedData : supervisor
        )
      );

      setEditIndex(null);
    } catch (error) {
      console.error("Error updating supervisor:", error);
    }
  };



  // const handleSaveRow = () => {
  //   console.log("Edited Data:", editedData); // Log all tracked edits
  //   setEditIndex(null); // End editing mode
  // };
  const handleAddSupervisor = async () => {
    try {
      const response = await axios.post(
        `${api}/supervisors/create?siteId=${siteId}`,
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
      });
      setAddPopupOpen(false);
    } catch (error) {
      console.error("Error adding supervisor:", error);
    }
  };

  const handleDelete = async (index) => {
    try {
      const supervisor = filteredData[index];
      await axios.delete(`${api}/supervisors/deletesupervisor/${supervisor._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = filteredData.filter((_, i) => i !== index);
      setFilteredData(updatedData);
    } catch (error) {
      console.error("Error deleting supervisor:", error);
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

                <input
                  type="file"
                  id="file-upload"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="client-upload-button">
                  Upload
                </label>
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
                        className={`masterth ${header !== "Name" && header !== "phoneNo" && header !== "S.No" && header !== "Action"
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
                            className={`mastertd 
                              ${field !== "name" && field !== "phoneNo" ? "hide-mobile" : ""} 
                              ${(field === "password" || field === "engineerId") ? "hide" : ""}`}
                            
                            contentEditable={editIndex === index}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleSaveEditObject(field, e.target.innerText)
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
