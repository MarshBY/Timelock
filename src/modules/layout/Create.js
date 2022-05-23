import { Button, Container, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material"
import Token from '../../artifacts/contracts/ERC20.sol/Token.json'
import { ethers } from "ethers";
import { useContext, useState, useEffect } from "react";
import { Signer } from "../../App";
import TimeLockFactory from '../../artifacts/contracts/TimeLock.sol/TimeLockFactory.json'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from "dayjs";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showThrottleMessage } from "@ethersproject/providers";

const Create = (props) => {

    const signer = useContext(Signer);
    const [eth, setEth] = useState('');
    const [balance, setBalance] = useState();
    const [balanceWrong, setBalanceWrong] = useState(false);
    const [dateWrong, setDateWrong] = useState(false);

    const [erc20s, setErc20s] = useState([]);
    const [selectedErc20, setSelectedErc20s] = useState(0);

    const [date, setDate] = useState(dayjs().add(1, 'm'));

    const handleChange = (newValue) => {
        if (newValue > dayjs()) {
            setDate(dayjs(newValue));
            setDateWrong(false);
        }else{
            setDateWrong(true);
        }
    };

    const handleClick = async () => {
        if (!signer) { console.log("No signer"); toast('Please connect wallet'); return; }
        if (date < dayjs()) {setDateWrong(true); return;}

        const toAdd = erc20s.filter(erc20 => erc20.add)
        if(toAdd.length > 0) {
            alert('Reminder: As you are adding ERC20s to the timelock, zou will be asked to send them in different transactions (one for each ERC20). Please make sure you accept these transactions as well')
        }
        
        const contract = new ethers.Contract(props.contractAddress, TimeLockFactory.abi, signer);
        

        const tx = await contract.deploy(dayjs(date).unix(), toAdd.length > 0 ? toAdd.map(erc20 => erc20.address) : [], {value: eth>0 ? ethers.utils.parseEther(eth.toString()) : 0})
        console.log("Tx sent ", tx.hash)

        const receipt = await toast.promise(tx.wait(), {
            pending: 'Waiting for transaction to be mined',
            success: {render({data}){return('Timelock created at address: ' + data.events[0].args[1])}}
        })

        sendERC20s(toAdd, receipt.events[0].args[1]);
    }

    const sendERC20s = async (toAdd, timelockAddress) => {
        for(const erc20 of toAdd) {
            if(!erc20.value || erc20.value <= 0|| erc20.value == '') {continue;}
            const amount = ethers.utils.parseUnits(erc20.value, await erc20.contract.decimals());
            const tx = await erc20.contract.transfer(timelockAddress, amount)
            toast.promise(tx.wait(), {
                pending: 'Waiting for transaction to be mined',
                success: erc20.value + ' of ' + erc20.symbol + ' has been sent.',
                error: 'An error ocurred'
            })
        }
    }

    const changeEth = (e) => {
        setEth(e.target.value);
        if (e.target.value  != "" && balance.lt(ethers.utils.parseEther(e.target.value))) {
            console.log('Not enough balance');
            setBalanceWrong(true);
        } else if (balanceWrong) {
            setBalanceWrong(false);
        }
    }

    const getBalance = async () => {
        if (!signer) return;

        const bal = await signer.getBalance();
        setBalance(bal);
    }

    const getLogs = async () => {
        if (!signer) return;
        const selfAddress = await signer.getAddress();
        const filter = {
            fromBlock: 1000,
            //address: selfAddress,
            topics: [
                ethers.utils.id('Transfer(address,address,uint256)'),
                null,
                ethers.utils.hexZeroPad(selfAddress, 32)
            ]
        }

        console.log('Filter', filter)

        const result = await signer.provider.getLogs(filter);

        console.log('Result: ', result)

        if (result.length == 0) return;

        const addresses = result.map(log => log.address);
        const unique = [...new Set(addresses)];

        const contracts = await Promise.all(unique.map(async (address) => {
            const contract = new ethers.Contract(address, Token.abi, signer);
            const symbol = await contract.symbol();
            const name = await contract.name();
            return ({ symbol: symbol, contract: contract, name: name, add: false, address: address })
        }));

        console.log(contracts);
        setErc20s(contracts);
    }

    const addERC = async () => {
        console.log("Adding ", erc20s[selectedErc20].name)
        const bal = await erc20s[selectedErc20].contract.balanceOf(await signer.getAddress())
        console.log(bal)
        //This triggers a bailout in useState() Hook. Meaning the component doesnt refresh
        setErc20s(erc20s.map((erc20, i) => (
            i == selectedErc20
                ? {
                    ...erc20,
                    component:
                    <Stack direction='row' alignItems='center' spacing={1} key={i}>
                            <TextField margin="dense" type='number' onChange={e => updateERC(e, i)} label={erc20.symbol} fullWidth>TEST</TextField>
                            <Button variant="outlined" onClick={() => removeERC(i)}> Rmv </Button>
                        </Stack>,
                    add: true,
                    balance: bal,
                }
                : { ...erc20 }
        )))
        const nextSelect = erc20s.findIndex((element, i) => i != selectedErc20 && !element.add)
        setSelectedErc20s(nextSelect == -1 ? '' : nextSelect)
    }

    const updateERC = (e, x) => {
        console.log(erc20s[x])
        setErc20s(prev => prev.map((erc20, i) => (
            i === x
                ? { ...erc20, value: e.target.value }
                : { ...erc20 }
        )))

       //erc20.balance.lt(ethers.utils.parseUnits(e.target.value))
    }

    const removeERC = (x) => {
        setErc20s(prev => prev.map((erc20, i) => (
            i === x
                ? { ...erc20, add: false }
                : { ...erc20 }
        )))

        if(selectedErc20 == ''){
            setSelectedErc20s(x)
        }
    }

    useEffect(() => {
        getBalance()
        getLogs()
    }, [signer])

    return (
        <div style={{ backgroundColor: '#0F1539', position: 'absolute', zIndex: '-1', top: '110px', bottom: '0', paddingTop: '80px', width: '100%'}}>
            <Container maxWidth='sm'>
                <Paper elevation={3}>
                    <Container maxWidth='md' sx={{ padding: '20px 0' }}>
                        <Typography variant='h4' align="center" marginBottom={2}> Create TimeLock </Typography>
                        <Stack>
                            <Stack direction='row' alignItems='center' spacing={1} marginBottom={2}>
                                <Typography variant='h6' marginRight={1}> ETH: </Typography>
                                <TextField fullWidth error={balanceWrong} helperText={balanceWrong ? 'Not enough balance' : ''} margin='normal' value={eth} onChange={changeEth} type='number' id='ETH' label='ETH to store' variant="outlined" />
                            </Stack>
                            <Stack direction='row' alignItems='center' spacing={1} marginBottom={2}>
                                <Typography variant='h6' marginRight={1}> ERC20s: </Typography>
                                {erc20s.length > 0 &&
                                    <Select fullWidth value={erc20s.length > 0 ? selectedErc20 : ''} onChange={e => setSelectedErc20s(e.target.value)}>
                                        {erc20s.map((erc20, i) => !erc20.add && <MenuItem key={erc20.name} value={i}> {erc20.name} </MenuItem>)}
                                    </Select>}
                                {erc20s.length > 0 &&
                                    <Button variant="outlined" onClick={addERC} disabled={selectedErc20 === ''}> Add </Button>}
                                {erc20s.length == 0 &&
                                    <Typography variant='h6'> None found </Typography>
                                }
                            </Stack>
                            <Container maxWidth='md' sx={{ paddingBottom: '20px' }}>
                                {erc20s.map(erc20 => erc20.add && erc20.component)}
                            </Container>
                            <Stack direction='row' alignItems='center' spacing={1} marginBottom={2}>
                                <Typography variant='h6' marginRight={1}> Unlock Date: </Typography>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker value={date} minDateTime={dayjs().add(1, 'm')} onChange={handleChange} renderInput={(params) => <TextField {...params} error = {dateWrong} helperText={dateWrong && 'Date is wrong'}/>} />
                                </LocalizationProvider>
                            </Stack>
                        </Stack>
                        <Button fullWidth variant="contained" onClick={handleClick} disabled={balanceWrong}> Create </Button>
                    </Container>
                </Paper>
            </Container>
        </div>
    )
}

export default Create;