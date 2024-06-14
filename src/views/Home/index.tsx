import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useSignTx, useWalletAddress } from "bitcoin-wallet-adapter";
import { updateOrder } from "@/apiHelper/brodcast";

const HomePage = () => {
  const walletDetails = useWalletAddress();
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState({
    base64String: "",
    fileType: "",
    fileSize: "",
    fileName: "",
  });
  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [action, setAction] = useState<string>("dummy");
  const [txLink, setTxLink] = useState("");
  const [orderId, setOrderId] = useState("");
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
            base64String: base64, // Remove the prefix
            fileType: mimeType || "application/octet-stream",
            fileSize: file_size,
            fileName: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  console.log(unsignedPsbtBase64, "unsignedPsbtBase64");
  console.log(orderId, "order id");
  const handleMint = async () => {
    try {
      const formData = new FormData();
      formData.append("base64", fileData.base64String);
      formData.append("file_name", fileData.fileName);
      formData.append("file_type", fileData.fileType);
      formData.append("file_size", fileData.fileSize.toString()); // Convert file size to string
      formData.append("cardinal_pubkey", walletDetails?.cardinal_pubkey ?? "");
      formData.append(
        "cardinal_address",
        walletDetails?.cardinal_address ?? ""
      );
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

      console.log(response.data, "response I get");
      setUnsignedPsbtBase64(response.data.psbt);
      setOrderId(response.data.orderId);
    } catch (error) {
      console.error("Error while minting:", error);
    }
  };

  const signTx = useCallback(async () => {
    if (!walletDetails) {
      alert("connet wallet to procced");
      return;
    }
    let inputs = [];
    inputs.push({
      address: walletDetails.cardinal_address,
      publickey: walletDetails.cardinal_pubkey,
      sighash: 1,
      index: [0],
    });

    const options: any = {
      psbt: unsignedPsbtBase64,
      network: "testnet",
      action: "dummy",
      inputs,
    };
    // console.log(options, "OPTIONS");

    await sign(options);
  }, [action, unsignedPsbtBase64]);

  useEffect(() => {
    // Handling Wallet Sign Results/Errors
    if (result) {
      // Handle successful result from wallet sign
      console.log("Sign Result:", result);

      if (result) {
        broadcast(result);
      }

      // Additional logic here
    }

    if (error) {
      console.error("Sign Error:", error);

      alert("Wallet error occurred");

      setLoading(false);
      // Additional logic here
    }

    // Turn off loading after handling results or errors
    setLoading(false);
  }, [result, error]);

  const broadcast = async (signedPsbt: string) => {
    try {
      const broadcast_res = await updateOrder(orderId, signedPsbt);
      setLoading(false);
    if(broadcast_res?.txid){
      setTxLink(`https://mempool.space/testnet/tx/${broadcast_res.txid}`);
      window.open(`https://mempool.space/testnet/tx/${broadcast_res.txid}`,"_blank");
      alert(`Broadcasted ${action} Tx Successfully`);
    }
   else{
    console.log("no txid")
    alert(`Broadcasted ${action} Tx failed`);
   }

      
    } catch (err) {
      // Track error in broadcasting
      setLoading(false);
      alert("error in brodcasting");
    }
  };

  return (
    <div className="">
      {!unsignedPsbtBase64 && (
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
            <img src={fileData.base64String} alt={fileData.base64String} />
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
      )}

      {unsignedPsbtBase64 && (
        <div className="pt-4 ">
          <div
            className="text-white border flex w-full justify-center items-center bg-accent px-4 py-2"
            onClick={signTx}
          >
            Pay
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
