import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not found. Please install MetaMask to use blockchain features.");
      return false;
    }
    try {
      setConnecting(true);
      setError(null);
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send("eth_requestAccounts", []);
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();
      const network = await _provider.getNetwork();
      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setChainId(Number(network.chainId));

      // Listen for account/chain changes
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
      return true;
    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
      return false;
    } finally {
      setConnecting(false);
    }
  }, []);

  const getContract = useCallback(
    async (abi, address) => {
      if (!signer) return null;
      return new ethers.Contract(address, abi, signer);
    },
    [signer]
  );

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  };

  const formatAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <Web3Context.Provider
      value={{ account, provider, signer, chainId, connecting, error, connectWallet, getContract, disconnect, formatAddress }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used inside Web3Provider");
  return ctx;
};
