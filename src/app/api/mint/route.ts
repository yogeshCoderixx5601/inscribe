import dbConnect from "@/lib/dbConnenct";
import { NextRequest, NextResponse } from "next/server";
import mime from "mime-types";
//@ts-ignore
import { Tap, Script, Address, Signer, Tx } from "@cmdcode/tapscript";
//@ts-ignore
import * as cryptoUtils from "@cmdcode/crypto-utils";
import { ICreateInscription, IDocProcessed } from "@/types";
import { MintData } from "@/models";
import { generateUnsignedPsbtForInscription } from "@/utils/psbt";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    console.log(formData, "Form Data in route");
    await dbConnect();
    console.log("Database connected");
    const base64 = formData.get("base64")?.toString();
    const file_name = formData.get("file_name")?.toString();
    const file_type = formData.get("file_type")?.toString();
    const file_size = Number(formData.get("file_size"));
    const cardinal_address = formData.get("cardinal_address")?.toString();
    const cardinal_pubkey = formData.get("cardinal_pubkey")?.toString();
    const ordinal_address = formData.get("ordinal_address")?.toString();
    const ordinal_pubkey = formData.get("ordinal_pubkey")?.toString();
    const wallet = formData.get("wallet")?.toString();
    const order_id = formData.get("order_id")?.toString();

    if (
      !file_name ||
      !base64 ||
      !file_type ||
      !file_size ||
      !cardinal_address ||
      !cardinal_pubkey ||
      !ordinal_address ||
      !ordinal_pubkey ||
      !wallet ||
      !order_id
    ) {
      throw Error("Items missing");
    }

    let doc: ICreateInscription = {
      file_name,
      file_type,
      file_size,
      base64,
      cardinal_address,
      cardinal_pubkey,
      ordinal_address,
      ordinal_pubkey,
      wallet,
      order_id,
      status: "payment pending",
      fee_rate: 262,
      privkey: "", // Default value for privkey
      inscription_address: "", // Default value for inscription_address
      txid: "", // Default value for txid
      leaf: "", // Default value for leaf
      tapkey: "", // Default value for tapkey
      cblock: "", // Default value for cblock
      inscription_fee: 0, // Default value for inscription_fee
      inscription_id: "", // Default value for inscription_id
      network: "testnet", // Set to "testnet"
    };

    const data : any = await processInscription(doc, "testnet");

    const inscription = data; // doc 
    console.log(inscription,"inscription in route main")


    const { psbt } = await generateUnsignedPsbtForInscription(
      inscription.cardinal_address,
      inscription.cardinal_pubkey,
      inscription.fee_rate,
      wallet,
      [inscription],
    );
// 
    console.log({ psbt });
    data.psbt = psbt;

    await dbConnect();
    // Create the document
    const newDocument = await MintData.create(data);
    const inscriptionDetails = await MintData.create(inscription);
    console.log(inscriptionDetails, "inscriptionDetails db");
    return NextResponse.json({ success: true, message: "ins generated" });
  } catch (error) {
    console.log(error, "error");
    return NextResponse.json({ success: false, message: "ins generate error" });
  }
}

const PREFIX = 160;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte: number) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function generatePrivateKey() {
  let isValid = false;
  let privkey;
  while (!isValid) {
    privkey = bytesToHex(cryptoUtils.Noble.utils.randomPrivateKey());
    const KeyPair = cryptoUtils.KeyPair;
    let seckey = new KeyPair(privkey);
    let pubkey = seckey.pub.rawX;
    const init_script = [pubkey, "OP_CHECKSIG"];
    let init_leaf = await Tap.tree.getLeaf(Script.encode(init_script));
    let [init_tapkey, init_cblock] = await Tap.getPubKey(pubkey, {
      target: init_leaf,
    });
    /**
     * This is to test IF the tx COULD fail.
     * This is most likely happening due to an incompatible key being generated.
     */
    const test_redeemtx = Tx.create({
      vin: [
        {
          txid:
            "a99d1112bcb35845fd44e703ef2c611f0360dd2bb28927625dbc13eab58cd968",
          vout: 0,
          prevout: {
            value: 10000,
            scriptPubKey: ["OP_1", init_tapkey],
          },
        },
      ],
      vout: [
        {
          value: 8000,
          scriptPubKey: ["OP_1", init_tapkey],
        },
      ],
    });
    const test_sig = await Signer.taproot.sign(seckey.raw, test_redeemtx, 0, {
      extension: init_leaf,
    });
    test_redeemtx.vin[0].witness = [test_sig.hex, init_script, init_cblock];
    isValid = await Signer.taproot.verify(test_redeemtx, 0, { pubkey });
    if (!isValid) {
      console.log("Invalid key generated, retrying...");
    } else {
      console.log({ privkey });
    }
  }
  if (!privkey) {
    throw Error("No privkey was generated");
  }
  return privkey;
}

async function processInscription(
  doc: IDocProcessed,
  network: "testnet" | "mainnet"
) {
  const ec = new TextEncoder();
  // let total_fee = 0;
  // Loop through all files
  const privkey = await generatePrivateKey();
  // Generate pubkey and seckey from privkey
  const KeyPair = cryptoUtils.KeyPair;
  const seckey = new KeyPair(privkey);
  const pubkey = seckey.pub.rawX;
  console.log({
    fee_rate: doc.fee_rate,
    data: doc.base64,
  });
  if (!doc.file_name) {
    throw Error("File Name is missing");
  }
  // generate mimetype, plain if not present
  const mimeType = mime.lookup(doc.file_name);
  const contentType = mime.contentType(doc.file_name);

  let file_type = mimeType;
  if (
    mimeType &&
    mimeType.includes("text") &&
    typeof contentType === "string"
  ) {
    file_type = contentType.split(" ").join("");
  } // generate metaprotocol as we are creating CBRC
  // const metaprotocol = `cbrc-20:${file.op.toLowerCase()}:${file.tick
  //   .trim()
  //   .toLowerCase()}=${file.amt}`;
  // data can be whats shared by the frontend as base64
  const data = Buffer.from(doc.base64, "base64");

  if (!file_type) {
    throw Error("Filetype not present");
  }
  // console.log({ metaprotocol, mimetype });
  // create the script using our derived info
  const script = [
    pubkey,
    "OP_CHECKSIG",
    "OP_0",
    "OP_IF",
    ec.encode("ord"),
    "01",
    ec.encode(file_type),
    // "07",
    // ec.encode(metaprotocol),
    "OP_0",
    data,
    "OP_ENDIF",
  ];
  // create leaf and tapkey and cblock
  const leaf = Tap.tree.getLeaf(Script.encode(script));
  const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: leaf });
  // Generated our Inscription Address
  //@ts-ignore
  let inscriptionAddress = Address.p2tr.encode(tapkey, network);
  console.debug("Inscription address: ", inscriptionAddress);
  console.debug("Tapkey:", tapkey);
  console.log(mimeType);
  // 6674960
  let txsize = PREFIX + Math.floor(data.length / 4);

  let inscription_fee = doc.fee_rate * txsize;
  doc.inscription_fee = inscription_fee;
  // total_fee += inscription_fee;
  console.log({ txsize, inscription_fee });
  const inscription = {
    ...doc,
    order_id: doc.order_id,
    privkey,
    leaf: leaf,
    tapkey: tapkey,
    cblock: cblock,
    inscription_address: inscriptionAddress,
    txsize: txsize,
    fee_rate: doc.fee_rate,
    network,
  };
  console.log(inscription, "process inscription response");
  return inscription;
}
