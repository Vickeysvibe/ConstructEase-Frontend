import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Labourform({ setViewDetial, setView }) {
  const { companyName, siteId } = useParams();
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [workersData, setworkersData] = useState([])
  const [selectedFile, setSelectedFile] = useState(null);

  const api = import.meta.env.VITE_API

  const token = localStorage.getItem("authToken");
  const [clientData, setClientData] = useState([...workersData]);
  const [newLabour, setNewLabour] = useState({
    name: "",
    phoneNo: "",
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
  useEffect(() => {
    const fetchLabours = async () => {
      try {
        const response = await axios.get(`${api}/labour/getAll?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClientData(response.data);
        setworkersData(response.data);
      } catch (error) {
        console.error("Error fetching labours:", error);
      }
    };
    fetchLabours();
  }, [siteId]);

  const handleAddLabour = async () => {
    try {
      const response = await axios.post(`${api}/labour/create?siteId=${siteId}`, newLabour, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClientData((prev) => [...prev, response.data.labour]);
      setNewLabour({
        name: "",
        phoneNo: "",
        category: "",
        subCategory: "",
        wagesPerShift: "",
      });
      setAddPopupOpen(false);
    } catch (error) {
      console.error("Error adding labour:", error);
    }
  };


  // Search Functionality (Search by Name Only)
  useEffect(() => {
    const result = clientData.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, clientData]);

  const handleSaveEditObject = async (index, field, value) => {
    const updatedLabour = { ...clientData[index], [field]: value };
    try {
      const response = await axios.put(
        `${api}/labour/update-labour/${updatedLabour._id}?siteId=${siteId}`,
        updatedLabour, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = [...clientData];
      updatedData[index] = response.data.labour;
      setClientData(updatedData);
      setEditIndex(null);
    } catch (error) {
      console.error("Error updating labour:", error);
    }
  };

  // Delete a labour
  const handleDelete = async (index) => {
    const labourId = clientData[index]._id;
    try {
      await axios.delete(`${api}/labour/delete/${labourId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = clientData.filter((_, i) => i !== index);
      setClientData(updatedData);
    } catch (error) {
      console.error("Error deleting labour:", error);
    }
  };

  const handleSaveRow = () => {
    console.log("sDKHBv");
    console.log("Edited Data:", editedData); // Log all tracked edits
    setEditIndex(null); // End editing mode
  };
  //   console.log(editedData);

  const handleView = (_id) => {
    const viewdetials = workersData[_id];
    setViewDetial(viewdetials);
    setView(true);
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
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${api}/labour/upload?siteId=${siteId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.message === "labour uploaded successfully") {
        alert("File uploaded successfully!");

        const fetchResponse = await axios.get(`${api}/labour/getAll?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setworkersData(fetchResponse.data);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    }
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
                        className={`masterth ${header === "PhoneNo" ||
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
                        .slice(1, 6)
                        .map((field) => (
                          <td
                            key={field}
                            className={`mastertd ${field === "phoneNo" ||
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
                          <button onClick={() => setEditIndex(null)}>Save</button>
                        ) : (
                          <>
                            <p onClick={() => setEditIndex(index)}>
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
                onClick={handleAddLabour}
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
