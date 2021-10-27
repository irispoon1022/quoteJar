import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/store.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [showQuote, setShowQuote] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const contractAddress = "0x395758376e3C439330053b0B6b27a976204EbeE5";
  const contractABI = abi.abi;

  const quotes = [
    'Antifragility is beyond resilience or robustness. The resilient resists shocks and stays the same; the antifragile gets better.',
    'My standpoint is that as long as it doesn’t harm other people’s free will, every explanation to one’s meaning of life can be celebrated as equal. No one has the authority to evaluate one’s interpretation to meaning of life.',
    'Large numbers of people can collaborate by sharing common myths and beliefs.',
    'Leadership creates the conditions for team effectiveness. It increases the possibility of team effectiveness. It does NOT ensures or causes team effectiveness.',
    'The more members who are contributing to the real work of leadership (that is, helping to create, fine-tune, and exploit the benefits of the enabling conditions), the better.',
    'It’s lonely at the top. Ninety-nine percent of people in the world are convinced they are incapable of achieving great things, so they aim for the mediocre. The level of competition is thus fiercest for “realistic” goals, paradoxically making them the most time-and energy-consuming. ',
    'Bear with me. What is the opposite of happiness? Sadness? No. Just as love and hate are two sides of the same coin, so are happiness and sadness. Crying out of happiness is a perfect illustration of this. The opposite of love is indifference, and the opposite of happiness is—here’s the clincher—boredom.',
    'There is no picture- or theory-independent concept of reality. Instead we will adopt a view that we will call model-dependent realism: the idea that a physical theory or world picture is a model (generally of a mathematical nature) and a set of rules that connect the elements of the model to observations. This provides a framework with which to interpret modern science.',
    'If life brought events in front of me, I would treat them as if they came to take me beyond myself. If my personal self complained, I would use each opportunity to simply let him go and surrender to what life was presenting me. This was the birth of what I came to call “the surrender experiment,” and I was totally prepared to see where it would take me.',
    'My formula for success was very simple: Do whatever is put in front of you with all your heart and soul without regard for personal results.'

  ];

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
        getAllWaves();
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
      getAllWaves();
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        //Call the getAllWaves method from your Smart Contract
        const waves = await wavePortalContract.getAllMessages();
        console.log(waves);

        // We only need address, timestamp, and message in our UI so let's pick those out
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.messanger,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        wavesCleaned.sort((a,b) => a.timestamp < b.timestamp ? 1:-1);

        // Store our data in React State
        setAllWaves(wavesCleaned);

        // listen for events
        wavePortalContract.on("NewMessage", (from, timestamp, message) => {
          console.log("NewMessage", from, timestamp, message);
          setLoading(false);
          setAllWaves(prevState => [{
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
        const StoreContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await StoreContract.getTotalMessages();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await StoreContract.sendMessage(message,{gasLimit:1000000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await StoreContract.getTotalMessages();
        console.log("Retrieved total wave count...", count.toNumber());

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * After the UI is rendered, check if wallet is connected
   */
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
        <button className="waveButton" onClick={handleShowRandomQuote}>
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

        {loading && <div style={{ backgroundColor: "OldLace", marginTop: "8px", padding: "16px",opacity:"50%" }} > 
        <div class="container">
          <div class="dash uno"></div>
          <div class="dash dos"></div>
          <div class="dash tres"></div>
          <div class="dash cuatro"></div>
        </div>
        Your message is being packaged into an Ethereum block (usually takes 10s). Take a sip of drink and come back for the magic ~ </div>}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "8px", padding: "16px" }}>
              <div className="comment">{wave.message}</div>
              <div className="smallText">{wave.timestamp.toString()}</div>
              
            </div>)
        })}


      </div>
    </div>
  );
}

export default App