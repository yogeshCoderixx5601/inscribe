import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useWalletAddress } from "bitcoin-wallet-adapter";

const HomePage = () => {
  const walletDetails = useWalletAddress();
  const [fileData, setFileData] = useState({
    base64String: "",
    fileType: "",
    fileSize: "",
    fileName: "",
  });
  // Define the maximum file size (3MB)
  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

  // Function to handle the image file upload and processing
  const handleImage = (e: any) => {
    const file = e.target.files[0];
    console.log(file, "file");

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const base64 = reader.result as string;

          // Extract the file type from the Base64 string
          const mimeType = base64.split(",")[0].match(/:(.*?);/)?.[1];

          // Calculate the file size
          const file_size = file.size;

          // Ensure file size does not exceed the maximum limit
          if (file_size > MAX_FILE_SIZE) {
            throw new Error(`File exceeds the 3MB size limit`);
          }

          // Set the state object with the Base64 string, file type, and file size
          setFileData({
            base64String: base64.split(",")[1], // Remove the prefix
            fileType: mimeType || "application/octet-stream",
            fileSize: file_size,
            fileName: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMint = async () => {
    try {
      const formData = new FormData();
      formData.append("base64", fileData.base64String);
      formData.append("file_name", fileData.fileName); 
      formData.append("file_type", fileData.fileType); 
      formData.append("file_size", fileData.fileSize.toString()); // Convert file size to string
      formData.append("cardinal_pubkey", walletDetails?.cardinal_pubkey ?? "");
      formData.append("cardinal_address", walletDetails?.cardinal_address ?? "");
      formData.append("ordinal_address", walletDetails?.ordinal_address ?? "");
      formData.append("ordinal_pubkey", walletDetails?.ordinal_pubkey ?? "");
      formData.append("wallet", walletDetails?.wallet ?? "");
      formData.append("order_id", uuidv4());
      formData.append("status", "pending");

      const response = await axios.post(
        "http://localhost:3000/api/mint",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(response, "response I get");
    } catch (error) {
      console.error("Error while minting:", error);
    }
  };

  return (
    <div>
      <form>
        <input type="file" onChange={handleImage} />
      </form>
      {fileData.fileType && (
        <div>
          <h3>File Type:</h3>
          <p>{fileData.fileType}</p>
        </div>
      )}
      <div className="w-[300px] h-[300px]">
        <img src={fileData.base64String} alt="" />
      </div>
      <div className="flex w-full">
        <div
          className="border border-accent flex w-full justify-center items-center hover:bg-accent_dark bg-accent"
          onClick={handleMint}
        >
          {" "}
          Submit
        </div>
      </div>
    </div>
  );
};

export default HomePage;
