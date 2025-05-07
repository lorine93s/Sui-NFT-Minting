import { useState, useEffect } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import NFTTable from "../../components/NFTTable";
import WhitelistTable from "../../components/WhitelistTable";
import Button from "../../components/Button";
import { Modal } from "../../components/Modal";
import Label from "../../components/Label";
import Input from "../../components/InputField";
import { useModal } from "../../hooks/useModal";

const packageId = import.meta.env.VITE_PACKAGE_ID;
const whitelistId = import.meta.env.VITE_WHITELIST_ID;

export interface WhitelistUser {
  name: string;
  address: string;
  image?: string;
  role?: string;
}

export interface NFTItem {
  name: string;
  image?: string;
  price?: string;
  description: string;
  objectId: string;
  status?: string;
  traits?: string[];
}

export default function NFTDashbord() {
  const { isOpen, openModal, closeModal } = useModal();
  const [nftEvent, setNftEvent] = useState(false);
  const [whitelistEvent, setWhitelistEvent] = useState(false);
  const [isNFT, setIsNFT] = useState(true);
  const [nftName, setNFTName] = useState("");
  const [nftImageUrl, setNFTImageUrl] = useState("");
  const [nftDescription, setNFTDescription] = useState("");
  const [whitelistName, setWhitelistName] = useState("");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [isWhitelisted, setIsWhiteListed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nftData, setNftData] = useState<NFTItem[]>([]);
  const [whitelistData, setWhitelistData] = useState<WhitelistUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const currentAccount = useCurrentAccount();
  const {
    mutate: signAndExecuteTransaction,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useSignAndExecuteTransaction();
  const suiClient = new SuiClient({ url: getFullnodeUrl("devnet") });

  useEffect(() => {
    if (currentAccount?.address) {
      getNFTDatas();
      checkIsWhitelisted();
      checkIsAdmin();
      fetchWhitelistData();
      getGasBalance();
    } else {
      resetState();
    }
  }, [currentAccount?.address]);

  useEffect(() => {
    if (nftEvent) {
      getGasBalance();
      getNFTDatas();
      setNftEvent(false);
    }
  }, [nftEvent]);

  useEffect(() => {
    if (whitelistEvent) {
      getGasBalance();
      fetchWhitelistData();
      setWhitelistEvent(false);
    }
  }, [whitelistEvent]);

  useEffect(() => {
    getGasBalance();
  }, [isNFT]);

  const resetState = () => {
    setBalance(0);
    setNftData([]);
    setWhitelistData([]);
    setIsWhiteListed(false);
    setIsAdmin(false);
  };

  const getGasBalance = async () => {
    try {
      const bal = await suiClient.getBalance({
        owner: currentAccount.address,
      });
      setBalance(bal.totalBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const checkIsAdmin = async () => {
    try {
      if (!currentAccount?.address) return;

      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: { showContent: true, showType: true },
        filter: { StructType: `${packageId}::test_NFT::WhitelistInfo` },
      });

      setIsAdmin(objects.data.length > 0);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const fetchWhitelistData = async () => {
    try {
      if (!currentAccount?.address) return;
      setLoading(true);

      const dynamicFields = await suiClient.getDynamicFields({
        parentId: whitelistId,
      });

      const whitelistUsers = dynamicFields.data.map((field) => ({
        name: `User ${field.name.value.slice(0, 6)}`,
        address: field.name.value,
        image: "/path/to/default-image.jpg",
      }));

      setWhitelistData(whitelistUsers);
    } catch (error) {
      console.error("Error fetching whitelist data:", error);
      setWhitelistData([]);
    } finally {
      setLoading(false);
    }
  };

  const getNFTDatas = async () => {
    try {
      setLoading(true);
      const objects = await suiClient.getOwnedObjects({
        owner: currentAccount?.address,
        options: { showContent: true, showType: true },
      });

      const nfts = objects.data
        .filter((obj) => obj.data?.type?.includes("test_NFT::NFT"))
        .map((obj) => {
          const content = obj.data?.content as any;
          return {
            name: content?.fields?.name || "Unnamed NFT",
            image: content?.fields?.image_url || "",
            price: isWhitelisted ? "Free" : "2 SUI",
            description: content?.fields?.description || "No description",
            objectId: obj.data?.objectId || "",
            traits: content?.fields?.traits || [],
            status: "Placed",
          };
        });

      setNftData(nfts);
    } catch (error) {
      console.error("Error filtering objects:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIsWhitelisted = async () => {
    try {
      if (!currentAccount?.address) return;

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::test_NFT::is_whitelisted`,
        arguments: [
          tx.object(whitelistId),
          tx.pure.address(currentAccount.address),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || "",
      });

      const isWhitelisted = result.results?.[0]?.returnValues?.[0]?.[0];
      if (isWhitelisted) {
        const status = new Uint8Array(isWhitelisted)[0] === 1;
        setIsWhiteListed(status);
      }
    } catch (error) {
      console.error("Error checking whitelist:", error);
      setIsWhiteListed(false);
    }
  };

  const handleRemoveWhitelist = async (address: string) => {
    try {
      setLoading(true);
      setWhitelistData((prev) => prev.filter((user) => user.address !== address));

      const tx = new Transaction();
      tx.setGasBudget(100000000);
      tx.moveCall({
        target: `${packageId}::test_NFT::remove_from_whitelist`,
        arguments: [tx.object(whitelistId), tx.pure.address(address)],
      });

      const result = await signAndExecuteTransaction(
        {
          transaction: tx,
          options: { showEffects: true, showObjectChanges: true },
        },
        {
          onSuccess: (result) => {
            setWhitelistEvent(true);
            console.log("Remove from whitelist result:", result);
            alert("Address removed from whitelist successfully!");
          },
          onError: (error) => {
            console.error("Error removing from whitelist:", error);
            alert("Failed to remove from whitelist");
          },

        }
      );

    } catch (error) {
      console.error("Error removing from whitelist:", error);
      alert("Failed to remove from whitelist");
      await fetchWhitelistData();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNFT = async (objectId: string) => {
    try {
      setLoading(true);
      // setNftData((prev) => prev.filter((nft) => nft.objectId !== objectId));

      const tx = new Transaction();
      tx.setGasBudget(100000000);
      tx.moveCall({
        target: `${packageId}::test_NFT::remove_nft`,
        arguments: [tx.object(objectId)],
      });

      await signAndExecuteTransaction(
        {
          transaction: tx,
          options: { showEffects: true, showObjectChanges: true },
        },
        {
          onSuccess: (result) => {
            setNftEvent(true);
            console.log("Remove NFT result:", result);
            alert("NFT removed successfully!");
          },
          onError: (error) => {
            console.error("Error removing NFT:", error);
            alert("Failed to remove NFT");
          },
        }
      );
    } catch (error) {
      console.error("Error removing NFT:", error);
      alert("Failed to remove NFT");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = () => {
    openModal();
  };

  const addToWhitelist = async () => {
    closeModal();
    if (!whitelistName || !whitelistAddress) {
      alert("Please fill in all the whitelist details before adding.");
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::test_NFT::add_to_whitelist`,
        arguments: [tx.object(whitelistId), tx.pure.address(whitelistAddress)],
      });

      const result = await signAndExecuteTransaction(
        { 
          transaction: tx,
          options: { showEffects: true, showObjectChanges: true },
        },
        {
          onSuccess: (result) => {
            setWhitelistEvent(true);
            console.log("Add to whitelist result:", result);
            alert("Address added to whitelist successfully!");
          },
          onError: (error) => {
            console.error("Error adding to whitelist:", error);
            alert("Failed to add to whitelist");
          },
        }
      );
    } catch (error) {
      console.error("Error adding to whitelist:", error);
      alert("Failed to add to whitelist");
    } finally {
      setLoading(false);      
      setWhitelistName("");
      setWhitelistAddress("");
    }
  };

  const paidMint = async () => {
    if (!nftName || !nftImageUrl || !nftDescription) {
      alert("Please fill in all the NFT details before minting.");
      return;
    }

    try {
      setLoading(true);
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [2000000000]);

      tx.moveCall({
        target: `${packageId}::test_NFT::paid_mint`,
        arguments: [
          tx.pure.string(nftName),
          tx.pure.string(nftDescription),
          tx.pure.string(nftImageUrl),
          coin,
        ],
      });

      await signAndExecuteTransaction(
        {
          transaction: tx,
          options: { showEffects: true, showObjectChanges: true },
        },
        {
          onSuccess: (result) => {
            setNftEvent(true);
            console.log("Paid Mint result:", result);
            alert("Paid mint successful!");
          },
          onError: (error) => {
            console.error("Error in paid mint:", error);
            alert("Failed to Paid mint NFT");
          },
        }
      );
    } catch (error) {
      console.error("Error in paid mint:", error);
      alert("Failed to mint NFT");
    } finally {
      setLoading(false);
      closeModal();
      setNFTName("");
      setNFTImageUrl("");
      setNFTDescription("");
    }
  };

  const createNFT = async () => {
    if (!nftName || !nftImageUrl || !nftDescription) {
      alert("Please fill in all the NFT details before minting.");
      return;
    }
    try {
      setLoading(true);
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::test_NFT::mint_for_whitelisted`,
        arguments: [
          tx.object(whitelistId),
          tx.pure.string(nftName),
          tx.pure.string(nftDescription),
          tx.pure.string(nftImageUrl),
        ],
      });

      await signAndExecuteTransaction(
        {
          transaction: tx,
          options: { showEffects: true, showObjectChanges: true },
        },
        {
          onSuccess: (result) => {
              setNftEvent(true);
              console.log('Mint result:', result);
              alert("NFT minted successfully!");
          },
          onError: (error) => {
            console.error("Error in free mint:", error);
            alert("Failed to mint NFT. You may not be whitelisted.");
          },
        }
      );
    } catch (error) {
      console.error("Error in free mint:", error);
      alert("Failed to mint NFT. You may not be whitelisted.");
    } finally {
      setLoading(false);
      closeModal();
      setNFTName("");
      setNFTImageUrl("");
      setNFTDescription("");
    }
  };

  return (
    <>
      <PageMeta
        title="NFT and Whitelist Management"
        description="Manage your NFTs and whitelisted users"
      />
      <Label className="text-2xl font-bold mb-4 text-center">
        {isNFT ? "My NFTs" : "Whitelist Users"}
      </Label>
      <div className="mb-6">
        <div className="flex items-center gap-5">
          {!isNFT && isAdmin && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateAction}
              disabled={loading || !currentAccount}
            >
              {loading ? "Processing..." : "Create Whitelist"}
            </Button>
          )}
          {isNFT && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateAction}
              disabled={loading || !currentAccount}
            >
              {loading ? "Processing..." : "Create NFT"}
            </Button>
          )}
          <ConnectButton />
          <span className="text-sm text-gray-500">
            {loading
              ? "Loading..."
              : `Balance: ${(balance / 1e9).toFixed(3)} SUI`}
          </span>
          <span className="text-sm text-gray-500">
            {!currentAccount?.address
              ? "Wallet not connected"
              : isWhitelisted
              ? "Whitelisted"
              : "Not whitelisted"}
            {isAdmin && currentAccount?.address && " | Admin"}
          </span>
          {currentAccount?.address && (
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNFT(!isNFT)}
                disabled={loading}
              >
                Switch to {isNFT ? "Whitelist" : "NFT"}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <ComponentCard title={isNFT ? "NFT Table" : "Whitelist Table"}>
          {isNFT ? (
            <NFTTable
              data={nftData}
              onRemove={handleRemoveNFT}
              loading={loading}
            />
          ) : (
            <WhitelistTable
              data={whitelistData}
              adminFlag={isAdmin}
              onRemove={isAdmin ? handleRemoveWhitelist : undefined}
            />
          )}
        </ComponentCard>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} width="30%">
        <div className="text-center">
          <Label className="text-lg font-semibold mb-4">
            {isNFT ? "Create New NFT" : "Add to Whitelist"}
          </Label>
        </div>
        <form className="space-y-4">
          <div>
            <Label>{isNFT ? "NFT Name" : "Name"}</Label>
            <Input
              type="text"
              value={isNFT ? nftName : whitelistName}
              onChange={(e) =>
                isNFT
                  ? setNFTName(e.target.value)
                  : setWhitelistName(e.target.value)
              }
              disabled={loading}
            />
          </div>
          {isNFT && (
            <>
              <div>
                <Label>Image URL</Label>
                <Input
                  type="text"
                  value={nftImageUrl}
                  onChange={(e) => setNFTImageUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={nftDescription}
                  onChange={(e) => setNFTDescription(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}
          {!isNFT && (
            <div>
              <Label>Wallet Address</Label>
              <Input
                type="text"
                value={whitelistAddress}
                onChange={(e) => setWhitelistAddress(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="primary"
              onClick={
                isNFT
                  ? isWhitelisted
                    ? createNFT
                    : paidMint
                  : addToWhitelist
              }
              disabled={loading || (!isNFT && !isAdmin)}
            >
              {loading
                ? "Processing..."
                : isNFT
                ? isWhitelisted
                  ? "Free Mint"
                  : "Paid Mint (2 SUI)"
                : "Add to Whitelist"}
            </Button>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
