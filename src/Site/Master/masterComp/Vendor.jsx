import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import axios from "axios";
import { useParams } from "react-router-dom";



export default function VendorForm() {
  const { siteId } = useParams()
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
  const token = localStorage.getItem("authToken");
  const api = import.meta.env.VITE_API


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
        const response = await axios.get(`${api}/vendors/getAllvendor?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setVendorData(response.data)
        setFilteredData(response.data)
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
  console.log(vendorData)

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
      await axios.delete(`${api}/vendors/deletevendors/${vendor._id}`, {
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

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditedData({ ...filteredData[index] });
  };



  const handleSaveRow = async () => {
    console.log('exe')
    if (!editedData._id) {
      console.error("No vendor selected for update");
      return;
    }

    console.log(editedData)
    try {
      // Send updated data to API
      console.log('update')
      const response = await axios.put(
        `${api}/vendors/update-vendor/${editedData._id}?siteId=${siteId}`,
        editedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Update vendorData and filteredData
        setVendorData((prevData) =>
          prevData.map((vendor) =>
            vendor._id === editedData._id ? { ...vendor, ...editedData } : vendor
          )
        );

        setFilteredData((prevData) =>
          prevData.map((vendor) =>
            vendor._id === editedData._id ? { ...vendor, ...editedData } : vendor
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
      const response = await axios.post(
        `${api}/vendors/upload-vendor?siteId=${siteId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUploadMessage(response.data.message || "File uploaded successfully.");
      setVendorData((prevData) => [...prevData, ...response.data.vendors]);
      setFilteredData((prevData) => [...prevData, ...response.data.vendors]);
    } catch (error) {
      setUploadMessage("Error uploading file.");
      console.error("Error uploading file:", error);
    }
  };





  return (
    <>
      <main className="mastermain">
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
                        className={`masterth ${header !== "S.No" && header !== "Name" && header !== "OwnerName" && header !== "Action" ? "hide-mobile" : "" } 
                        ${(header === "SiteId") ? "hide" : ""}`
                          
                        }
                        key={index}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((vendor, index) => (
                    <tr key={index}>
                      <td className="mastertd sl">{index + 1}</td>
                      {Object.keys(vendor)
                        .slice(1, 6)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd ${field !== "name" && field !== "ownerName"
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
              <input
                type="text"
                placeholder="Site ID"
                value={newVendor.siteId}
                onChange={(e) =>
                  setNewVendor((prev) => ({
                    ...prev,
                    siteId: e.target.value,
                  }))
                }
              />
              <p
                className="mastersubmitbtn"
                onClick={() => {
                  setClientData((prev) => [...prev, newVendor]);
                  setNewVendor({
                    name: "",
                    ownerName: "",
                    address: "",
                    gstIn: "",
                    phoneNo: "",
                    siteId: "",
                  });
                  setAddPopupOpen(false);
                }}
              >
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
