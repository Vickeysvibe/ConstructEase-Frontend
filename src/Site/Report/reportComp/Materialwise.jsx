// import '../App.css';
import "../Report.css";

import { useState } from "react";

export default function materialwise() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const products = ["qwert", "dfga", "ugfcvt", "gfxdfcgvhb", "gfxhbv", "d"];

  return (
    <>
      <main className="reportmain">
        <section className="reportsec">
          <h1>Materials Report</h1>
          <form className="reportform">
            <label>Select Material :</label>
            <select className="reportinput">
              {products.map((product) => {
                return (
                  <option key={product} value={product}>
                    {product}
                  </option>
                );
              })}
            </select>

            <label>Start Date :</label>
            <span className="reportinput reportdateinput">
              {startDate == "" ? <p>Select Date (YYYY-MM-DD)</p> : null}
              <input
                className="dateinput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </span>

            <label>End Date :</label>
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
