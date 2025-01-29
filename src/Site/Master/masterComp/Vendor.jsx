import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";

export default function VendorForm() {
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});

  const vendorData = [
    {
      name: "Vendor One",
      ownerName: "John Doe",
      address: "123 Main St, City",
      gstIn: "GST123456789",
      phoneNo: "123-456-7890",
      siteId: "SITE001",
    },
    {
      name: "Vendor Two",
      ownerName: "Jane Smith",
      address: "456 Elm St, City",
      gstIn: "GST987654321",
      phoneNo: "987-654-3210",
      siteId: "SITE002",
    },
    // Add more vendors as needed
  ];

  const [clientData, setClientData] = useState([...vendorData]);
  const [newVendor, setNewVendor] = useState({
    name: "",
    ownerName: "",
    address: "",
    gstIn: "",
    phoneNo: "",
    siteId: "",
  });

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

  // Search Functionality (Search by Name Only)
  useEffect(() => {
    const result = clientData.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, clientData]);

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
                    {vendorHeading.map((header, index) => (
                      <th
                        className={`masterth ${
                          header !== "S.No" &&
                          header !== "Name" &&
                          header !== "OwnerName" &&
                          header !== "Action"
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
                  {filteredData.map((vendor, index) => (
                    <tr key={index}>
                      <td className="mastertd sl">{index + 1}</td>
                      {Object.keys(vendor)
                        .slice(0, 6)
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
                              handleSaveEditObject(
                                index,
                                field,
                                e.target.innerText
                              )
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
