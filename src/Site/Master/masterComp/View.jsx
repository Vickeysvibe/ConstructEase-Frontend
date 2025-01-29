const View = ({ view,setView}) => {
    console.log("View Prop:", view);
  
    return (
      <div className="view-pg" onClick={()=>{setView(false)}} >
        <div className="view-card">
          {view ? (
            <div>
              <ul>
                {Object.entries(view).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key.toUpperCase()}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No details available.</p>
          )}
        </div>
      </div>
    );
  };
  export default View;
  