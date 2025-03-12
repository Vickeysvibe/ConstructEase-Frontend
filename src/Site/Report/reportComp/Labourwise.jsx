import "../Report.css";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function Labourwise() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const { companyName, siteId: site } = useParams();

  const categories = [
    "Carpenter",
    "dfga",
    "ugfcvt",
    "gfxdfcgvhb",
    "gfxhbv",
    "d",
  ];
  const subCategories = [
    "Framework",
    "dfga",
    "ugfcvt",
    "gfxdfcgvhb",
    "gfxhbv",
    "d",
  ];

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates.");
      return;
    }

    try {
      const response = await request(
        "POST",
        "/reports/labourReport",
        {
          siteId: site,
          startDate,
          endDate,
          laborCategory: category || "ALL",
          subCategory: subCategory || "",
        },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "LaborReport.xlsx";
      link.click();
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report.");
    }
  };
  const handleView = () => {
    setValue(1);
  };
  const handleViewPayment = () => {
    setPayment(1);
  };
  
  const [payfor, setpayfor] = useState(0);
  const [value, setValue] = useState(0);
  const [payment,setPayment] = useState(0);

  const data = [
    {
      name: "John Doe",
      phone: "123-456-7890",
      category: "Labor",
      subcategory: "Construction",
      wagePerShift: 50,
      daysPresent: 20,
      totalShifts: 40,
      totalWages: 2000,
    },
    {
      name: "Jane Smith",
      phone: "987-654-3210",
      category: "Labor",
      subcategory: "Painting",
      wagePerShift: 45,
      daysPresent: 18,
      totalShifts: 36,
      totalWages: 1620,
    },
    {
      name: "John Doe",
      phone: "123-456-7890",
      category: "Labor",
      subcategory: "Construction",
      wagePerShift: 50,
      daysPresent: 20,
      totalShifts: 40,
      totalWages: 2000,
    },
    {
      name: "Jane Smith",
      phone: "987-654-3210",
      category: "Labor",
      subcategory: "Painting",
      wagePerShift: 45,
      daysPresent: 18,
      totalShifts: 36,
      totalWages: 1620,
    },
  ];
  return (
    <>
      <main className="reportmain">
        <section className="reportsec">
          <h1>Labour Report</h1>
          <div className="labour-nav">
            <p className="funds-nav">
              <p
                onClick={() => setpayfor(0)}
                className={`funds-nav-items ${payfor === 0 ? "highlight" : ""}`}
              >
                Labour Attendence
              </p>
              |
              <p
                onClick={() => setpayfor(1)}
                className={`funds-nav-items ${payfor === 1 ? "highlight" : ""}`}
              >
                Labour Payments
              </p>
            </p>
          </div>
          {payfor == 0 ? (
            value == 0 ? (
              <>
                <form className="reportform">
                  <label>Category:</label>
                  <select
                    className="reportinput"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All</option>
                    {categories.map((labor) => (
                      <option key={labor} value={labor}>
                        {labor}
                      </option>
                    ))}
                  </select>

                  <label>Sub Category (optional):</label>
                  <select
                    className="reportinput"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  >
                    <option value="">All</option>
                    {subCategories.map((labor) => (
                      <option key={labor} value={labor}>
                        {labor}
                      </option>
                    ))}
                  </select>

                  <label>Start Date:</label>
                  <input
                    className="reportinput"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />

                  <label>End Date:</label>
                  <input
                    className="reportinput"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />

                  <div className="reportdownloadbtncon">
                    <p
                      type="button"
                      onClick={handleView}
                      className="reportdownloadbtn"
                    >
                      View Labour Attendence Details
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <div className="attendancemain">
                <div className="attendancesec">
                  <div className="tablecon">
                    <table className="attendancetable">
                      <thead>
                        <tr>
                          <th className="attendanceth">Name</th>
                          <th className="attendanceth">Phone Number</th>
                          <th className="attendanceth">Category</th>
                          <th className="attendanceth">Subcategory</th>
                          <th className="attendanceth">Wages/Shift</th>
                          <th className="attendanceth">Days Present</th>
                          <th className="attendanceth">Total Shifts</th>
                          <th className="attendanceth">Total Wages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr
                            key={index}
                            className={index % 2 === 0 ? "even-row" : "odd-row"}
                          >
                            <td className="attendancetd">{item.name}</td>
                            <td className="attendancetd">{item.phone}</td>
                            <td className="attendancetd">{item.category}</td>
                            <td className="attendancetd">{item.subcategory}</td>
                            <td className="attendancetd">
                              ${item.wagePerShift}
                            </td>
                            <td className="attendancetd">{item.daysPresent}</td>
                            <td className="attendancetd">{item.totalShifts}</td>
                            <td className="attendancetd">${item.totalWages}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="download">
                      <button onClick={handleDownload}>Download</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : payment == 0 ? (
            <form className="reportform">
              <label>Category:</label>
              <select
                className="reportinput"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((labor) => (
                  <option key={labor} value={labor}>
                    {labor}
                  </option>
                ))}
              </select>

              <label>Sub Category (optional):</label>
              <select
                className="reportinput"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                <option value="">All</option>
                {subCategories.map((labor) => (
                  <option key={labor} value={labor}>
                    {labor}
                  </option>
                ))}
              </select>

              <label>Start Date:</label>
              <input
                className="reportinput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <label>End Date:</label>
              <input
                className="reportinput"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />

              <div className="reportdownloadbtncon">
                <p
                  type="button"
                  onClick={handleViewPayment}
                  className="reportdownloadbtn"
                >
                  View Labour Payment Details
                </p>
              </div>
            </form>
          ) : (
            <div className="attendancemain">
              <div className="attendancesec">
                <div className="tablecon">
                  <table className="attendancetable">
                    <thead>
                      <tr>
                        <th className="attendanceth">Name</th>
                        <th className="attendanceth">Phone Number</th>
                        <th className="attendanceth">Category</th>
                        <th className="attendanceth">Subcategory</th>
                        <th className="attendanceth">Wages/Shift</th>
                        <th className="attendanceth">Days Present</th>
                        <th className="attendanceth">Total Shifts</th>
                        <th className="attendanceth">Total Wages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "even-row" : "odd-row"}
                        >
                          <td className="attendancetd">{item.name}</td>
                          <td className="attendancetd">{item.phone}</td>
                          <td className="attendancetd">{item.category}</td>
                          <td className="attendancetd">{item.subcategory}</td>
                          <td className="attendancetd">${item.wagePerShift}</td>
                          <td className="attendancetd">{item.daysPresent}</td>
                          <td className="attendancetd">{item.totalShifts}</td>
                          <td className="attendancetd">${item.totalWages}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="download">
                    <button onClick={handleDownload}>Download</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
