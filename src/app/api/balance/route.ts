import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnenct";
import { MintData } from "@/models";

const MEMPOOL_API_URL = "https://mempool.space/testnet/api";

async function getBalance(address: string) {
  try {
    const response = await axios.get(
        `https://mempool.space/testnet/api/address/${address}`
      );
    const { data: responseData } = response;
    console.log("dataaaaaaaaaaaaaa from mempoooooollllll",response,)
    return {
      confirmedBalance:
        responseData.chain_stats.funded_txo_sum -
        responseData.chain_stats.spent_txo_sum,

      mempoolBalance:
        responseData.mempool_stats.funded_txo_sum -
        responseData.mempool_stats.spent_txo_sum,
    };
  } catch (err:any) {
    console.log(
      "Error occured while fetching balance from mempool api",
      err.message || err
    );
    throw new Error("Error occured while fetching balance from mempool api");
  }
}

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("************balance api called*************");
  try {
    await dbConnect();
    const pendingPayment = await MintData.findOne({
      status: "payment pending",
    });
    if (!pendingPayment) {
      console.log("no pending payment");
      return NextResponse.json({
        success: true,
        message: "no pending payment",
      });
    }
    console.log(pendingPayment, "pending payment");
    // mempool api se data fetch krenge
    const fetchedBalance = await getBalance(pendingPayment.inscription_address);

    console.log("fetcheeeeeddddddddd", fetchedBalance);

    if (
        fetchedBalance.confirmedBalance <
          pendingPayment.inscription_fee &&
        fetchedBalance.mempoolBalance < pendingPayment.inscription_fee
      ) {
        return NextResponse.json(
          { message: "Insufficient balance to proceed" },
          { status: 400 }
        );
      }
  
      // agr success hota h, then update the status
      pendingPayment.status = "funded";
      await pendingPayment.save();
  
      return NextResponse.json(
        { message: "Payment received successfully" },
        { status: 200 }
      );
    } catch (err: any) {
      return NextResponse.json(
        { message: "Error while fetching balance" },
        { status: 500 }
      );
    }
  }