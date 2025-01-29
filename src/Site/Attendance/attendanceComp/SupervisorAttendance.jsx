import { useState, useEffect } from 'react';
// import '../App.css';
import '../Attendance.css';

export default function SupervisorAtt() {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const today = new Date();
        const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        setCurrentDate(formattedDate);
    }, []);
    const SupervisorAtthead = ['Serial No', 'Name', 'Attendance', 'Location', 'CheckIn', 'CheckOut'];

    const SupervisorAtt = [
        {
            id: 1,
            name: 'John Doe',
            Attendance: 'Present',
            Location: 'Chennai',
            CheckIn: '5:00am',
            CheckOut: '5:00pm'

        },
        {
            id: 2,
            name: 'John ',
            Attendance: 'Present',
            Location: 'pondy',
            CheckIn: '5:00am',
            CheckOut: '1:00pm'

        },
        
    ];

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState(SupervisorAtt);

    useEffect(() => {
        const result = SupervisorAtt.filter((worker) =>
            worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.Attendance.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.Location.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(result);
    }, [searchTerm]);

    return (
        <>
            <main className="attendancemain">
                <section className="attendancesec">
                    <div className="searchcon">
                        <h1>Supervisor Manage</h1>
                        <div className="inpcon">
                            <input
                                type="search"
                                className='search'
                                placeholder='Search by name,location'
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value) }}
                            />
                            <p>Search</p>
                            {/* <p className="datetxt">|</p>
                            <p className="datetxt">{currentDate}</p> */}
                        </div>
                    </div>
                    <div className="tablecon">
                        {filteredData.length > 0 ? (
                            <table className="attendancetable">
                                <thead>
                                    <tr>
                                        {SupervisorAtthead.map((header, index) => (
                                            <th className="attendanceth" key={index}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((worker, index) => (
                                        <tr key={worker.id}>
                                            <td className="attendancetd">{index + 1}</td>
                                            <td className="attendancetd">{worker.name}</td>
                                            <td className="attendancetd">{worker.Attendance}</td>
                                            <td className="attendancetd">{worker.Location}</td>
                                            <td className="attendancetd">{worker.CheckIn}</td>
                                            <td className="attendancetd">{worker.CheckOut}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No result found</p>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}
