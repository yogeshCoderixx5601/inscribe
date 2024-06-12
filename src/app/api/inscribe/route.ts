import dbConnect from "@/lib/dbConnenct";
import { MintData } from "@/models";
import { ICreateInscription } from "@/types";
import { addressReceivedMoneyInThisTx, pushBTCpmt } from "@/utils/inscribe";
import { NextRequest, NextResponse } from "next/server";
//@ts-ignore
import * as cryptoUtils from "@cmdcode/crypto-utils";
//@ts-ignore
import { Signer, Tx, Address } from "@cmdcode/tapscript";
import { writeFile } from 'fs/promises';
import path from 'path';
async function findOrder() {
  await dbConnect();
  const order = await MintData.findOne({ status: "payment received" }).limit(1);
  if (!order) {
    return { order: null, inscriptions: null };
  }
  return { order };
}


async function processInscription(inscription: ICreateInscription) {
    const KeyPair = cryptoUtils.KeyPair;
    const seckey = new KeyPair(inscription.privkey);
    const pubkey = seckey.pub.rawX;
    const txinfo = await addressReceivedMoneyInThisTx(
      inscription.inscription_address,
      inscription.network
    );
    const ec = new TextEncoder();
    const [txid, vout, value] = txinfo;
    if (
      typeof txid !== "string" ||
      typeof vout !== "number" ||
      typeof value !== "number"
    ) {
      // Handle the case where any of the values are undefined.
      // You could throw an error or perform some other action based on your application's logic.
      throw new Error(
        "Failed to retrieve transaction details from the funding address."
      );
    }
    console.log({ inscription, txinfo });
  
    const data = Buffer.from(inscription.base64, "base64");
  
    console.log({ mimetype: inscription.file_type });
  
    const script = [
      pubkey,
      "OP_CHECKSIG",
      "OP_0",
      "OP_IF",
      ec.encode("ord"),
      "01",
      ec.encode(inscription.file_type),
      "OP_0",
       data,
        "OP_ENDIF"
  
    ];
  
    const redeemtx = Tx.create({
      vin: [
        {
          txid,
          vout,
          prevout: {
            value,
            scriptPubKey: Address.toScriptPubKey(inscription.inscription_address),
          },
          witness: [],
        },
      ],
      vout: [
        {
          value: 1000,
          scriptPubKey: Address.toScriptPubKey(inscription.ordinal_address),
        },
      ],
    });
    const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
      extension: inscription.leaf,
    });
    redeemtx.vin[0].witness = [sig, script, inscription.cblock];
    const rawtx = Tx.encode(redeemtx).hex;
  saveRawTxAsJson(rawtx)
  
    async function saveRawTxAsJson(rawtx:any) {
      // Convert rawtx to JSON format
      const rawtxJson = JSON.stringify({ rawtx });
    
      // Define the file path and name
      const filePath = path.join(process.cwd(), 'rawtx.json');
    
      try {
        // Write the JSON data to a file
        await writeFile(filePath, rawtxJson, 'utf8');
        console.log('JSON file has been saved:', filePath);
      } catch (err) {
        console.error('Error writing JSON file:', err);
      }
    }
  
    
    console.log({ rawtx }, "INS TX");
    // throw Error("INS TEST");
    const txid_inscription = await pushBTCpmt(rawtx, inscription.network);
  
    console.log("INSCRIPTION TX BROADCASTED: ", txid_inscription);
    inscription.txid = txid_inscription;
    inscription.inscription_id = txid_inscription + "i" + "0";
  
    inscription.status = "inscribed";
    await (inscription as any).save();
  
    return inscription;
  }

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    await dbConnect();
    const { order } = await findOrder();
    if (!order) {
        return NextResponse.json({
          message: "No Pending Orders Have received Payment",
        });
      }
      const inscription = await processInscription(order);
    console.log("Inscription Processed: ", inscription.inscription_id);
    console.log(inscription.txid);
    return NextResponse.json({ inscription });
  } catch (error:any) {
    console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || "Error creating inscribe order" },
      { status: 500 }
    );
  }
}
