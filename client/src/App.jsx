import { useEffect, useState } from "react";
import httpClient from "./api/httpClient";

function App() {
  const [status, setStatus] = useState("Checking API...");

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await httpClient.get("/health");
        setStatus(response.data.message);
      } catch (error) {
        console.error(error);
        setStatus("Cannot connect to backend"); f
      }
    };

    checkApi();
  }, []);

  return (
    <main>
      <h1>Classroom Management App</h1>
      <p>{status}</p>
    </main>
  );
}

export default App;