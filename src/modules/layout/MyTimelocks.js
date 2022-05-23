import { Paper, Container, Typography, Stack } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { Signer } from "../../App";
import dayjs from "dayjs";
import TimeLock from '../../artifacts/contracts/TimeLock.sol/TimeLock.json'
import TimelockOverlay from "../TimelockOverlay";
import Token from '../../artifacts/contracts/ERC20.sol/Token.json'

const MyTimelocks = (props) => {
    const signer = useContext(Signer);

    const [tls, setTls] = useState([]);
    const [selectedTimelock, setSelectedTimelock] = useState(-1);
    const [loading, setLoading] = useState(true);

    const getTLs = async () => {
        if (!signer) return;
        const filter = {
            fromBlock: 1,
            address: signer.address,
            topics: [
                ethers.utils.id('TimeLockDeployed(address,address,uint256)')
            ]
        }

        const result = await signer.provider.getLogs(filter);

        if (result.length == 0) return;

        const timelocks = [];

        for (const tl of result) {
            const address = ethers.utils.defaultAbiCoder.decode(['address'], tl.topics[2])[0]
            const code = await signer.provider.getCode(address)
            if (code == '0x') { continue } //Autodestructed contract (Already claimed)
            
            const timestamp = ethers.utils.defaultAbiCoder.decode(['uint256'], tl.topics[3]).toString()
            const contract = new ethers.Contract(address, TimeLock.abi, signer);

            const addresses = await contract.getERC20();
            const ethBalance = await signer.provider.getBalance(address)

            const erc20s = []

            if(addresses.length > 0) {
                for(const erc20 of addresses){
                    const contract = new ethers.Contract(erc20, Token.abi, signer);
                    const balance = await contract.balanceOf(address)
                    const symbol = await contract.symbol()

                    erc20s.push({
                        address: erc20,
                        contract: contract,
                        balance: balance,
                        symbol: symbol
                    })
                }
            }

            timelocks.push({
                contract: contract,
                erc20s: erc20s, // [ { address: 'asdfasdf',  balance: BigNumber, symbol: 'USDT' } ]
                ethBalance: ethBalance,
                address: address,
                timestamp: timestamp
            })
        }

        setTls(timelocks);
        setLoading(false);
    }

    const updateTl = async (x) => {
        console.log('Updating ', x)
        const temp = await Promise.all(tls.map(async (tl, i) => {
            if (i == x) {
                const erc20s = await tl.contract.getERC20();
                const ethBalance = await signer.provider.getBalance(tl.address)
                console.log('erc20s ', erc20s)
                console.log('ethBal ', ethBalance)
                return ({
                    ...tl,
                    erc20s: erc20s,
                    ethBalance: ethBalance
                })
            } else {
                return ({ ...tl })
            }
        }))

        setTls(temp)
    }

    const handleClose = (e) => {
        if (e.key == "Escape") {
            console.log(selectedTimelock, e.key)
            setSelectedTimelock(-1)
        }
    }

    useEffect(() => {
        getTLs();
    }, [signer])

    useEffect(() => {
        window.addEventListener('keydown', handleClose)
    }, [])


    return (
        <div style={{ backgroundColor: '#0F1539', position: 'absolute', zIndex: '1', top: '110px', bottom: '0', paddingTop: '80px', width: '100%'}}>
            <Container maxWidth='md'>
                {loading && <Typography variant="h2" sx={{color: 'white'}}>Loading...</Typography>}
                <Stack direction='row' sx={{ flexWrap: 'wrap' }} alignItems='center' justifyContent='space-evenly' spacing={6}>
                    {tls.map((tl, i) =>
                        <Paper elevation={dayjs.unix(tl.timestamp) < dayjs()? 3 : 1} onClick={() => setSelectedTimelock(i)} key={tl.address} sx={{ cursor: 'pointer', userSelect: 'none', borderRadius: '10px', maxWidth: '350px', minWidth: '100px', padding: '10px' }}>
                            <Stack direction='column' alignItems='center'>
                                {dayjs.unix(tl.timestamp) < dayjs() ? <Typography variant='h6'> Unlocked! </Typography> :
                                <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}><Typography variant='h6'> Unlocks: </Typography>
                                <p style={{ margin: '2px 0 10px 0' }}>{dayjs.unix(tl.timestamp).format('DD/MM/YY HH:mm')}</p></div>}
                                <Typography variant='h6'> Values: </Typography>
                                <Stack direction='column'>
                                    <Stack spacing={1} direction='row' alignItems='center' justifyContent='space-between' width='xl'>
                                        <p style={{ margin: '0' }}>{ethers.utils.formatEther(tl.ethBalance)}</p>
                                        <Typography variant='h6'>ETH</Typography>
                                    </Stack>
                                    {tl.erc20s.length > 0 &&
                                        tl.erc20s.map(erc20 => (
                                            <Stack key={erc20.address} spacing={1} direction='row' alignItems='center' justifyContent='space-between' width='xl'>
                                                <p style={{ margin: '0' }}>{ethers.utils.formatEther(erc20.balance)}</p>
                                                <Typography variant='h6'>{erc20.symbol}</Typography>
                                            </Stack>
                                        ))
                                    }
                                </Stack>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Container>
            {selectedTimelock != -1 && <TimelockOverlay balance={props.balance} tl={tls[selectedTimelock]} setSelectedTimelock={setSelectedTimelock} getTls={getTLs} id={selectedTimelock} />}
        </div>

    )
}

export default MyTimelocks;