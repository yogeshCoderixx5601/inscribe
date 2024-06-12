"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ConnectMultiButton,
  Notification,
  useWalletAddress,
} from "bitcoin-wallet-adapter";
// import { fetchFees, getBTCPriceInDollars, shortenString } from "@/utils";
import { useDispatch, useSelector } from "react-redux";
// import { RootState } from "@/stores";
import {
  FaDiscord,
  FaFaceFrown,
  FaFaceGrinStars,
  FaFaceMeh,
  FaFaceSadCry,
  FaFaceSmile,
  FaFaceSmileWink,
  FaPowerOff,
  FaXTwitter,
} from "react-icons/fa6";
import { FiCopy } from "react-icons/fi";
import { Popover } from "@mui/material";
import { shortenString } from "@/utils";

// import { addNotification } from "@/stores/reducers/notificationReducer";
// import copy from "copy-to-clipboard";
import { MdOutlineDashboard } from "react-icons/md";
// import { setBalanceData } from "@/stores/reducers/generalReducer";

const Header = () => {
  const walletDetails = useWalletAddress();

  return (
    <div className="fixed left-0 right-0 top-0 z-[1200] bg-primary w-full">
      <header className="w-full">
        <div className="lg:flex w-full justify-between p-6 items-center border-b border-[#191919] ">
          <div className="w-3/12 btn relative inline-flex items-center lg:justify-end overflow-hidden font-medium rounded group cursor-default">
            <ConnectMultiButton
              modalContentClass="bg-primary border rounded-xl border-accent overflow-hidden relative lg:p-16 md:p-12 p-6"
              buttonClassname={`text-white rounded flex items-center px-4 py-[10px] ${
                walletDetails
                  ? "font-bold bg-secondary  border border-accent rounded-md opacity-90  walletButton"
                  : "font-light bg-gradient-to-b from-accent to-gradient_bg_second"
              }`}
              headingClass="text-center text-white pt-2 pb-2 text-3xl capitalize font-bold mb-4"
              walletItemClass="w-full bg-accent_dark my-3 hover:border-accent border border-transparent "
              walletLabelClass="text-lg text-white capitalize tracking-wider"
              walletImageClass="w-[30px]"
              InnerMenu={InnerMenu}
              //   balance={balanceData?.balance}
            />
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;

export const Face = ({ balance }: { balance: number }) => {
  let balInBTC = balance / 100_000_000;

  console.log({ balInBTC }, "BTCBAL");

  // Check from the highest threshold down to the lowest
  if (balInBTC >= 0.01) {
    return <FaFaceSmileWink />;
  } else if (balInBTC >= 0.001) {
    return <FaFaceSmile />;
  } else if (balInBTC >= 0.0005) {
    return <FaFaceMeh />;
  } else if (balInBTC >= 0.0001) {
    return <FaFaceFrown />;
  } else if (balInBTC <= 0) {
    return <FaFaceSadCry />;
  } else {
    // For any case not covered above, though technically this branch might never be reached with the current logic
    return <FaFaceGrinStars />;
  }
};

export const InnerMenu = ({ anchorEl, open, onClose, disconnect }: any) => {
  const walletDetails = useWalletAddress();
  //   const balanceData = useSelector(
  //     (state: RootState) => state.general.balanceData
  //   );

  //   const resetWalletDetails = () => {
  //     // reseting the balance data in redux store
  //     dispatch(setBalanceData(null));

  //     // clearing the localstorage
  //     Object.entries(localStorage).forEach(([key]) => {
  //       if (key.startsWith("walletBalance-")) localStorage.removeItem(key);
  //     });
  //   };

  if (walletDetails)
    return (
      <Popover
        anchorEl={anchorEl}
        onClose={onClose}
        open={open}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <div className="p-6 bg-dark_violet_700 min-w-[300px] xl:min-w-[400px] max-w-[800px] relative text-white">
          <div className="intro flex items-center pb-6">
            {/* <div className="mr-2 text-3xl">
              {balanceData ? (
                <Face balance={balanceData.balance} />
              ) : (
                <FaFaceSmileWink />
              )}
            </div> */}
            <p className="uppercase font-bold text-sm">
              {shortenString(walletDetails.cardinal_address, 5)}
            </p>
          </div>
          <div className="BTCWallet flex items-center pb-6 w-full">
            <div className="mr-2">
              <img alt="" src="/static-assets/images/btc.png" width={35} />
            </div>
            <div className="flex-1 flex  items-center text-sm">
              <div>
                <p className="font-bold tracking-wider text-white">
                  BTC Wallet
                </p>
                <div className="flex items-center">
                  <p className="uppercase">
                    {(walletDetails.cardinal_address, 5)}
                  </p>
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      walletDetails?.cardinal_address + "";
                      //   dispatch(
                      //     addNotification({
                      //       id: new Date().valueOf(),
                      //       message: "Address Copied",
                      //       open: true,
                      //       severity: "success",
                      //     })
                      //   );
                    }}
                  >
                    <FiCopy className="ml-2 hover:text-green-600 transition-all" />
                  </div>
                </div>
              </div>
              {/* {balanceData && (
                <div>
                  <p className="font-bold tracking-wider text-white">
                    {(balanceData.balance / 100_000_000).toFixed(4)} BTC
                  </p>
                </div>
              )} */}
            </div>
          </div>
          <div className="OrdinalsWallet flex justify-center items-center pb-6 w-full">
            <div className="mr-2">
              <img alt="" src="/static-assets/images/ord.png" width={35} />{" "}
            </div>
            <div className="flex-1 flex justify-between items-center text-sm">
              <div className="">
                <p className="font-bold tracking-wider text-white">
                  Ordinals Wallet
                </p>
                <div className="flex items-center">
                  <p className="uppercase">
                    {(walletDetails.ordinal_address, 5)}
                  </p>
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      walletDetails?.ordinal_address + "";
                      //   dispatch(
                      //     addNotification({
                      //       id: new Date().valueOf(),
                      //       message: "Address Copied",
                      //       open: true,
                      //       severity: "success",
                      //     })
                      //   );
                    }}
                  >
                    <FiCopy className="ml-2 hover:text-green-600 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative ">
            <div className="bg-dark_violet_600 rounded cursor-pointer styled-button-wrapper my-2">
              <button
                className="accent_transition p-2 w-full"
                onClick={onClose}
              >
                <Link href="/dashboard">
                  <div className="flex justify-center items-center">
                    <MdOutlineDashboard className="mr-2" />
                    <span>Dashboard</span>
                  </div>
                </Link>
              </button>
            </div>
          </div>
          <div className="relative ">
            <div className="bg-dark_violet_600 rounded cursor-pointer styled-button-wrapper my-2">
              <button
                className="red_transition p-2 w-full flex justify-center items-center"
                onClick={() => {
                  disconnect();
                  //   resetWalletDetails();
                  onClose();
                }}
              >
                <FaPowerOff className="mr-2 " /> <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </Popover>
    );
  else ;
};
