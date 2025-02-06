import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function SupervisorForm() {
  const { siteId } = useParams();
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [supervisorData, setSupervisorData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

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
  const api = import.meta.env.VITE_API;

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await request(
          "GET",
          `/supervisors/getsuppervisors?siteId=${siteId}&scope=local`
        );

        setSupervisorData(response);
        setFilteredData(response);
      } catch (error) {
        console.error("Error fetching supervisors:", error);
      }
    };
    fetchSupervisors();
  }, [siteId]);

  //search
  useEffect(() => {
    const result = supervisorData.filter(
      (item) =>
        item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, supervisorData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      console.log("uploded");
      handleUpload(file); // Call handleUpload with the selected file
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
      await request("POST", `/supervisors/upload?siteId=${siteId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const response = await request(
        "GET",
        `/supervisors/getsuppervisors?siteId=${siteId}&scope=local`
      );

      setSupervisorData(response);
      setFilteredData(response);

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
      await request(
        "PUT",
        `/supervisors/update/${editedData._id}?siteId=${siteId}`,
        editedData
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
      const response = await request(
        "POST",
        `/supervisors/create?siteId=${siteId}`,
        { ...newSupervisor, siteId }
      );

      setSupervisorData((prev) => [...prev, response]);
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
      await request(
        "DELETE",
        `/supervisors/deletesupervisor/${supervisor._id}?siteId=${siteId}`,
        {}
      );
      const updatedData = filteredData.filter((_, i) => i !== index);
      setFilteredData(updatedData);
    } catch (error) {
      console.error("Error deleting supervisor:", error);
    }
  };
  // ---------------------pop-up--------------------------------
  const [opn, setOpn] = useState(false);
  const [view, setView] = useState();

  const handleView = (item) => {
    setView(item);
    setOpn(true);
  };

  const [presentlab, setPresentLab] = useState([]);
  const [presentDetails, setPresentDetails] = useState([]);
  const [downloadBtn, setDownloadBtn] = useState(0);

  useEffect(() => {
    if (presentlab.length > 0) {
      setDownloadBtn(1);
    }
  }, [presentlab]);

  const [selectAll, setSelectAll] = useState(false);
  useEffect(() => {
    if (presentlab.length === 0) {
      setSelectAll(false);
    } else if (presentlab.length === filteredData.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [presentlab, filteredData]);

  const handleCheckboxChange = (e, worker) => {
    if (!worker) {
      console.error("Worker is undefined!");
      return;
    }

    if (e.target.checked) {
      setPresentLab((prev) => [...prev, worker._id]);
      setPresentDetails((prev) => [...prev, worker]);
    } else {
      setPresentLab((prev) => prev.filter((id) => id !== worker._id));
      setPresentDetails((prev) => prev.filter((w) => w._id !== worker._id));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all workers
      const allIds = filteredData.map((worker) => worker._id);
      setPresentLab(allIds);
      setPresentDetails(filteredData);
      setSelectAll(true);
    } else {
      // Deselect all workers
      setPresentLab([]);
      setPresentDetails([]);
      setSelectAll(false);
    }
  };

  return (
    <>
      <main className="mastermain">
        {opn && (
          <div
            className="view-pg"
            onClick={() => {
              setOpn(false);
            }}
          >
            <div className="view-card">
              {view ? (
                <div>
                  <ul>
                    {view && (
                      <>
                        <li>
                          <strong>Name:</strong> <p>{view.name}</p>
                        </li>
                        <li>
                          <strong>Email:</strong> <p>{view.email}</p>
                        </li>
                        <li>
                          <strong>Address:</strong> <p>{view.address}</p>
                        </li>
                        <li>
                          <strong>PhoneNo:</strong> <p>{view.phoneNo}</p>
                        </li>
                        <li>
                          <strong>Role:</strong> <p>{view.role}</p>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              ) : (
                <p>No details available.</p>
              )}
            </div>
          </div>
        )}
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
                {presentlab.length > 0 && (
                  <p className="masteraddbtn">Download</p>
                )}
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
                        className={`masterth ${
                          header !== "Name" &&
                          header !== "phoneNo" &&
                          header !== "S.No" &&
                          header !== "Action"
                            ? "hide-mobile"
                            : ""
                        }`}
                        key={index}
                      >
                        {header}
                      </th>
                    ))}
                    <th className="masterth">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((supervisor, index) => (
                    <tr key={index} onClick={() => handleView(supervisor)}>
                      <td className="mastertd sl">{index + 1}</td>
                      {Object.keys(supervisor)
                        .slice(1, 8)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd 
                              ${
                                field !== "name" && field !== "phoneNo"
                                  ? "hide-mobile"
                                  : ""
                              } 
                              ${
                                field === "password" || field === "engineerId"
                                  ? "hide"
                                  : ""
                              }`}
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
                            <p
                              onClick={() => handleDelete(index)}
                              className="del"
                            >
                              <AiOutlineDelete />
                            </p>
                            
                          </>
                        )}
                      </td>
                      <td className="masterSelect"><input type="checkbox" onChange={(e) => handleCheckboxChange(e, supervisor)} checked={presentlab.includes(supervisor._id)}/></td>
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
                  setNewSupervisor((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
              <input
                type="email"
                placeholder="Email"
                value={newSupervisor.email}
                onChange={(e) =>
                  setNewSupervisor((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
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

              <p className="mastersubmitbtn" onClick={handleAddSupervisor}>
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
