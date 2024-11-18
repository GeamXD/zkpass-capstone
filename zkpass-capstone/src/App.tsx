import { type FormEvent, useState } from "react";
import "./App.css";
import TransgateConnect from "@zkpass/transgate-js-sdk";
import type { Result } from "@zkpass/transgate-js-sdk/lib/types";
import { ethers } from "ethers";

export type TransgateError = {
  message: string;
  code: number;
};

const App = () => {
  const [appId, setAppId] = useState<string>("f2d25a48-7906-4ed3-8c20-b08b86cb8253");
  const [schemaId, setSchemaId] = useState<string>("b5519ddf87084df18decd525955f682a");
  const [result, setResult] = useState<Result | undefined>(undefined);

  const requestVerifyMessage = async (
    e: FormEvent,
    appId: string,
    schemaId: string,
  ) => {
    e.preventDefault();
    let connector: TransgateConnect | null = null;

    try {
      connector = new TransgateConnect(appId);
      const isAvailable = await connector.isTransgateAvailable();

      if (!isAvailable) {
        alert(
          "Please install zkPass Transgate from https://chromewebstore.google.com/detail/zkpass-transgate/afkoofjocpbclhnldmmaphappihehpma"
        );
        return;
      }

      const provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null;
      if (!provider) {
        alert("No Ethereum provider found");
        return;
      }

      const signer = await provider.getSigner();
      const recipient = await signer.getAddress();
      const res = await connector.launch(schemaId, recipient) as Result;
      
      // Verify the proof message signature
      try {
        const verifiedResult = await connector.verifyProofMessageSignature(
          "evm",
          schemaId,
          res
        );

        if (verifiedResult) {
          alert("Verification successful!");
          setResult(res);
        } else {
          alert("Verification failed");
        }
      } catch (verifyError) {
        console.error("Verification error:", verifyError);
        alert("Error during verification");
      }

    } catch (error) {
      const transgateError = error as TransgateError;
      console.error("Transgate error:", transgateError);
      alert(`Transgate Error: ${transgateError.message}`);
    }
  };
  return (
    <div className="app">
      <form
        className="form"
        onSubmit={(e) => requestVerifyMessage(e, appId, schemaId)}
      >
        <label htmlFor="app-id">
          AppId:
          <input
            id="app-id"
            type="text"
            placeholder="Your App ID"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
          />
        </label>
        <label htmlFor="schema-id">
          SchemaId:
          <input
            id="schema-id"
            type="text"
            placeholder="Schema ID"
            value={schemaId}
            onChange={(e) => setSchemaId(e.target.value)}
          />
        </label>
        <button type="submit">Start Verification</button>
        {result && (
          <pre>Result: {JSON.stringify(result, null, 2)}</pre>
        )}
      </form>
    </div>
  );
};

export default App;
