import React, { useState, useEffect } from "react";
import "../Purchase.css";
import { RxCrossCircled } from "react-icons/rx";
import { FaRegEdit, FaSave } from "react-icons/fa";
import format from "../../../assets/format.webp";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";
const PurchaseOrder = () => {
  const { siteId } = useParams();
  const orderhead = [
    "Serial No",
    "Product Name",
    "Unit",
    "Supplied Qty",
    "Available Qty",
    "Unit Price",
    "Return Qty",
    "Total",
    "Edit",
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [addpopopn, setaddpopopn] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rows, setRows] = useState([]);
  const [pos, setPos] = useState();
  const [selectedPoId, setSelectedPoId] = useState(null);
  const [selectedPo, setSelectedPo] = useState(null);
  const [table, setTable] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [selectedPrId, setSelectedPrId] = useState(null);
  const [selectedPr, setSelectedPr] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await request("GET", `/purchase/getPr/${selectedPrId}`);
      setSelectedPr({
        ...response.POid,
        subTotal: response.subTotal,
        tax: response.tax,
        grandTotal: response.grandTotal,
      });
      setTable(
        response.order.map((order) => ({
          ...order,
          availableQty: order.materialId.availableQty,
          total: order.returnQty * order.materialId.unitPrice,
        }))
      );
    };
    if (selectedPrId) fetchOrders();
  }, [selectedPrId]);

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await request(
        "GET",
        `/purchase/getAllPos?siteId=${siteId}`
      );
      setPos(response);
    };
    fetchOrders();
  }, [addpopopn]);
  useEffect(() => {
    const fetchOrders = async () => {
      const response = await request(
        "GET",
        `/purchase/getAllPrs?siteId=${siteId}`
      );
      setOrders(response);
    };
    fetchOrders();
  }, []);

  // ---------------------------search-------------------------
  useEffect(() => {
    const result = orders.filter((order) =>
      order.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, orders]);

  useEffect(() => {
    const fetchPO = async () => {
      const response = await request(
        "GET",
        `/purchase/getPoForPr/${selectedPoId}`
      );
      setSelectedPo(response.pos);
      setTable(
        response.materials.map((material) => ({
          ...material,
          returnQty: 0,
          total: 0,
        }))
      );
      console.log(response.materials);
      console.log(response.pos);
    };
    if (selectedPoId) fetchPO();
  }, [selectedPoId]);

  const handleInputChange = (index, field, value) => {
    const newData = [...table];
    newData[index][field] = value ? parseFloat(value) : 0;
    console.log(newData[index]);
    newData[index].total = newData[index].returnQty * newData[index].unitPrice; // Update subtotal
    newData[index].materialId.availableQty =
      newData[index].materialId.availableQty - newData[index].returnQty; // Update availableQty
    setTable(newData);
  };

  const handleInputChangepr = (index, field, value) => {
    const newData = [...table];
    newData[index][field] = value ? parseFloat(value) : 0;
    console.log(newData[index]);
    newData[index].total =
      newData[index].returnQty * newData[index].materialId.unitPrice; // Update subtotal
    newData[index].availableQty =
      newData[index].availableQty - newData[index].returnQty; // Update availableQty
    setTable(newData);
  };

  const calculateTotals = () => {
    const subTotal = table.reduce(
      (total, row) => total + row.returnQty * row.unitPrice,
      0
    );
    const grandTotal = subTotal + (subTotal * tax) / 100;
    setSubTotal(subTotal);
    setGrandTotal(grandTotal);
  };

  useEffect(() => {
    calculateTotals();
  }, [table, tax]);

  // Handle Edit/Save button click
  const handleEditClick = (index) => {
    if (editIndex === index) {
      // Save changes to initial array
      setEditIndex(null);
    } else {
      setEditIndex(index); // Enter edit mode
    }
  };

  const createPR = async (template) => {
    const body = {
      POid: selectedPoId,
      vendorId: selectedPo.vendorId._id,
      subTotal: subTotal,
      tax: tax,
      grandTotal: grandTotal,
      order: table.map((row) => ({
        MatId: row._id,
        returnQty: row.returnQty,
        availableQty: row.availableQty,
      })),
      template: template,
    };
    const response = await request(
      "POST",
      `/purchase/createPr?siteId=${siteId}`,
      body
    );
    console.log(response);
  };
  const editPr = async (template) => {
    const body = {
      POid: selectedPrId,
      vendorId: selectedPo.vendorId._id,
      subTotal: subTotal,
      tax: tax,
      grandTotal: grandTotal,
      order: table.map((row) => ({
        productId: row.productId._id,
        suppliedQty: row.suppliedQty,
        unitPrice: row.unitPrice,
        returnQty: row.returnQty,
      })),
      template: template,
    };
    const response = await request(
      "POST",
      `/purchase/createPr?siteId=${siteId}?edit=true`,
      body
    );
    console.log(response);
  };
  // ------------------------download---------------
  const [download, setDownload] = useState(false);

  return (
    <main className="purchaseOrder">
      <section className="purchaseOrderSec">
        <header className="orderHeader">
          <h1>Purchase Order</h1>
          <div className="search-bar">
            <div className="search">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />
              <button className="searchbutton">Search</button>
            </div>
            <div className="chooseVendor">
              <button onClick={() => setaddpopopn(0)}>Choose Vendor</button>
            </div>
          </div>
        </header>
        <div className="tablecon">
          {filteredData.map((order, index) => (
            <div
              className="orders-card"
              key={index}
              onClick={() => setSelectedPrId(order.id)}
            >
              <div className="order-cards-detials">
                <strong>Vendor Name: </strong>
                <p>{order.vendorName}</p>
              </div>
              <div className="order-cards-detials">
                <strong>Date : </strong>
                <p>{new Date(order.date).toLocaleDateString()}</p>
              </div>
              <div className="order-cards-detials">
                <strong>Transport : </strong>
                <p>{order.transport}</p>
              </div>
              <div className="order-cards-detials">
                <strong>Orders : </strong>
                <p>{order.orderCount}</p>
              </div>
              {/* <p>{order.Ordercode}</p> */}
            </div>
          ))}
        </div>
      </section>
      {!selectedPoId && addpopopn == 0 ? (
        <article className="purchasepopupcon">
          <div className="purchasepopupinner">
            <div className="chooseing-card">
              <header>
                <div className="header-top">
                  <h3>#xgcfhj</h3>
                  <div className="cross">
                    <p
                      onClick={() => {
                        setaddpopopn(null);
                        setDetails([]);
                      }}
                    >
                      <RxCrossCircled />
                    </p>
                  </div>
                </div>
                <div className="header-bottom">
                  <h1>PURCHASE ORDER</h1>
                </div>
              </header>
              {pos?.map((order, index) => (
                <div
                  className="cards-pos-dets"
                  onClick={() => {
                    setSelectedPoId(order.POid);
                  }}
                  key={index}
                >
                  <div className="orders-card">
                    <div className="order-cards-detials">
                      <strong>Vendor Name: </strong>
                      <p>{order.vendorName}</p>
                    </div>
                    <div className="order-cards-detials">
                      <strong>Order Count: </strong>
                      <p>{order.orderCount}</p>
                    </div>
                    <div className="order-cards-detials">
                      <strong>Transport: </strong>
                      <p>{order.transport}</p>
                    </div>
                    <div className="order-cards-detials">
                      <strong>Date: </strong>
                      <p>{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div />
        </article>
      ) : selectedPoId && selectedPo ? (
        <article className="purchasepopupcon">
          <div className="purchasepopupinner">
            <div className="chooseing-card">
              <header>
                <div className="header-top">
                  <h3>#xgcfhj</h3>
                  {/* <div className="date">{orderPost.date}</div> */}
                  <div className="cross">
                    <p
                      onClick={() => {
                        setaddpopopn(null);
                        setDetails([]);
                      }}
                    >
                      <RxCrossCircled />
                    </p>
                  </div>
                </div>
                <div className="header-bottom">
                  <h1>PURCHASE ORDER DETAILS</h1>
                </div>
              </header>
              <div className="selection">
                <div className="vendor-selection">
                  <div className="vendor-details">
                    <div className="show">
                      <p>{selectedPo?.vendorId?.name}</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={selectedPo?.vendorId?.address}
                      readOnly
                    />
                    <input
                      type="text"
                      placeholder="GST Number"
                      value={selectedPo?.vendorId?.gstIn}
                      readOnly
                    />
                  </div>
                  <div className="shipping-details">
                    <input
                      type="text"
                      placeholder="Enter the Shipped to site"
                      value={selectedPo?.siteId._id}
                      readOnly
                    />
                    <input
                      type="text"
                      placeholder="Enter the transport"
                      value={selectedPo?.transport}
                      readOnly
                    />
                    <input
                      type="text"
                      placeholder="Enter the date"
                      value={new Date(selectedPo?.date).toLocaleDateString()}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="tablecon">
              <div className="purchasetable">
                <table className="addinward-purchase-table">
                  <thead>
                    <tr className="addinward-table-header">
                      {orderhead.map((header, index) => (
                        <th key={index} className="addinward-th">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table?.map((row, index) => (
                      <tr key={index}>
                        <td className="addinward-td">{index + 1}</td>
                        <td className="addinward-td">{row.productId.name}</td>
                        <td className="addinward-td">{row.productId.unit}</td>
                        <td className="addinward-td">{row.suppliedQty}</td>
                        <td className="addinward-td">{row.availableQty}</td>
                        <td className="addinward-td">{row.unitPrice}</td>
                        <td
                          className="addinward-td"
                          contentEditable={editIndex === index}
                          suppressContentEditableWarning={true}
                          onBlur={(e) =>
                            handleInputChange(
                              index,
                              "returnQty",
                              e.target.innerText
                            )
                          }
                        >
                          {row.returnQty}
                        </td>
                        <td className="addinward-td">{row.total}</td>

                        <td
                          className="addinward-td lchid"
                          onClick={() => handleEditClick(index)}
                        >
                          {editIndex === index ? <FaSave /> : <FaRegEdit />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="total">
              <div className="total-field">
                <input
                  type="text"
                  value={`Grand Sub Total : ${subTotal}`}
                  readOnly
                />
              </div>
              <div className="total-field">
                <input
                  type="text"
                  placeholder="GST"
                  value={tax} // Display the current GST value
                  onChange={(e) =>
                    setTax(e.target.value ? parseFloat(e.target.value) : "")
                  }
                />
              </div>
              <div className="total-field">
                <input
                  type="text"
                  value={`Grand Total : ${grandTotal}`}
                  readOnly
                />
              </div>
            </div>
            <div className="btn">
              <button
                className="conform-btn"
                onClick={() => setDownload((prev) => !prev)}
              >
                Conform
              </button>
            </div>
          </div>
        </article>
      ) : selectedPr ? (
        <article className="purchasepopupcon">
          <div className="purchasepopupinner">
            <div className="chooseing-card">
              <header>
                <div className="header-top">
                  <h3>#xgcfhj</h3>
                  {/* <div className="date">{orderPost.date}</div> */}
                  <div className="cross">
                    <p
                      onClick={() => {
                        setaddpopopn(null);
                        setDetails([]);
                      }}
                    >
                      <RxCrossCircled />
                    </p>
                  </div>
                </div>
                <div className="header-bottom">
                  <h1>PURCHASE ORDER DETAILS</h1>
                </div>
              </header>
              <div className="selection">
                <div className="vendor-selection">
                  <div className="vendor-details">
                    <div className="show">
                      <p>{selectedPr?.vendorId?.name}</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={selectedPr?.vendorId?.address}
                      readOnly
                    />
                    <input
                      type="text"
                      placeholder="GST Number"
                      value={selectedPr?.vendorId?.gstIn}
                      readOnly
                    />
                  </div>
                  <div className="shipping-details">
                    <input
                      type="text"
                      placeholder="Enter the Shipped to site"
                      value={selectedPr?.siteId._id}
                      readOnly
                    />
                    <input
                      type="text"
                      placeholder="Enter the transport"
                      value={selectedPr?.transport}
                      readOnly
                    />
                    <input
                      type="text"
                      placeholder="Enter the date"
                      value={new Date(selectedPr?.date).toLocaleDateString()}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="tablecon">
              <div className="purchasetable">
                <table className="addinward-purchase-table">
                  <thead>
                    <tr className="addinward-table-header">
                      {orderhead
                        .filter((f) => f != "Edit")
                        .map((header, index) => (
                          <th key={index} className="addinward-th">
                            {header}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table?.map((row, index) => (
                      <tr key={index}>
                        <td className="addinward-td">{index + 1}</td>
                        <td className="addinward-td">
                          {row.materialId.productId.name}
                        </td>
                        <td className="addinward-td">
                          {row.materialId.productId.unit}
                        </td>
                        <td className="addinward-td">
                          {row.materialId.suppliedQty}
                        </td>
                        <td className="addinward-td">{row.availableQty}</td>
                        <td className="addinward-td">
                          {row.materialId.unitPrice}
                        </td>
                        <td className="addinward-td">{row.returnQty}</td>
                        <td className="addinward-td">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="total">
              <div className="total-field">
                <input
                  type="text"
                  value={`Grand Sub Total : ${selectedPr.subTotal}`}
                  readOnly
                />
              </div>
              <div className="total-field">
                <input
                  type="text"
                  value={selectedPr.tax} // Display the current GST value
                  readOnly
                />
              </div>
              <div className="total-field">
                <input
                  type="text"
                  value={`Grand Total : ${selectedPr.grandTotal}`}
                  readOnly
                />
              </div>
            </div>
          </div>
        </article>
      ) : (
        <></>
      )}
      {download && (
        <article className="download-pg">
          <div className="download-sec">
            <header>
              <div className="heading">
                <h1>Download Formats</h1>
                <p
                  onClick={() => {
                    setDownload((prev) => !prev);
                  }}
                >
                  X
                </p>
              </div>

              <p>Select a option for download format.</p>
            </header>
            <div className="download-contaniner">
              <div className="download-card" onClick={() => createPR(1)}>
                <img src={format} alt="format" />
                <h3>Format 1</h3>
              </div>
              <div className="download-card" onClick={() => createPR(2)}>
                <img src={format} alt="format" />
                <h3>Format 2</h3>
              </div>
              <div className="download-card" onClick={() => createPR(3)}>
                <img src={format} alt="format" />
                <h3>Format 3</h3>
              </div>
            </div>
          </div>
        </article>
      )}
    </main>
  );
};

export default PurchaseOrder;
