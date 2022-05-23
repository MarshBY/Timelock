import { ThemeProvider } from '@mui/system';
import './App.css';
import Header from './modules/layout/Header';
import Create from './modules/layout/Create';
import { theme } from './utils/Theme';
import { createContext, useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import MyTimelocks from './modules/layout/MyTimelocks';
import { ToastContainer } from 'react-toastify';

export const Signer = createContext();

const contractAddress = '0xff92fB52a02783d1Edee312629ecB97898b98DCF'

function App() {

  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [tab, setTab] = useState(0);
  const [balance, setBalance] = useState(0);

  const getBalance = async () => {
    if (!signer) return;

    const bal = await signer.getBalance();
    console.log("Available balance: ", bal.toString());
    setBalance(bal);
  }

  const requestAccount = async () => {
    if (window.ethereum) {
      const acc = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(acc[0])
    } else {
      console.log('Metamask not found!');
    }
  }

  const getSigner = async () => {
    if (!account || account == '') { console.log("No account for signer"); return; }
    console.log('Getting signer');
    const provider = await new ethers.providers.Web3Provider(window.ethereum);
    const sig = provider.getSigner();
    setSigner(sig);
  }

  useEffect(() => {
    console.log("Account: ", account);
    getSigner()
  }, [account])

  useEffect(() => {
    getBalance();
  }, [signer])

  useEffect(() => {
    requestAccount();
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <Signer.Provider value={signer}>
        <ToastContainer />
        <Header requestAccount={requestAccount} setTab={setTab} tab={tab} account={account} />
        {tab == 0 && <Create contractAddress={contractAddress} balance={balance} />}
        {tab == 1 && <MyTimelocks contractAddress={contractAddress} account={account} balance={balance} />}
      </Signer.Provider>
    </ThemeProvider>
  );
}

export default App;
