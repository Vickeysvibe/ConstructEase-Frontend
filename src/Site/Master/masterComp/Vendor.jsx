import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import axios from "axios";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function VendorForm() {
  const { siteId } = useParams();
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [vendorData, setVendorData] = useState([]);
  const [newVendor, setNewVendor] = useState({
    name: "",
    ownerName: "",
    address: "",
    gstIn: "",
    phoneNo: "",
    siteId: "",
  });

  // const vendorData = [
  //   {
  //     name: "Vendor One",
  //     ownerName: "John Doe",
  //     address: "123 Main St, City",
  //     gstIn: "GST123456789",
  //     phoneNo: "123-456-7890",
  //     siteId: "SITE001",
  //   },
  //   {
  //     name: "Vendor Two",
  //     ownerName: "Jane Smith",
  //     address: "456 Elm St, City",
  //     gstIn: "GST987654321",
  //     phoneNo: "987-654-3210",
  //     siteId: "SITE002",
  //   },
  //   // Add more vendors as needed
  // ];

  const [clientData, setClientData] = useState([]);

  const vendorHeading = [
    "S.No",
    "Name",
    "OwnerName",
    "Address",
    "GSTIN",
    "PhoneNo",
    "SiteId",
    "Action",
  ];

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await request(
          "GET",
          `/vendors/getAllvendor?siteId=${siteId}`
        );
        setVendorData(response);
        setFilteredData(response);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };
    fetchVendors();
  }, []);

  // Search Functionality (Search by Name Only)
  useEffect(() => {
    if (Array.isArray(vendorData)) {
      const result = vendorData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(result);
    } else {
      console.error("vendor is not an array");
    }
  }, [searchTerm, vendorData]);
  console.log(vendorData);

  // const handleDelete = async (vendorId) => {
  //   try {
  //     console.log('del')
  //     await axios.delete(`${api}/vendors/${vendorId}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     setClientData(clientData.filter((vendor) => vendor._id !== vendorId));
  //   } catch (error) {
  //     console.error("Error deleting vendor:", error);
  //   }
  // };
  const handleDelete = async (index) => {
    try {
      const vendor = filteredData[index];
      await request(
        "DELETE",
        `/vendors/deletevendors/${vendor._id}?siteId=${siteId}`,
        {}
      );
      const updatedData = filteredData.filter((_, i) => i !== index);
      setFilteredData(updatedData);
    } catch (error) {
      console.error("Error deleting supervisor:", error);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditedData({ ...filteredData[index] });
  };

  const handleSaveRow = async () => {
    console.log("exe");
    if (!editedData._id) {
      console.error("No vendor selected for update");
      return;
    }

    console.log(editedData);
    try {
      const response = await request(
        "PUT",
        `/vendors/update-vendor/${editedData._id}?siteId=${siteId}`,
        editedData
      );

      if (response.status === 200) {
        // Update vendorData and filteredData
        setVendorData((prevData) =>
          prevData.map((vendor) =>
            vendor._id === editedData._id
              ? { ...vendor, ...editedData }
              : vendor
          )
        );

        setFilteredData((prevData) =>
          prevData.map((vendor) =>
            vendor._id === editedData._id
              ? { ...vendor, ...editedData }
              : vendor
          )
        );

        // Reset editing state
        setEditIndex(null);
        setEditedData({});
      } else {
        console.error("Failed to update vendor:", response);
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
    }
  };

  // Ensure that edits are applied correctly to the editedData
  const handleSaveEditObject = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setUploadMessage("No file selected.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await request(
        "POST",
        `/vendors/upload-vendor?siteId=${siteId}`,
        formData,
        {
          "Content-Type": "multipart/form-data",
        }
      );

      setUploadMessage(response.data.message || "File uploaded successfully.");
      setVendorData((prevData) => [...prevData, ...response.vendors]);
      setFilteredData((prevData) => [...prevData, ...response.vendors]);
    } catch (error) {
      setUploadMessage("Error uploading file.");
      console.error("Error uploading file:", error);
    }
  };

  const handleAddVendor = async () => {
    if (
      !newVendor.name ||
      !newVendor.ownerName ||
      !newVendor.address ||
      !newVendor.gstIn ||
      !newVendor.phoneNo
    ) {
      setUploadMessage("Please fill in all the fields.");
      return;
    }

    try {
      const response = await request(
        "POST",
        `/vendors/createvendor?siteId=${siteId}`,
        newVendor
      );

      setUploadMessage("added");
      setVendorData((prevData) => [...prevData, response.vendor]);
      setFilteredData((prevData) => [...prevData, response.vendor]);
      setNewVendor({
        name: "",
        ownerName: "",
        address: "",
        gstIn: "",
        phoneNo: "",
        siteId: "",
      });
      setAddPopupOpen(false);
    } catch (error) {
      console.error("Error adding vendor:", error);
      setUploadMessage("Error adding vendor.");
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
    if(presentlab.length>0){
        setDownloadBtn(1)
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
                        <strong>OwnerName:</strong> <p>{view.ownerName}</p>
                      </li>
                      <li>
                        <strong>Address:</strong> <p>{view.address}</p>
                      </li>
                      <li>
                        <strong>GSTin:</strong> <p>{view.gstIn}</p>
                      </li>
                      <li>
                        <strong>PhoneNo:</strong> <p>{view.phoneNo}</p>
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
            <h1>Vendor Management</h1>
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
                  onChange={handleFileUpload}
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
                {presentlab.length > 0 && <p className="masteraddbtn">Download</p>}
              </div>
            </div>
          </div>
          <div className="tablecon">
            {filteredData.length > 0 ? (
              <table className="mastertable">
                <thead>
                  <tr className="labhead">
                    {vendorHeading.map((header, index) => (
                      <th
                        className={`masterth ${
                          header !== "S.No" &&
                          header !== "Name" &&
                          header !== "OwnerName" &&
                          header !== "Action"
                            ? "hide-mobile"
                            : ""
                        } 
                        ${header === "SiteId" ? "hide" : ""}`}
                        key={index}
                      >
                        {header}
                      </th>
                    ))}
                    <th className="masterth"><input type="checkbox" checked={selectAll} onChange={handleSelectAll}/></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((vendor, index) => (
                    <tr key={index} onClick={() => handleView(vendor)}>
                      <td className="mastertd sl">{index + 1}</td>
                      {Object.keys(vendor)
                        .slice(1, 6)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd ${
                              field !== "name" && field !== "ownerName"
                                ? "hide-mobile"
                                : ""
                            }`}
                            contentEditable={editIndex === index}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleSaveEditObject(field, e.target.innerText)
                            }
                          >
                            {vendor[field]}
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
                            <p onClick={() => handleDelete(index)} className="del">
                              <AiOutlineDelete />
                            </p>
                            
                          </>
                        )}
                      </td>
                      <td className="masterSelect"><input type="checkbox" onChange={(e) => handleCheckboxChange(e, vendor)} checked={presentlab.includes(vendor._id)}/></td>
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
              <h1>Add New Vendor</h1>
              <input
                type="text"
                placeholder="Name"
                value={newVendor.name}
                onChange={(e) =>
                  setNewVendor((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Owner Name"
                value={newVendor.ownerName}
                onChange={(e) =>
                  setNewVendor((prev) => ({
                    ...prev,
                    ownerName: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Address"
                value={newVendor.address}
                onChange={(e) =>
                  setNewVendor((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="GSTIN"
                value={newVendor.gstIn}
                onChange={(e) =>
                  setNewVendor((prev) => ({
                    ...prev,
                    gstIn: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newVendor.phoneNo}
                onChange={(e) =>
                  setNewVendor((prev) => ({
                    ...prev,
                    phoneNo: e.target.value,
                  }))
                }
              />

              <p className="mastersubmitbtn" onClick={handleAddVendor}>
                Add Vendor
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
