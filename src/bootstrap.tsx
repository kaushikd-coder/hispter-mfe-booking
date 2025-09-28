import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import DevPreview from "./dev/DevPreview";

const container = document.getElementById("root") as HTMLElement; 
const root = createRoot(container);
root.render(<DevPreview />);
