import { AiTwotoneEdit, AiOutlineDelete } from "react-icons/ai";
import "../Master.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function ClientManagement() {
  const { companyName, siteId } = useParams();
  console.log(companyName, siteId);
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [clientData, setClientData] = useState([
    {
      name: "Client A",
      phoneNo: "123-456-7890",
      address: "123 Main St, City",
      panGstNo: "GST12345",
      siteId: "SITE001",
    },
    {
      name: "Client B",
      phoneNo: "987-654-3210",
      address: "456 Elm St, City",
      panGstNo: "GST98765",
      siteId: "SITE002",
    },
  ]);

  const [newClient, setNewClient] = useState({
    name: "",
    phoneNo: "",
    address: "",
    panGstNo: "",
    siteId: "",
  });

  const [editingIndex, setEditingIndex] = useState(null); // Track which card is being edited
  const [editedClient, setEditedClient] = useState({}); // Store the edited client data

  // Search functionality
  useEffect(() => {
    const result = clientData.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, clientData]);

  const handleDelete = (index) => {
    const updatedData = clientData.filter((_, i) => i !== index);
    setClientData(updatedData);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedClient({ ...clientData[index] });
  };

  const handleSaveEdit = () => {
    const updatedData = [...clientData];
    updatedData[editingIndex] = editedClient; // Update the client data
    setClientData(updatedData);
    console.log("Edited Client:", editedClient); // Log the edited content
    setEditingIndex(null); // Exit edit mode
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
                <button className="client-upload-button">Upload</button>
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
                      <p className="client-card-detail">
                        <strong>Site ID:</strong>{" "}
                        <input
                          value={editedClient.siteId}
                          onChange={(e) =>
                            setEditedClient((prev) => ({
                              ...prev,
                              siteId: e.target.value,
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
                          onClick={() => handleEdit(index)}
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
                      <p className="client-card-detail">
                        <strong>Site ID:</strong> {client.siteId}
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
              <input
                type="text"
                placeholder="Site ID"
                className="client-input"
                value={newClient.siteId}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    siteId: e.target.value,
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
