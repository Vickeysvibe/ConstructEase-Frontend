import { useState } from 'react'
import '../Activity.css'
export default function Funds() {
    const [payfor, setpayfor] = useState(0);
    return (
        <>
            <main className="funds-main">
                <p className='funds-nav'>
                    <p
                        onClick={() => setpayfor(0)}
                        className={`funds-nav-items ${payfor === 0 ? "highlight" : ""}`}
                    >
                        Vendor Payments
                    </p>|
                    <p onClick={() => setpayfor(1)}
                        className={`funds-nav-items ${payfor === 1 ? "highlight" : ""}`}>
                        Labour Payments
                    </p>|
                    <p onClick={() => setpayfor(2)}
                        className={`funds-nav-items ${payfor === 2 ? "highlight" : ""}`}>
                        Client Payments
                    </p>
                    <p onClick={() => setpayfor(3)}
                        className={`funds-nav-items ${payfor === 3 ? "highlight" : ""}`}>
                        Others
                    </p>

                </p>
                {payfor == 0 ? (
                    <div className="funds-cards-container">
                        <div className="funds-card">
                            <p className="funds-card-title">Vendor Name</p>
                            <p className="funds-card-amount">Total: $1000</p>
                            <p className="funds-card-amount">Paid: $100 </p>
                        </div>
                    </div>
                ) : payfor == 1 ? (
                    <p></p>
                ) : payfor == 2 ? (
                    <p></p>
                ) : (
                    <p></p>)}

            </main>
        </>
    )
}