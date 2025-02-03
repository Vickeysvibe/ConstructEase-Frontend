import React, { useState, useEffect } from "react";
import { RxCrossCircled } from "react-icons/rx";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

const Outward = () => {
  const { siteId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [addOutward, setAddOutward] = useState(false);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await request("GET", `/materials/getMI/${siteId}`);
        console.log("Fetched Data:", data);

        // If data is an object and contains 'materials' array
        const materialsList = Array.isArray(data.materials) ? data.materials : [];

        const formattedData = data.flatMap((item, index) =>
          item.materials.map((material, matIndex) => ({
            slNo: index + 1, // Serial Number
            product: material.productId?.name || "N/A", // Product Name
            total: material.availableQty + material.usedQty, // Total Stock
            currentStock: material.availableQty, // Available Stock
            usedStock: material.usedQty, // Used Stock
            unitPrice: material.unitPrice, // Price per unit
            fromVendor: item.POid?.name || "Unknown Vendor", // Vendor Name
            matId: material._id, // Material ID
          }))
        );

        setTableData(formattedData);
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    fetchMaterials();
  }, [siteId]);

  // Handle change in used stock input
  const handleStockChange = (e, index) => {
    const newUsedStock = Number(e.target.value);
    setTableData((prevData) =>
      prevData.map((item, i) => {
        if (i === index) {
          const updatedUsedStock = Math.min(newUsedStock, item.total);
          const updatedCurrentStock = item.total - updatedUsedStock;
          return { ...item, usedStock: updatedUsedStock, currentStock: updatedCurrentStock };
        }
        return item;
      })
    );
  };

  const saveStockChanges = async () => {
    try {
      for (const material of tableData) {
        console.log(material)
        await request("PUT", `/materials/editUse/${material.matId}`, {
          usedQty: material.usedStock,
        });
      }
      alert("Stock updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const filteredData = tableData.filter((item) =>
    item.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="outward-main">
      {addOutward && (
        <div className="add-outward-pg">
          <div className="outward-card">
            <header>
              <h2>Add outward</h2>
              <p onClick={() => { setAddOutward(false) }}><RxCrossCircled /></p>
            </header>
            <div className="container">
              <input type="text" placeholder="Enter the Product Name" />
              <input type="text" placeholder="Enter the Used Qty" />
            </div>
            <div className="btn">
              <button onClick={() => { setAddOutward(false) }}>Add</button>
            </div>
          </div>
        </div>
      )}
      <section>
        <header className="outward-header">
          <h1>Material Outward</h1>
          <div className="outward-search-bar">
            <div className="outward-search">
              <input
                type="text"
                placeholder="Search by Product Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="outward-search-button">Search</button>
            </div>
            <div className="outward-vendor-actions">
              <button className="outward-download-button">Download</button>
              <button className="outward-add-button" onClick={() => { setAddOutward(true) }}>Add</button>
              <button
                className="outward-edit-button"
                onClick={() => (isEditing ? saveStockChanges() : setIsEditing(true))}
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        </header>
        <div className="outward-table-container">
          <table className="outward-purchase-table">
            <thead>
              <tr className="outward-table-header">
                <th className="outward-th">Sl.no</th>
                <th className="outward-th">Product</th>
                <th className="outward-th">Total</th>
                <th className="outward-th">Current Stock</th>
                <th className="outward-th">Used Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={`${item.slNo}-${index}`} className="outward-table-row">
                    <td className="outward-td">{item.slNo}</td>
                    <td className="outward-td">{item.product}</td>
                    <td className="outward-td">{item.total}</td>
                    <td className="outward-td">{item.currentStock}</td>
                    <td className="outward-td">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={item.usedStock}
                            onChange={(e) => handleStockChange(e, index)}
                            className="edit-input"
                          />
                        </>
                      ) : (
                        item.usedStock
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="outward-td">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>


          </table>
        </div>
      </section>
    </main>
  );
};

export default Outward;
