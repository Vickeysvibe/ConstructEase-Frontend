import React, { useEffect, useState } from "react";
import {
  Navigate,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { RxCrossCircled } from "react-icons/rx";
import { request } from "../../../api/request";

const Details = () => {
  const { companyName, siteId, Poid } = useParams();
  const [details, setDetails] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPO = async () => {
      const response = await request("GET", `/purchase/getPo/${Poid}`);
      setDetails(response);
    };
    fetchPO();
  }, []);

  return (
    <article className="purchasepopupcon">
      {details && (
        <div className="purchasepopupinner">
          <div className="chooseing-card">
            <header>
              <div className="header-top">
                <h3>{details?.vendorId.name}</h3>
                <div className="cross">
                  <p
                    onClick={() => {
                      navigate(`/${companyName}/${siteId}/purchase/order`);
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
                    <p>{details?.vendorId.name}</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Address"
                    value={details?.address}
                    readOnly
                  />
                  <input
                    type="text"
                    placeholder="GST Number"
                    value={details?.vendorId.gstIn}
                    readOnly
                  />
                </div>
                <div className="shipping-details">
                  <input
                    type="text"
                    placeholder="Enter the Shipped to site"
                    value={details?.siteId.name}
                    readOnly
                  />
                  <input
                    type="text"
                    placeholder="Enter the transport"
                    value={details?.transport}
                    onChange={(e) => setOrderTransport(e.target.value)}
                  />
                  <input
                    type="date"
                    value={details?.date}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="table">
            <table className="purchasetable purchasetablepopup">
              <thead>
                <tr className="labhead">
                  {[
                    "ID",
                    "Product Name",
                    "Categoty",
                    "Unit",
                    "Required Qty",
                  ].map((header, index) => (
                    <th className="purchasepopupth" key={index}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details?.order?.map((order, index) => (
                  <tr key={order._id}>
                    <td>{index + 1}</td>
                    <td>{order.productId.name}</td>
                    <td>{order.productId.category}</td>
                    <td>{order.productId.unit}</td>
                    <td>{order.requiredQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
};

export default Details;
