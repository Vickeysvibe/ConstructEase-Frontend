import '../App.css';
import './Navbar.css';
import Sidemenu from './Sidemenu';

import logo from '../assets/logo.png';
import { LuMenu } from 'react-icons/lu';
import { IoClose } from "react-icons/io5";

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({siteId}) {
    const location = useLocation();
    const [ddopn, setddopn] = useState(false);
    const [inlogin, setinlogin] = useState(true);
    const [sidemenuval, setsidemenuval] = useState(null);

    const Navlinks = [
        { title: 'Master', link: '/master/client' },
        { title: 'Master', link: '/master/product' },
        { title: 'Attendance', link: '/attendance/labour' },
        { title: 'Purchase Management', link: '/purchase/order' },
        { title: 'Site Activity', link: '/activity/todo' },
        { title: 'Report Generation', link: '/report/labourwise' }
    ];

    useEffect(() => {
        const excludedPaths = ['/', '/login', '/dashboard'];
        setinlogin(!excludedPaths.includes(location.pathname));
    }, [location.pathname]);

    return (
        <nav>
            <div className="navcon">
                <div className="logocon">
                    <img src={logo} alt="Logo" />
                    <p>ConstructEaze</p>
                </div>
                {inlogin && (
                    <div className="navlinkscon">
                        {Navlinks.map((val, key) => (
                            <Link
                                key={key}
                                to={val.link}
                                onClick={() => setsidemenuval(key)}
                                className={`navlinks ${location.pathname === val.link ? 'active' : ''}`}>
                                {val.title}
                            </Link>
                        ))}
                    </div>
                )}
                <div
                    className="logoutbtn"
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }}>
                    Logout
                </div>
                <p onClick={() => setddopn(prev => !prev)} className="burgerbtn">
                    {ddopn ? <IoClose /> : <LuMenu />}
                </p>
            </div>

            {ddopn && (
                <div className="navdropdown">
                    {Navlinks.map((val, key) => (
                        <Link
                            key={key}
                            onClick={() => {
                                setddopn(false);
                                setsidemenuval(key);
                            }}
                            to={val.link}
                            className="navlinksdd">
                            {val.title}
                        </Link>
                    ))}
                    <p
                        style={{ color: 'red' }}
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}>
                        Logout
                    </p>
                </div>
            )}

            {inlogin && <Sidemenu navlink={Navlinks[sidemenuval]} siteId={siteId} />}
        </nav>
    );
}
