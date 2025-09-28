import React from "react";

const RemoteApp = () => {
  return (
    <div className="p-5 border-2 border-dashed border-indigo-500 rounded-xl mt-5 bg-red-200">
      <h2 className="text-2xl font-bold text-indigo-600">I'm the Remote App</h2>
      <p className="text-gray-700">This component is exposed via Module Federation.</p>
    </div>
  );
};

export default RemoteApp;
