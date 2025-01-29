// import '../App.css';
import "../Report.css";

import { useState } from "react";

export default function Labourwise() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const vendors = ["qwert", "dfga", "ugfcvt", "gfxdfcgvhb", "gfxhbv", "d"];
  return (
    <>
      <main className="reportmain">
        <section className="reportsec">
          <h1>Vendor Report</h1>
          <form className="reportform">
            <label>Select Vendor :</label>
            <select className="reportinput">
              {vendors.map((vendor) => {
                return (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                );
              })}
            </select>

            <label>Start Date:</label>
            <span className="reportinput reportdateinput">
              {startDate == "" ? <p>Select Date (YYYY-MM-DD)</p> : null}
              <input
                className="dateinput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </span>

            <label>End Date:</label>
            <span className="reportinput reportdateinput">
              {endDate == "" ? <p>Select Date (YYYY-MM-DD)</p> : null}
              <input
                className="dateinput"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </span>
            <div className="reportdownloadbtncon">
              <p className="reportdownloadbtn">Download as Excel</p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
