import * as React from "react";
import { useEffect, useState } from "react"
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json"
import './loader.css';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingWaves, setPendingWaves] = useState([])
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");
  const contractAddress = "0xFc0f776909dcd120c046cfe3f74667652E3FC1F8";
  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;


  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();
        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
            won: wave.Won
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    setLoading(true)
    try {
      const { ethereum } = window;

      if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
      } else {
          console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account)
          await getAllWaves()
      } else {
          console.log("No authorized account found")
      }
    } 
    catch (error) {
        console.log(error);
    }
    setLoading(false)
  }
  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();

  }, [])

  const wave = async (msg) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(msg, {gasLimit: 300000});
        let newPendings = [];
        newPendings.push(waveTxn.hash)
        setPendingWaves(newPendings.concat(pendingWaves));

        waveTxn.wait().then(async () => {
          console.log("Mined -- ", waveTxn.hash);
          setLoading(true)
          await getAllWaves()
          setLoading(false)
          setPendingWaves(pendingWaves.slice(pendingWaves.findIndex(pend => pend === waveTxn.hash), 1))
        });

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        I am Karel Díaz, I'm from Cuba, I love programming and cryptocurrencies, I think this is a big opportunity for learn a bit about blockchain
        </div>
        <div className="button-container">
          {!currentAccount ? (
            <button className="login-button" onClick={connectWallet}>
              Connect Wallet
            </button>
          )
          :
          <div className="info-container">
            <input className="simple-input" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button className="simple-button" onClick={() => wave(message)}>
              Wave at Me
            </button>
          </div>
          }
        </div>
        <div className="info-container">
          <h4 style = {{color: "#353535"}} >Total waves:</h4>
          {loading ? <div className = "loader"/> : <h3>{allWaves.length}</h3>}
        </div>
        {allWaves.map((wave, index) => {
          return (
            <div className="wave-container" key={index}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
              <div>Won: {wave.won}</div>
            </div>)
        })}
        <div className="pending-container">
          <h4 style = {{color: "#353535"}} >Pending waves:</h4>
          {
            pendingWaves.length > 0 ? pendingWaves.map((pendingWaves, key) => {
              return (<h5 style={{marginTop: "5px"}} key={key}>{key + 1}{": " + pendingWaves}</h5>)
            }) : <h5>None</h5>
          }
        </div>
      </div>
    </div>
  );
}
