"use server"
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import { MintData } from "@/models";
export async function updateOrder(orderId:string, signPsbt:string){
if(!orderId || !signPsbt){
    console.log("please provided orderId and signPsbt")
    throw Error("please provided orderId and signPsbt");
    
}
try {
    const url =
    process.env.NEXT_PUBLIC_NETWORK === "testnet"
      ? `https://mempool.space/testnet/api/tx`
      : `https://mempool-api.ordinalnovus.com/tx`;
  bitcoin.initEccLib(secp256k1); 

  let parsedPsbt = bitcoin.Psbt.fromBase64(signPsbt);
    for (let i = 0; i < parsedPsbt.data.inputs.length; i++) {
      try {
        parsedPsbt.finalizeInput(i);
      } catch (e) {
        console.error(`Error finalizing input at index ${i}: ${e}`);
      }
    }
    const signed_psbt_hex = parsedPsbt.extractTransaction().toHex();

    const broadcastRes = await fetch(url, {
        method: "post",
        body: signed_psbt_hex,
      });
  
      if (broadcastRes.status != 200) {
        throw Error(
          "error broadcasting tx " +
            broadcastRes.statusText +
            "\n\n" +
            (await broadcastRes.text())
        );
      }
      const txid = await broadcastRes.text();
      const result = await MintData.updateOne(
        { orderId },
        {
          $set: {
            txid,
            status: "payment received",
          },
        }
      );

      return { success: true, message: "Order updated successfully", txid };
} catch (error) {
    
}
}

