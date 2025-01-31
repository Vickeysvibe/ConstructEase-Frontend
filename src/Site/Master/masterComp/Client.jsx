import { AiTwotoneEdit, AiOutlineDelete } from "react-icons/ai";
import "../Master.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";


export default function ClientManagement() {
  const { companyName, siteId } = useParams();
  console.log(companyName, siteId);
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [clientData, setClientData] = useState([]);
  const [newClient, setNewClient] = useState({
    name: "",
    phoneNo: "",
    address: "",
    panGstNo: "",
    siteId: "",
  });

  const [editingIndex, setEditingIndex] = useState(null); // Track which card is being edited
  const [editedClient, setEditedClient] = useState({});// Store the edited client data
  const [selectedFile, setSelectedFile] = useState(null);
  const api = import.meta.env.VITE_API

  // Search functionality
  useEffect(() => {
    const result = clientData.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, clientData]);

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
      alert("Please select a file to upload.");
      return;
    }
    console.log('running')
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${api}/client/upload?siteId=${siteId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.message === "Clients uploaded successfully") {
        alert("File uploaded successfully!");

        // Fetch updated clients list
        const fetchResponse = await axios.get(`${api}/client/getAll?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClientData(fetchResponse.data);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    }
  };
  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log(siteId);
        const token = localStorage.getItem("authToken");

        console.log(siteId);
        const response = await axios.get(`${api}/client/getAll?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClientData(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);

  // Add new client
  const handleAddClient = async () => {
    try {
      // Get the siteId from URL params
      const token = localStorage.getItem("authToken");
      // Get the siteId from the route params

      if (!siteId) {
        console.error("Site ID is missing");
        return;
      }

      // Construct the API endpoint
      const response = await axios.post(`${api}/client/create?siteId=${siteId}`, newClient, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the headers
        },
      });

      // Handle successful client creation
      setClientData((prev) => [...prev, response.data.client]);
      setNewClient({
        name: "",
        phoneNo: "",
        address: "",
        panGstNo: "",

      });
      setAddPopupOpen(false);
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };
  const handleSaveEdit = async () => {
    try {
      const clientId = clientData[editingIndex]._id;
      const token = localStorage.getItem("authToken");
      const response = await axios.put(`${api}/client/update/${clientId}`, editedClient, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = [...clientData];
      updatedData[editingIndex] = response.data.client;
      setClientData(updatedData);
      setEditingIndex(null);
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };


  const handleDelete = async (index) => {
    try {
      const clientId = clientData[index]._id;
      await axios.delete(`${api}/client/deleteclient/${clientId}`);
      const updatedData = clientData.filter((_, i) => i !== index);
      setClientData(updatedData);
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };


  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedClient({ ...clientData[index] });
  };


  return (
    <>
      <main className="client-management-main">
        <section className="client-management-section">
          <div className="client-search-container">
            <h1>Client Management</h1>
            <div className="client-controls-container">
              <div className="client-search-box">
                <input
                  type="search"
                  className="client-search-input"
                  placeholder="Search by Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <p className="client-search-label">Search</p>
              </div>
              <div className="client-buttons-container">
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="client-upload-button">
                  Upload
                </label>
                <button
                  className="client-add-button"
                  onClick={() => setAddPopupOpen(true)}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          <div className="client-cards-container">
            {filteredData.length > 0 ? (
              filteredData.map((client, index) => (
                <div className="client-card" key={index}>
                  {editingIndex === index ? (
                    <>
                      <div className="client-card-header">
                        <input
                          className="client-card-title"
                          value={editedClient.name}
                          onChange={(e) =>
                            setEditedClient((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <p className="client-card-detail">
                        <strong>Phone:</strong>{" "}
                        <input
                          value={editedClient.phoneNo}
                          onChange={(e) =>
                            setEditedClient((prev) => ({
                              ...prev,
                              phoneNo: e.target.value,
                            }))
                          }
                        />
                      </p>
                      <p className="client-card-detail">
                        <strong>Address:</strong>{" "}
                        <input
                          value={editedClient.address}
                          onChange={(e) =>
                            setEditedClient((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                        />
                      </p>
                      <p className="client-card-detail">
                        <strong>PAN/GST:</strong>{" "}
                        <input
                          value={editedClient.panGstNo}
                          onChange={(e) =>
                            setEditedClient((prev) => ({
                              ...prev,
                              panGstNo: e.target.value,
                            }))
                          }
                        />
                      </p>
                      <div className="client-card-actions">
                        <button
                          className="client-save-button"
                          onClick={handleSaveEdit}
                        >
                          Save
                        </button>
                        <button
                          className="client-cancel-button"
                          onClick={() => setEditingIndex(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="client-card-header">
                        <h2 className="client-card-title">{client.name}</h2>
                        <AiTwotoneEdit
                          className="client-edit-icon"
                          onClick={() => {
                            setEditingIndex(index);
                            setEditedClient({ ...client });
                          }}
                        />
                      </div>
                      <p className="client-card-detail">
                        <strong>Phone:</strong> {client.phoneNo}
                      </p>
                      <p className="client-card-detail">
                        <strong>Address:</strong> {client.address}
                      </p>
                      <p className="client-card-detail">
                        <strong>PAN/GST:</strong> {client.panGstNo}
                      </p>
                      
                      <div className="client-card-actions">
                        <button
                          className="client-delete-button"
                          onClick={() => handleDelete(index)}
                        >
                          <AiOutlineDelete /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No results found</p>
            )}
          </div>
        </section>
        {addPopupOpen && (
          <div className="client-popup-container">
            <div className="client-popup">
              <h1>Add New Client</h1>
              <input
                type="text"
                placeholder="Name"
                className="client-input"
                value={newClient.name}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="client-input"
                value={newClient.phoneNo}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, phoneNo: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Address"
                className="client-input"
                value={newClient.address}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="PAN/GST"
                className="client-input"
                value={newClient.panGstNo}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    panGstNo: e.target.value,
                  }))
                }
              />
              <button
                className="client-add-popup-button"
                onClick={() => {
                  setClientData((prev) => [...prev, newClient]);
                  setNewClient({
                    name: "",
                    phoneNo: "",
                    address: "",
                    panGstNo: "",
                    siteId: "",
                  });
                  setAddPopupOpen(false);
                }}
              >
                Add Client
              </button>
              <button
                className="client-close-popup-button"
                onClick={() => setAddPopupOpen(false)}
              >
                X
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
