﻿import './App.css';
import 'font-awesome/css/font-awesome.min.css';
import logo from './images/Cyborx Logo.png';
import videoSrc from './images/Cyborx Background.mp4';
import cyborx from "./images/Full Cyborx.png";
import connectWalletImg from "./images/Connect Wallet.png"
import disconnectWalletImg from "./images/Disconnect.png"
import mintImg from "./images/Mint.png"
import whiteListImg from "./images/Whitelist Sale.png"
import footer from "./images/footer.png"
import React, { useState, useEffect } from "react";

import axios from 'axios';

import CyborxContract from './contract/CyborxContract.json';
import { ethers, utils } from "ethers";
import Countdown from "react-countdown";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initOnboard } from "./utils/walletService"

function App() {
  return (
    <>
      <MainComponent />
      <ToastContainer autoClose={5000} hideProgressBar />
    </>
  )
}

function MainComponent() {
  const [walletAddr, setWalletAddr] = useState("");

  // mandox
  const [isStarted, setIsStarted] = useState(false);
  const [statusShow, setStatusShow] = useState(false);
  const [mintCount, setMintCount] = useState(1);
  const [mintFlag, setMintFlag] = useState(false);
  const [onboard, setOnboard] = useState();
  const [walletConnected, setWalletConnected] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [maxMintCount, setMaxMintCount] = useState(5);
  useEffect(() => {
    const _onboard = initOnboard({
      address: (address) => {
        console.log('address callback: ', address);
        setWalletAddress(address);
        if (!!address) {
          setWalletAddr(
            shortenHex(address)
          );
        } else {
          setWalletConnected(false);
        }
      },
      network: (network) => {
        console.log('network callback: ', network)
      },
      balance: (balance) => {
        console.log('balance', balance);
      },
      wallet: async (wallet) => {
        console.log('wallet', wallet);
        if (wallet.provider) {
          let ethersProvider = new ethers.providers.Web3Provider(wallet.provider);
          let _nftContract = new ethers.Contract(CyborxContract.networks[1].address, CyborxContract.abi, ethersProvider.getUncheckedSigner());
          setContract(_nftContract);
          let _totalSupply = await _nftContract.totalSupply();
          setTotalSupply(Number(_totalSupply));
          let _maxTokenNumber = await _nftContract.MAX_ELEMENTS();
          setMaxTokenNumber(Number(_maxTokenNumber));
          setStatusShow(true);
        }
      }
    })

    setOnboard(_onboard)
  }, [])

  const connectWallet = async () => {
    if (onboard) {
      const walletSelected = await onboard.walletSelect()
      if (!walletSelected) return

      console.log('wallet selected: ', walletSelected)
      const readyToTransact = await onboard.walletCheck()
      console.log('Wallet selected: ', walletSelected, ' Ready to transact: ', readyToTransact)
      if (walletSelected && readyToTransact) {
        setWalletConnected(true);
      }
    }
  };

  const disconnectWallet = async () => {
    if (onboard) {
      onboard.walletReset();
    }
  }

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    console.log('completed', completed);
    if (completed) {
      // Render a complete state
      setIsStarted(true);
      return (
        <div>
          Count down is finished and You can mint now!
        </div>
      );
    } else {
      // Render a countdown
      return (
        <div className="count-down">
          <img style={{ width: 380 }} className="whitelist-img" src={whiteListImg} /> <br/>
          {days > 0 ? (<span className="count-box">{days}d</span>) : ''}
          <span className="count-box">{hours}h</span>
          <span className="count-box">{minutes}m</span>
          <span className="count-box">{seconds}s</span> <br />
        </div>
      );
    }
  };

  const shortenHex = (hex, length = 4) => {
    return `${hex.substring(0, length + 2)}…${hex.substring(
      hex.length - length
    )}`;
  }

  const [contract, setContract] = useState(null);
  const [maxTokenNumber, setMaxTokenNumber] = useState(1000);
  const [totalSupply, setTotalSupply] = useState(0);

  async function estimateGas() {
    let responseValue;
    try {
      await axios.get(`https://ethgasstation.info/api/ethgasAPI.json?api-key=c94facbd2247d1a3d63557a1caf6d9e126c943e1a5294d0ccef18006651b`).then(res => {
        responseValue = res.data.safeLow / 10;
      })
    } catch (e) {
      responseValue = 70;
    }
    return responseValue;
  }

  const mint = async (numberofTokens) => {
    if (contract) {
      console.log('contract', contract);
      let _totalSupply = await contract.totalSupply();
      setTotalSupply(Number(_totalSupply));
      const privateSale = await contract.privateSaleIsActive();
      let mintPrice = 0;
      if (privateSale) {
        setMaxMintCount(5);
        mintPrice = await contract.privateMintPrice();
      } else {
        setMaxMintCount(20);
        mintPrice = await contract.publicMintPrice();
      }
      const price = Number(mintPrice) * numberofTokens;
      setStatusShow(true);
      try {
        setMintFlag(true);
        await contract.mint(numberofTokens, { from: walletAddress, value: String(price) }).then((result) => {
          // await contract.mint(numberofTokens, { from: walletAddress, value: String(price), gasPrice: ethers.utils.parseUnits(String(gas), 'gwei') }).then((result) => {
          console.log(result);
          setTotalSupply(totalSupply + numberofTokens);
          setMintCount(1);
          setMintFlag(false);
        })

      } catch (err) {
        setMintFlag(false);
        console.log('error minting:', err);
        if (err.constructor !== Object) {
          if (String(err).includes('"code":-32000')) {
            toast.error('Error: insufficient funds for intrinsic transaction cost');
          } else {

            let startingIndex = String(err).indexOf('"message"');
            let endingIndex = String(err).indexOf('"data"');
            let sub1 = String(err).substring(startingIndex, endingIndex);

            let sub2 = sub1.replace('"message":"', '');
            let ret = sub2.replace('",', '');
            toast.error(ret.charAt(0).toUpperCase() + ret.slice(1));
          }
        } else if (err.code === 4001) {
          toast.error('User Cancelled transaction');
        }
      }
    }
  };

  return (
    <div className="App">
      <div>
        <video autoPlay muted loop id="myVideo">
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
      <div className="mint-section">
        <img className="logo-img" src={logo} />
      </div>
      <div className="cyborx">
        <img className="cyborx-img" src={cyborx} />
      </div>
      <div className={`main-section ` + (walletConnected ? "connected" : " ")}>
        {
          !isStarted && (
            <div className="count-down">
              <Countdown className="mt-5" date={new Date("2022-04-13T15:00:00+0000")} renderer={renderer} />
            </div>
          )
        }
        {
          isStarted && !walletConnected && (
            <>
                <a className="btn btn-connect" onClick={() => connectWallet()}><img src={connectWalletImg} /></a>
            </>
          )
        }
        {
          isStarted && walletConnected && (
            <>
              <div>
                <div className="qty">
                  <span className="minus bg-dark" onClick={(e) => setMintCount(mintCount > 1 ? mintCount - 1 : 1)}>-</span>
                  <input type="number" className="count" name="qty" value={mintCount} disabled />
                  <span className="plus bg-dark" onClick={(e) => setMintCount(mintCount < maxMintCount ? mintCount + 1 : maxMintCount)}>+</span>
                </div>
              </div>
              <div className="mt-3">
                <a className="btn btn-connect" onClick={() => mint(mintCount)} disabled={mintFlag}>{mintFlag ? <i className="fa fa-spinner fa-spin"></i> : <img style={{ width: 120 }} src={mintImg} />}</a>
              </div>
              <a className="btn btn-connect btn-disconnect" onClick={() => disconnectWallet()} ><img src={disconnectWalletImg} /></a>
            </>
          )
        }
      </div>

      <div className="content">
        <img src={footer} />
      </div>
    </div>
  );
}

export default App;
