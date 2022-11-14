import React, { useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { Provider, Signer } from "@reef-defi/evm-provider";
import { WsProvider } from "@polkadot/rpc-provider";
import { Contract } from "ethers";
import disperseReefContract from "./contracts/disperseReef.json";
import Uik from "@reef-defi/ui-kit";
import fromExponential from 'from-exponential';
import { ApiPromise } from '@polkadot/api';
import { options } from '@reef-defi/api';
const { ethers } = require("ethers");

const FactoryAbi = disperseReefContract.abi;
const factoryContractAddress = disperseReefContract.address;

const URL = "wss://rpc-testnet.reefscan.com/ws";


function App() {
	const [balance, setBalance] = useState("");
	const [signer, setSigner] = useState();
	const [isWalletConnected, setWalletConnected] = useState(false);
	const [ value, setValue ] = useState("")
	const [wallet,setWallet] = useState("")
	const [balanceStatus,setBalanceStatus]=useState(true)
	const [inputError,setInputError]=useState("")
	const [convert,setConvert]=useState("")

	const toSimplifyInput = async (inputString) => {

		var allAddress=[]
		var allValue=[]

		var address=''
		var value=''
		
		var valueStatus=false

		for(var letter of inputString){


			if(letter!=='\n'){

			if(letter!==',' && !valueStatus){
				address+=letter
			}
			else if(valueStatus){
				value+=letter
			}

			if(letter===','){
				valueStatus=true
			}
	
			}else{
				// console.log(address,value)
				allAddress.push(address)
				allValue.push(parseFloat(value))
				address=''
				value=''
				valueStatus=false
			}

		}


		if(address!==''&&value!==''){
			// console.log(address,value)
			allAddress.push(address)
			allValue.push(parseFloat(value))
			address=''
			value=''

		}

		return {allAddress,allValue}

	};

	const checkExtension = async () => {
		let allInjected = await web3Enable("Reef");


		if (allInjected.length === 0) {
			return false;
		}

		let injected;
		if (allInjected[0] && allInjected[0].signer) {
			console.log(allInjected)
			injected = allInjected[0].signer;
		}

		const evmProvider = new Provider({
			provider: new WsProvider(URL),
		});

		evmProvider.api.on("ready", async () => {
			const allAccounts = await web3Accounts();

			allAccounts[0] &&
				allAccounts[0].address &&
				setWalletConnected(true);

			console.log(allAccounts);
			setWallet(allAccounts[0].address)


			const wallet = new Signer(
				evmProvider,
				allAccounts[0].address,
				injected
			);


			yourBalance(wallet)

			// Claim default account
			if (!(await wallet.isClaimed())) {
				console.log(
					"No claimed EVM account found -> claimed default EVM account: ",
					await wallet.getAddress()
				);
				await wallet.claimDefaultAccount();
			}

			setSigner(wallet);

		});
	};

	const checkSigner = async () => {
		if (!signer) {
			await checkExtension();
		}
		return true;
	};

	const yourBalance = async (wallet) => {

		try{

		 var data = (await wallet.getBalance())/10**18
		
		setBalance(parseFloat(data).toFixed(2))
	}catch(e){
		console.log(e)
		setBalanceStatus(false)
	}
	};

	const mainFunc = async () => {

		var results = await searchFunc()
		var finalAddressesToSend = results.finalAddresses
		var finalValuesToSend = results.finalValues
		var _toSend = results.toSend
		if(finalAddressesToSend.length===finalValuesToSend.length && finalAddressesToSend.length!==0 && finalValuesToSend.length!==0){


		await checkSigner();
		const factoryContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);

	

		try{
		const txResult = await factoryContract.disperseReef(finalAddressesToSend,finalValuesToSend,{value:_toSend });
		console.log(txResult)
		yourBalance(signer)
		setInputError("")
		}catch(e){
			console.log(e)
			setInputError('Not valid addresses provided!')
		}
	}

	}

	const searchFunc = async () => {

		var result = toSimplifyInput(value)
		var Addresses=(await result).allAddress
		var Values=(await result).allValue
		var toSend=0
		var finalValues=[]
		var finalAddresses=[]


		for(var x of Addresses){
			if(x[0]==='5'){
				try{
				setConvert(`Converting ${x} to EVM address!`)
				finalAddresses.push(await getEvmAddress(x))
				setConvert(``)
				}catch(e){
					console.log(e)
					setInputError('Not valid addresses provided!')
					setConvert('')
					break
				}
			}else if(x[0]==='0'){
				finalAddresses.push(x)
				setConvert('')
			}
		}

		for(var z of Values){
			toSend+=parseFloat(z)
			finalValues.push(ethers.BigNumber.from(String(parseFloat(z)*10**18)))
		}


		toSend = fromExponential(parseInt(parseInt(toSend))*10**18)

		console.log(finalAddresses)
		console.log(finalValues)
		console.log(toSend/10**18)
		return {finalAddresses,finalValues,toSend}
	}

	const getEvmAddress= async (walletAddy) => {

		const provider = new WsProvider('wss://rpc-testnet.reefscan.com/ws');
		const api = new ApiPromise(options({ provider }));
		await api.isReady;
		
		const data = await api.query.evmAccounts.evmAddresses(walletAddy);
		return (data.toHuman())

	}



	return (
		<Uik.Container className="main">
			<Uik.Container vertical>
				<Uik.Container>
					<Uik.ReefLogo /> <Uik.Text text="Disperse Dapp" type="headline" />
				</Uik.Container>
				<Uik.Container>
				<Uik.Text text='A Dapp to send REEF to multiple wallets in a single transaction' type='lead'/>
				</Uik.Container>
	
				{isWalletConnected  ? (
					<Uik.Container vertical className="container">
					<Uik.Tag color="green" text={"Connected to " + wallet}/>
					{
					// eslint-disable-next-line
					balance!='' ? (
					<>
					<Uik.Container>
					<Uik.Text text='Your Balance ' type='title'/>
					<Uik.ReefAmount value={balance} />
					</Uik.Container>
					<Uik.Text text='Input the addresses and amounts like the given below example!' type='light'/>
					<Uik.Text text='(If you are using REEF address then make sure that address has EVM address binded to it)' type='mini'/>

						  <Uik.Input textarea 
						  	  className="inputBox"
							  value={value}
							  error={inputError}
							  placeholder="5HopK6wodNuBNkK9hnfUstRqVXXXhb3nM6YtXkjhRAuaWvph,21
							  0x1CC030dA2A78250D36a7C124f9eE84a82669296d,50"
							  onInput={e => {
								 setValue(e.target.value)
							}} 
						  />

					<Uik.Button
							text="Submit"
							onClick={mainFunc}
						/>
					{convert!=='' ? (
					<>
					<Uik.Tag color="green" text={convert}/>
					</>
					):(
						<>
						</>
					)}
					</>
					):(<>
					{balanceStatus ?(
					<>
					  <Uik.Loading text='Getting Your Balance ...'/>
					</>
					):(
						<>

						<Uik.Tag color="red" text="An error has occurred. Please refresh the page"/>

						</>
					)}
					</>
					)}

					</Uik.Container>
				) : (
					<>
						<Uik.Button
							text="Connect Wallet"
							onClick={checkExtension}
						/>
					</>
				)}
			</Uik.Container>
		</Uik.Container>
	);
}

export default App;