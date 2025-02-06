import "../Master.css";
import { useState, useEffect } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function Labourform() {
  const { companyName, siteId } = useParams();
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [workersData, setworkersData] = useState([]);
  const [selectel̥File, setSelectedFile] = useState(null);

  const api = import.meta.env.VITE_API;

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
        const response = await request(
          "GET",
          `/labour/getAll?siteId=${siteId}`
        );

        setClientData(response);
        setworkersData(response);
      } catch (error) {
        console.error("Error fetching labours:", error);
      }
    };
    fetchLabours();
  }, [siteId]);

  const handleAddLabour = async () => {
    try {
      const response = await request(
        "POST",
        `/labour/create?siteId=${siteId}`,
        newLabour
      );

      setClientData((prev) => [...prev, response.labour]); // Assuming response contains `labour`
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
      const response = await request(
        "PUT",
        `/labour/update-labour/${updatedLabour._id}?siteId=${siteId}`,
        updatedLabour
      );

      const updatedData = [...clientData];
      updatedData[index] = response.labour;
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
      await request(
        "DELETE",
        `/labour/delete/${labourId}?siteId=${siteId}`,
        {}
      );

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
      alert("Please select a file to upload.");
      return;
    }
    console.log("running");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await request(
        "POST",
        `/labour/upload?siteId=${siteId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.message === "labour uploaded successfully") {
        alert("File uploaded successfully!");

        const fetchResponse = await request(
          "GET",
          `/labour/getAll?siteId=${siteId}`
        );
        setworkersData(fetchResponse);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    }
  };
  // ---------------------pop-up--------------------------------
  const [opn, setOpn] = useState(false);
  const [view, setView] = useState();

  const handleView = (item) => {
    setView(item);
    setOpn(true);
  };
  // useEffect(() => {
  //   console.log(view);
  //   console.log(opn);
  // }, [view, opn]);

  // Handle attendance checkbox selection
  const [presentlab, setPresentLab] = useState([]);
  const [presentDetails, setPresentDetails] = useState([]);

  const handleCheckboxChange = (e, worker) => {
    console.log("Worker received:", worker); // Debugging
    if (!worker) {
      console.error("Worker is undefined!");
      return;
    }

    if (e.target.checked) {
      setPresentLab((prev) => [...prev, worker._id]);
      setPresentDetails((prev) => [...prev, worker]);
    } else {
      setPresentLab((prev) => prev.filter((id) => id !== worker.id));
      setPresentDetails((prev) => prev.filter((w) => w.id !== worker.id));
    }
  };
  console.log(presentlab)
// --------download-btn------
  const [downloadBtn, setDownloadBtn] = useState(0);

  useEffect(() => {
    if(presentlab.length>0){
        setDownloadBtn(1)
    }
  }, [presentlab]);

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
                        <strong>PhoneNo:</strong> <p>{view.phoneNo}</p>
                      </li>
                      <li>
                        <strong>Category:</strong> <p>{view.category}</p>
                      </li>
                      <li>
                        <strong>Subcategory:</strong> <p>{view.subCategory}</p>
                      </li>
                      <li>
                        <strong>wagesPerShift:</strong> <p>{view.wagesPerShift}</p>
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
                <label htmlFor="file-upload" className="client-upload-button ">
                  Upload
                </label>
                <p
                  className="masteraddbtn"
                  onClick={() => setAddPopupOpen(true)}
                >
                  Add
                </p>
                {downloadBtn == 1 && <p className="masteraddbtn">Download</p>}
                
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
                    <tr key={index} onClick={() => handleView(product)}>
                      <td className="mastertd sl">{index + 1}</td>
                      {Object.keys(product)
                        .slice(1, 6)
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
                          <button onClick={() => setEditIndex(null)}>
                            Save
                          </button>
                        ) : (
                          <>
                            <p onClick={() => setEditIndex(index)}>
                              <AiTwotoneEdit />
                            </p>
                            <p onClick={() => handleDelete(index)} className="del">
                              <AiOutlineDelete />
                            </p>
                            <input type="checkbox" onChange={(e) => handleCheckboxChange(e, product)}/>
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
              <p className="mastersubmitbtn" onClick={handleAddLabour}>
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
