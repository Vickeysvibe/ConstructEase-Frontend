import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import View from "./View";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";



// import Labourform from "./LabourForm";


export default function Productform({ setView, setViewDetial }) {
  const { companyName, siteId } = useParams();
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [constructionData, setConstructionData] = useState([]);
  const [clientData, setClientData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPopupOpen, setUploadPopupOpen] = useState(false);
  const [newProduct, setnewProduct] = useState({
    name: "",
    description: "",
    category: "",
    unit: "",
  });

  const api = import.meta.env.VITE_API
  useEffect(() => {
    if (!siteId) return;

    const fetchProducts = async () => {
      try {
        const response = await request("GET", `/product/getAll?siteId=${siteId}`);
        setConstructionData(response);
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };

    fetchProducts();
  }, [siteId, api]);

  useEffect(() => {
    if (constructionData) {
      setClientData(constructionData);
    }
  }, [constructionData]);


  console.log(constructionData)

  // const constructionData = [
  //   {
  //     name: "Cement",
  //     description: "Portland cement for foundation and structure work",
  //     category: "Building Material",
  //     unit: "Bags",
  //     siteId: "SITE001",
  //   },
  //   {
  //     name: "Steel Rod",
  //     description: "High tensile steel rods for reinforcement",
  //     category: "Building Material",
  //     unit: "Tons",
  //     siteId: "SITE002",
  //   },
  //   {
  //     name: "Bricks",
  //     description: "Red bricks for wall construction",
  //     category: "Masonry",
  //     unit: "Pieces",
  //     siteId: "SITE003",
  //   },
  //   {
  //     name: "Sand",
  //     description: "River sand for plastering and concrete work",
  //     category: "Building Material",
  //     unit: "Cubic Feet",
  //     siteId: "SITE004",
  //   },
  //   {
  //     name: "Concrete Mixer",
  //     description: "Portable concrete mixer for onsite usage",
  //     category: "Equipment",
  //     unit: "Units",
  //     siteId: "SITE005",
  //   },
  //   {
  //     name: "Paint",
  //     description: "Acrylic paint for finishing",
  //     category: "Finishing Material",
  //     unit: "Liters",
  //     siteId: "SITE006",
  //   },
  //   {
  //     name: "Plumbing Pipes",
  //     description: "PVC pipes for water supply and drainage",
  //     category: "Plumbing",
  //     unit: "Meters",
  //     siteId: "SITE007",
  //   },
  //   {
  //     name: "Tiles",
  //     description: "Ceramic tiles for flooring and walls",
  //     category: "Finishing Material",
  //     unit: "Boxes",
  //     siteId: "SITE008",
  //   },
  //   {
  //     name: "Electrical Wires",
  //     description: "Copper wires for electrical installations",
  //     category: "Electrical",
  //     unit: "Meters",
  //     siteId: "SITE009",
  //   },
  //   {
  //     name: "Scaffolding",
  //     description: "Steel scaffolding for onsite safety and construction",
  //     category: "Equipment",
  //     unit: "Sets",
  //     siteId: "SITE010",
  //   },
  // ];
  // console.log(constructionData[1]

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
      item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, clientData]);

  const handleDelete = async (index) => {
    const productId = clientData[index]._id;
    console.log(clientData)

    try {
      await request("DELETE", `/product/deleteproduct/${productId}?siteId=${siteId}`, {});

      const updatedData = clientData.filter((_, i) => i !== index);
      setClientData(updatedData);

    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  const handleSaveEditObject = async (index, field, value) => {
    const updatedData = [...clientData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setClientData(updatedData);

    try {

      await request("PUT", `/product/update/${updatedData[index]._id}`, updatedData[index]);

    } catch (error) {
      console.error('Error updating product:', error);
    }

    setEditIndex(null);
  };

  const handleSaveRow = () => {
    console.log("sDKHBv");
    console.log("Edited Data:", editedData);
    setEditIndex(null);
  };



  const handleView = (_id) => {
    const viewdetials = constructionData[_id];
    setViewDetial(viewdetials);
    setView(true);
  };

  const handleAddProduct = async () => {
    try {
      const response = await request("POST", `/product/create?siteId=${siteId}`, newProduct);

      if (response) {
        setClientData((prev) => [...prev, response]);
        setnewProduct({
          name: "",
          description: "",
          category: "",
          unit: "",
        });
        setAddPopupOpen(false);
      }

      if (response.message === "Product created successfully") {
        alert("Product added successfully!");

        const fetchResponse = await request("GET", `/product/getAll?siteId=${siteId}`);
        setClientData(fetchResponse);
      }

    } catch (error) {
      console.error('Error adding product:', error);
    }
  };
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
      const response = await request("POST", `/product/upload?siteId=${siteId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.message === "Products uploaded successfully") {
        alert("File uploaded successfully!");
      
        // Fetch updated products list
        const fetchResponse = await request("GET", `/product/getAll?siteId=${siteId}`);
        setClientData(fetchResponse);
      }
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    }
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
                    {productHeading.map((header, index) => (
                      <th
                        className={`masterth ${header === "Description" || header === "Category"
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
                        .slice(1, 5)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd ${field === "description" || field === "category"
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
                value={newProduct.name}
                onChange={(e) =>
                  setnewProduct((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) =>
                  setnewProduct((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Category"
                value={newProduct.category}
                onChange={(e) =>
                  setnewProduct((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Unit"
                value={newProduct.unit}
                onChange={(e) =>
                  setnewProduct((prev) => ({ ...prev, unit: e.target.value }))
                }
              />
              <p
                className="mastersubmitbtn"
                onClick={handleAddProduct}
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
