import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { monitor } from "./lifecycle.js";
export let config = await fetch("/deployment.json").then((r) => {
  if (!r.ok) throw new Error("Deployment configuration unavailable");
  return r.json();
});
export const reader = createClient({ chain: studionet });
let signer = null;
const accounts = [];
export function accountList() {
  return accounts.map((a) => a.address);
}
export function connect(index) {
  if (index === undefined) {
    accounts.push(createAccount());
    index = accounts.length - 1;
  }
  if (!accounts[index]) throw new Error("Unknown session account");
  const account = accounts[index];
  signer = createClient({ chain: studionet, account });
  return account.address;
}
export function disconnect() {
  signer = null;
}
export async function read(name, args = []) {
  if (!config.address) throw new Error("Live deployment not yet configured.");
  return reader.readContract({
    address: config.address,
    functionName: name,
    args,
    transactionHashVariant: "latest-final",
  });
}
export const readJSON = async (name, args = []) =>
  JSON.parse(await read(name, args));
export async function write(name, args, update) {
  if (!signer) throw new Error("Connect a disposable test account first.");
  if (!config.address) throw new Error("Live deployment unavailable.");
  update({ phase: "submitting", status: "SUBMITTING" });
  const hash = await signer.writeContract({
    address: config.address,
    functionName: name,
    args,
    leaderOnly: false,
  });
  update({ hash, phase: "pending", status: "PENDING" });
  return monitor(reader, hash, update);
}
export const resume = (hash, update) => monitor(reader, hash, update);
