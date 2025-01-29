import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import View from "./View";
// import Labourform from "./LabourForm";

export default function Productform({setView,setViewDetial}) {
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});

  const constructionData = [
    {
      name: "Cement",
      description: "Portland cement for foundation and structure work",
      category: "Building Material",
      unit: "Bags",
      siteId: "SITE001",
    },
    {
      name: "Steel Rod",
      description: "High tensile steel rods for reinforcement",
      category: "Building Material",
      unit: "Tons",
      siteId: "SITE002",
    },
    {
      name: "Bricks",
      description: "Red bricks for wall construction",
      category: "Masonry",
      unit: "Pieces",
      siteId: "SITE003",
    },
    {
      name: "Sand",
      description: "River sand for plastering and concrete work",
      category: "Building Material",
      unit: "Cubic Feet",
      siteId: "SITE004",
    },
    {
      name: "Concrete Mixer",
      description: "Portable concrete mixer for onsite usage",
      category: "Equipment",
      unit: "Units",
      siteId: "SITE005",
    },
    {
      name: "Paint",
      description: "Acrylic paint for finishing",
      category: "Finishing Material",
      unit: "Liters",
      siteId: "SITE006",
    },
    {
      name: "Plumbing Pipes",
      description: "PVC pipes for water supply and drainage",
      category: "Plumbing",
      unit: "Meters",
      siteId: "SITE007",
    },
    {
      name: "Tiles",
      description: "Ceramic tiles for flooring and walls",
      category: "Finishing Material",
      unit: "Boxes",
      siteId: "SITE008",
    },
    {
      name: "Electrical Wires",
      description: "Copper wires for electrical installations",
      category: "Electrical",
      unit: "Meters",
      siteId: "SITE009",
    },
    {
      name: "Scaffolding",
      description: "Steel scaffolding for onsite safety and construction",
      category: "Equipment",
      unit: "Sets",
      siteId: "SITE010",
    },
  ];
  // console.log(constructionData[1])
  const [clientData, setClientData] = useState([...constructionData]);
  const [newClient, setNewClient] = useState({
    name: "",
    description: "",
    category: "",
    unit: "",
  });

  const productHeading = [
    "S.No",
    "Name",
    "Description",
    "Category",
    "Unit",
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
  // console.log(editedData);


  const handleView = (id) => {
    const viewdetials = constructionData[id];
    setViewDetial(viewdetials);
    setView(true);
  };

  return (
    <>
      <main className="mastermain">
       
        {/* {view && <View view={viewdetial} setView={setView} />} */}
        <section className="mastersec">
          <div className="searchcon">
            <h1>Product Management</h1>
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
                          header === "Description" || header === "Category"
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
                      <td className="mastertd sl">{index + 1}</td>
                      {Object.keys(product)
                        .slice(0, 4)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd ${
                              field === "description" || field === "category"
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
              <h1>Add New Product</h1>
              <input
                type="text"
                placeholder="Name"
                value={newClient.name}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Description"
                value={newClient.description}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Category"
                value={newClient.category}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Unit"
                value={newClient.unit}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, unit: e.target.value }))
                }
              />
              <p
                className="mastersubmitbtn"
                onClick={() => {
                  setClientData((prev) => [...prev, newClient]); // Add new client to the array
                  setNewClient({
                    name: "",
                    description: "",
                    category: "",
                    unit: "",
                  }); // Reset form
                  setAddPopupOpen(false); // Close popup
                }}
              >
                Add Product
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
