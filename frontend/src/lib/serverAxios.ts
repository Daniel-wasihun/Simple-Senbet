import axios from "axios";

// Server-side axios instance that doesn't rely on browser-specific features
const serverAxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL , // Direct URL for server requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default serverAxiosInstance;
