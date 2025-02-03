import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../Attendance.css";
import { request } from "../../../api/request";

export default function SupervisorAtt() {
    const [currentDate, setCurrentDate] = useState("");
    const [supervisorAtt, setSupervisorAtt] = useState([]);
    const { siteId: site } = useParams();

    useEffect(() => {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
        setCurrentDate(formattedDate);
        fetchSupervisors();
    }, []);

    const fetchSupervisors = async () => {
        try {
            const response = await request("GET", `/attendance/supervisors?siteId=${site}`);
            setSupervisorAtt(response);
        } catch (error) {
            console.error("Error fetching supervisors:", error);
            setSupervisorAtt([]);
        }
    };

    return (
        <main className="attendancemain">
            <section className="attendancesec">
                <div className="searchcon">
                    <h1>Supervisor Manage</h1>
                    <div className="inpcon">
                        <p className="adtxt">{currentDate}</p>
                    </div>
                </div>
                <div className="tablecon">
                    {supervisorAtt.length > 0 ? (
                        <table className="attendancetable">
                            <thead>
                                <tr>
                                    <th className="attendanceth">Serial No</th>
                                    <th className="attendanceth">Name</th>
                                    <th className="attendanceth">Location</th>
                                    <th className="attendanceth">CheckIn</th>
                                    <th className="attendanceth">CheckOut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supervisorAtt.map((worker, index) => (
                                    <tr key={index}>
                                        <td className="attendancetd">{index + 1}</td>
                                        <td className="attendancetd">{worker.name || "N/A"}</td>
                                        <td className="attendancetd">{worker.location?.address || "N/A"}</td>
                                        <td className="attendancetd">
                                            {worker.checkinTime 
                                                ? new Date(worker.checkinTime).toLocaleString() 
                                                : "N/A"}
                                        </td>
                                        <td className="attendancetd">
                                            {worker.checkoutTime 
                                                ? new Date(worker.checkoutTime).toLocaleString() 
                                                : "N/A"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No attendance records found for today</p>
                    )}
                </div>

                {/* Show raw response for debugging */}
               
            </section>
        </main>
    );
}
