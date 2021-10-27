import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/store.json";
import quotes from "./utils/quotes.js";

const App = () => {
  
  // the current connected metamask account
  const [currentAccount, setCurrentAccount] = useState("");

  // whether to display a random quote or not
  const [showQuote, setShowQuote] = useState(false);

  // the random quote to be shown
  const [randomQuote, setRandomQuote] = useState('');

  // input message in the input textbox
  const [message, setMessage] = useState('');

  // whether the transaction is confirmed or not
  const [loading, setLoading] = useState(false);

  // the past messages
  const [allMessages, setAllMessages] = useState([]);

  // contract details
  const contractAddress = "0x395758376e3C439330053b0B6b27a976204EbeE5";
  const contractABI = abi.abi;

  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      /**
       * Check if metamask extension is installed
       */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllMessages();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      /*If metamask extension is not there */
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*If metamask extension is there,ask user to select account to connect */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      /*then change the state of currentAccount to be the selected account */
      setCurrentAccount(accounts[0]);
      getAllMessages();
    } catch (error) {
      console.log(error)
    }
  }

  const getAllMessages = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const quoteJarContract = new ethers.Contract(contractAddress, contractABI, signer);

        //Call the getAllMessages method from your Smart Contract
        const Messages = await quoteJarContract.getAllMessages();
        console.log(Messages);

        // We only need address, timestamp, and message in our UI so let's pick those out
        let MessagesCleaned = [];
        Messages.forEach(message => {
          MessagesCleaned.push({
            address: message.messanger,
            timestamp: new Date(message.timestamp * 1000),
            message: message.message
          });
        });

        //sort the array according to time (latest first)
        MessagesCleaned.sort((a,b) => a.timestamp < b.timestamp ? 1:-1);

        // Store our data in React State
        setAllMessages(MessagesCleaned);

        // listen for events (whenever new message comes,change the state)
        quoteJarContract.on("NewMessage", (from, timestamp, message) => {
          console.log("NewMessage", from, timestamp, message);
          setLoading(false);
          setAllMessages(prevState => [{
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          },...prevState]);
        });

      }
      
      
      
       else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const sendMessage = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const quoteJarContract = new ethers.Contract(contractAddress, contractABI, signer);

        //Execute the sendMessage function from your smart contract
        const messageTxn = await quoteJarContract.sendMessage(message,{gasLimit:1000000});
        console.log("Mining...", messageTxn.hash);

        await messageTxn.wait();
        console.log("Mined -- ", messageTxn.hash);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // After the UI is rendered, check if wallet is connected
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

const handleShowRandomQuote = () => {
  setShowQuote(true);
  setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
}

  return (
    <div className="mainContainer">
      <div className="dataContainer">

        <div className="header">
          the Quote Jar
        </div>

        <div className="bio">
          <p>I am Iris, a product manager passionate about cryptocurrencies. <br></br>
          Let me share with you some inspirational quotes I like.</p>
        </div>
        <button className="messageButton" onClick={handleShowRandomQuote}>
          Show me a quote
        </button>
        <p className="blockQuote">{randomQuote}</p>

        <p className="bio" style={{"margin-bottom":"4px"}}> Share your favourate quote on the Rinkeby Ethereum network and win some Eths.</p>
        {!currentAccount && (
        <button className="textButton" onClick={connectWallet}>To do that, connect your Metamask wallet first.</button>
        )}
        <input style={{margin:"16px 0 8px 0", padding:"8px"}} placeholder="message" onChange={ e => setMessage(e.target.value)} />
        <button className="secondaryButton" onClick={sendMessage}>
          Share
        </button>
        
        {/* loading state while the message is being confirmed */}
        {loading && <div style={{ backgroundColor: "OldLace", marginTop: "8px", padding: "16px",opacity:"50%" }} > 
        <div class="container">
          <div class="dash uno"></div>
          <div class="dash dos"></div>
          <div class="dash tres"></div>
          <div class="dash cuatro"></div>
        </div>
        Your message is being packaged into an Ethereum block (usually takes 10s). Take a sip of drink and come back for the magic ~ </div>}

        {/* list of past messages */}
        {allMessages.map((message, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "8px", padding: "16px" }}>
              <div className="comment">{message.message}</div>
              <div className="smallText">{message.timestamp.toString()}</div>
              
            </div>)
        })}


      </div>
    </div>
  );
}

export default App