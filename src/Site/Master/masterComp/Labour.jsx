import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";

export default function Labourform({setViewDetial,setView}) {
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});

  const workersData = [
    {
      name: "John Doe",
      phoneNo: "123-456-7890",
      category: "Masonry",
      subCategory: "Brick Layer",
      wagesPerShift: 500,
    },
    {
      name: "Jane Smith",
      phoneNo: "987-654-3210",
      category: "Electrical",
      subCategory: "Electrician",
      wagesPerShift: 600,
    },
  ];

  const [clientData, setClientData] = useState([...workersData]);
  const [newLabour, setNewLabour] = useState({
    name: "",
    phoneNo: 0,
    category: "",
    subCategory: "",
    wagesPerShift: "",
  });

  const productHeading = [
    "S.No",
    "Name",
    "PhoneNo",
    "Category",
    "SubCategory",
    "WagesPerShift",
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
    console.log("sDKHBv");
    console.log("Edited Data:", editedData); // Log all tracked edits
    setEditIndex(null); // End editing mode
  };
//   console.log(editedData);

  const handleView = (id) => {
    const viewdetials = workersData[id];
    setViewDetial(viewdetials);
    setView(true);
  };
  
  return (
    <>
      <main className="mastermain">
        <section className="mastersec">
          <div className="searchcon">
            <h1>Labour Management</h1>
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
                    {productHeading.map((header, index) => (
                      <th
                        className={`masterth ${
                          header === "PhoneNo" ||
                          header === "Category" ||
                          header === "WagesPerShift"
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
                  {filteredData.map((product, index) => (
                    <tr key={index} onClick={() => handleView(index)}>
                      <td className="mastertd sl" >{index + 1}</td>
                      {Object.keys(product)
                        .slice(0, 5)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd ${
                              field === "phoneNo" ||
                              field === "category" ||
                              field === "wagesPerShift"
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
                            {product[field]}
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
              <h1>Add New Labour</h1>
              <input
                type="text"
                placeholder="Name"
                value={newLabour.name}
                onChange={(e) =>
                  setNewLabour((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newLabour.phoneNo}
                onChange={(e) =>
                  setNewLabour((prev) => ({ ...prev, phoneNo: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Category"
                value={newLabour.category}
                onChange={(e) =>
                  setNewLabour((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Subcategory"
                value={newLabour.subCategory}
                onChange={(e) =>
                  setNewLabour((prev) => ({
                    ...prev,
                    subCategory: e.target.value,
                  }))
                }
              />
              <input
                type="number"
                placeholder="Wages Per Shift"
                value={newLabour.wagesPerShift}
                onChange={(e) =>
                  setNewLabour((prev) => ({
                    ...prev,
                    wagesPerShift: e.target.value,
                  }))
                }
              />
              <p
                className="mastersubmitbtn"
                onClick={() => {
                  setClientData((prev) => [...prev, newLabour]); // Add new labour to the array
                  setNewLabour({
                    name: "",
                    phoneNo: "",
                    category: "",
                    subCategory: "",
                    wagesPerShift: "",
                  }); // Reset form
                  setAddPopupOpen(false); // Close popup
                }}
              >
                Add Labour
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
