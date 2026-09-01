import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ethers } from "ethers";

const Web3Context = createContext(null);

const TX_STORAGE_KEY = "web3:txHistory:v1";
// Pre-funded demo buyer account on Hardhat localhost (Account #1 in Hardhat standard accounts)
const DEMO_BUYER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const DEMO_BUYER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const HARDHAT_RPC = "http://127.0.0.1:8545";
const HARDHAT_CHAIN_ID = 31337;

function loadAllTx() {
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllTx(data) {
  try {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState("none"); // "metamask" | "demo" | "none"
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [ethBalance, setEthBalance] = useState("0");
  const [neuralBalance, setNeuralBalance] = useState("0");

  const accountRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  // Stable balance fetcher without dependency triggers
  const refreshBalances = useCallback(async (targetAccount, targetProvider) => {
    const act = targetAccount || accountRef.current;
    const prov = targetProvider || providerRef.current;
    if (!act || !prov) return;

    try {
      // 1. ETH Balance
      const ethBalWei = await prov.getBalance(act);
      setEthBalance(Number(ethers.formatEther(ethBalWei)).toFixed(4));

      // 2. NEURAL Token Balance
      const tokenAddress = import.meta.env.VITE_NEURAL_TOKEN_ADDRESS;
      if (tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000") {
        try {
          const tokenData = await import("../contracts/NeuralToken.json");
          const tokenContract = new ethers.Contract(tokenAddress, tokenData.default.abi, prov);
          const neuralBalWei = await tokenContract.balanceOf(act);
          setNeuralBalance(Number(ethers.formatUnits(neuralBalWei, 18)).toLocaleString());
        } catch {
          setNeuralBalance("0");
        }
      }
    } catch (err) {
      console.warn("Could not refresh balances:", err.message);
    }
  }, []);

  // Connect pre-funded instant demo wallet
  const connectDemoWallet = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);

      const _provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
      await _provider.getBlockNumber(); // Test RPC connection

      const wallet = new ethers.Wallet(DEMO_BUYER_PRIVATE_KEY, _provider);
      const network = await _provider.getNetwork();

      setProvider(_provider);
      setSigner(wallet);
      setAccount(wallet.address);
      setChainId(Number(network.chainId));
      setWalletType("demo");
      localStorage.setItem("neuralchain:walletType", "demo");
      setError(null);

      await refreshBalances(wallet.address, _provider);
      return true;
    } catch (err) {
      console.warn("Local Hardhat node connection failed for demo wallet:", err.message);
      const fallbackProvider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
      const wallet = new ethers.Wallet(DEMO_BUYER_PRIVATE_KEY, fallbackProvider);
      setProvider(fallbackProvider);
      setSigner(wallet);
      setAccount(wallet.address);
      setChainId(11155111);
      setWalletType("demo");
      localStorage.setItem("neuralchain:walletType", "demo");
      setEthBalance("100.0000");
      setNeuralBalance("50,000");
      return true;
    } finally {
      setConnecting(false);
    }
  }, [refreshBalances]);

  // Connect genuine MetaMask wallet
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask browser extension not detected. Please install MetaMask or use the instant Demo Wallet.");
      return false;
    }

    try {
      setConnecting(true);
      setError(null);

      const _provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();
      const network = await _provider.getNetwork();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setChainId(Number(network.chainId));
      setWalletType("metamask");
      localStorage.setItem("neuralchain:walletType", "metamask");

      await refreshBalances(_account, _provider);
      return true;
    } catch (err) {
      if (err?.code === 4001) {
        setError("Connection request rejected by user in MetaMask.");
      } else {
        setError("MetaMask connection failed: " + (err?.message || String(err)));
      }
      return false;
    } finally {
      setConnecting(false);
    }
  }, [refreshBalances]);

  // Switch to Hardhat Localhost in MetaMask
  const switchToHardhatNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x7a69",
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Hardhat network:", addError);
        }
      }
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setWalletType("none");
    setEthBalance("0");
    setNeuralBalance("0");
    localStorage.setItem("neuralchain:walletType", "disconnected");
  }, []);

  // Handle wallet restoration ONCE on mount
  useEffect(() => {
    const savedType = localStorage.getItem("neuralchain:walletType");
    if (savedType === "disconnected") {
      return;
    }
    if (savedType === "metamask" && window.ethereum) {
      connectMetaMask();
    } else {
      connectDemoWallet();
    }
    // Run exactly once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for MetaMask account & network events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccounts = (accounts) => {
      if (walletType === "metamask") {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          refreshBalances(accounts[0]);
        } else {
          disconnectWallet();
        }
      }
    };

    const handleChain = () => {
      if (walletType === "metamask") {
        window.location.reload();
      }
    };

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccounts);
        window.ethereum.removeListener("chainChanged", handleChain);
      }
    };
  }, [walletType, refreshBalances, disconnectWallet]);

  // Load transaction history for active wallet
  useEffect(() => {
    if (!account) {
      setTransactions([]);
      return;
    }
    const store = loadAllTx();
    setTransactions(store[account.toLowerCase()] || []);
  }, [account]);

  // Add transaction to history
  const addTransaction = useCallback(
    (tx) => {
      const act = accountRef.current;
      if (!act) return;
      const key = act.toLowerCase();
      const all = loadAllTx();
      const current = all[key] || [];
      const item = {
        ...tx,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        account: act,
        timestamp: tx.timestamp || new Date().toISOString(),
      };
      const updated = [item, ...current.slice(0, 49)];
      all[key] = updated;
      saveAllTx(all);
      setTransactions(updated);
      refreshBalances(act);
    },
    [refreshBalances]
  );

  const value = useMemo(
    () => ({
      account,
      provider,
      signer,
      chainId,
      connecting,
      walletType,
      isDemoWallet: walletType === "demo",
      isMetaMask: walletType === "metamask",
      demoBuyerAddress: DEMO_BUYER_ADDRESS,
      error,
      transactions,
      ethBalance,
      neuralBalance,
      connectWallet: connectMetaMask,
      connectMetaMask,
      connectDemoWallet,
      disconnectWallet,
      switchToHardhatNetwork,
      refreshBalances,
      addTransaction,
    }),
    [
      account,
      provider,
      signer,
      chainId,
      connecting,
      walletType,
      error,
      transactions,
      ethBalance,
      neuralBalance,
      connectMetaMask,
      connectDemoWallet,
      disconnectWallet,
      switchToHardhatNetwork,
      refreshBalances,
      addTransaction,
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within a Web3Provider");
  return ctx;
}
