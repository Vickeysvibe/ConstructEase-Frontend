import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PiGreaterThanFill } from "react-icons/pi";
import { PiLessThanFill } from "react-icons/pi";
export default function Sidemenu({ siteId, companyName }) {
  const location = useLocation();

  const [menuopn, setmenuopn] = useState(false);
  const [activeItem, setActiveItem] = useState(location.pathname); // Track the active item

  const master = [
    { title: "Client Form", link: `/${companyName}/${siteId}/master/client` },
    { title: `Product Form`, link: `/${companyName}/${siteId}/master/product` },
    { title: `Labour Form`, link: `/${companyName}/${siteId}/master/labour` },
    {
      title: `Supervisors`,
      link: `/${companyName}/${siteId}/master/supervisors`,
    },
    { title: `Vendors`, link: `/${companyName}/${siteId}/master/vendor` },
  ];

  const attendance = [
    {
      title: `Labour Attendance`,
      link: `/${companyName}/${siteId}/attendance/labour`,
    },
    {
      title: `Todays Attendance`,
      link: `/${companyName}/${siteId}/attendance/today`,
    },
    {
      title: `Supervisor Attendance`,
      link: `/${companyName}/${siteId}/attendance/supervisors`,
    },
  ];

  const purchase = [
    {
      title: `Purchase Order`,
      link: `/${companyName}/${siteId}/purchase/order`,
    },
    {
      title: `Purchase Return`,
      link: `/${companyName}/${siteId}/purchase/purchasereturn`,
    },
  ];

  const activity = [
    { title: `ToDo`, link: `/${companyName}/${siteId}/activity/todo` },
    { title: `Notes`, link: `/${companyName}/${siteId}/activity/notes` },
    {
      title: `Material Inwards`,
      link: `/${companyName}/${siteId}/activity/inwards`,
    },
    {
      title: `Material Outwards`,
      link: `/${companyName}/${siteId}/activity/outwards`,
    },
    { title: `Work Done`, link: `/${companyName}/${siteId}/activity/work` },
    {
      title: `Fund Management`,
      link: `/${companyName}/${siteId}/activity/fund`,
    },
  ];

  const report = [
    {
      title: `Labour Wise Report`,
      link: `/${companyName}/${siteId}/report/labourwise`,
    },
    {
      title: `Vendor Wise Report`,
      link: `/${companyName}/${siteId}/report/vendorwise`,
    },
    {
      title: `Payment Wise Report`,
      link: `/${companyName}/${siteId}/report/paymentwise`,
    },
  ];

  const [urlfinds, seturlfind] = useState([]);

  useEffect(() => {
    const path = location.pathname;

    if (path.includes("master")) {
      seturlfind(master);
    } else if (path.includes("attendance")) {
      seturlfind(attendance);
    } else if (path.includes("purchase")) {
      seturlfind(purchase);
    } else if (path.includes("activity")) {
      seturlfind(activity);
    } else if (path.includes("report")) {
      seturlfind(report);
    } else {
      seturlfind([]);
    }
  }, [location.pathname]);
  // const active =()=>{
  //   setActiveItem(val.link);
  //   setmenuopn((prev) => !prev)
  // }
  return (
    <menu className={menuopn ? "" : "menuclose"}>
      <div className="menucon">
        {urlfinds.map((val, key) => (
          <Link
            className={`menulinks ${activeItem === val.link ? "active" : ""}`}
            key={key}
            to={val.link}
            onClick={() => setActiveItem(val.link)} // Update the active item on click
          >
            <div className="span"></div>
            <div className="value">{val.title}</div>
          </Link>
        ))}
      </div>
      <div className="menuarrcon">
        <p onClick={() => setmenuopn((prev) => !prev)} className="menuarr">
          {/* <p><PiGreaterThanFill/></p> */}
          {menuopn ? (
            <p>
              <>&lt;</>
            </p>
          ) : (
            <p>
              <>&gt;</>
            </p>
          )}
        </p>
      </div>
    </menu>
  );
}
