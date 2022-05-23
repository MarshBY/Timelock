import { Backdrop, Paper, Typography, Stack, Button, TextField, ClickAwayListener } from "@mui/material";
import { ethers } from "ethers";
import dayjs from "dayjs";
import { useState, useContext } from "react";
import { Signer } from "../App";
import { toast } from "react-toastify";


const TimelockOverlay = (props) => {
    const signer = useContext(Signer);

    const [eth, setEth] = useState('');
    const [wrongEth, setWrongEth] = useState(false);
    const [values, setValues] = useState(new Array(props.tl.erc20s.length).fill(''));
    const [wrongErc, setWrongErc] = useState(new Array(props.tl.erc20s.length).fill(false));

    const sendEth = async () => {
        if (!eth || eth == '' || eth <= 0 || props.balance.lt(ethers.utils.parseEther(eth))) { setWrongEth(true); return; }

        console.log(eth)
        const tx = await signer.sendTransaction({
            value: ethers.utils.parseEther(eth.toString()),
            to: props.tl.address
        })
        console.log(tx)
        await tx.wait()
        console.log(tx)

        props.updateTl(props.id)
    }

    const withdrawAll = async () => {
        if (!signer) return;

        const tx = await props.tl.contract.withdrawAll()

        props.setSelectedTimelock(-1)

        await toast.promise(tx.wait(), {
            success: 'Timelock withdrewn',
            pending: 'Waiting for transaction to be mined',
            error: 'Error while withdrawing'
        })

        props.getTls()
    }

    const sendErc = async (erc20, i) => {
        if (values[i] <= 0) { setWrongErc(wrongErc.map((v, x) => x == i ? true : v)); return; }
        const amount = ethers.utils.parseUnits(values[i], await erc20.contract.decimals());
        const tx = await erc20.contract.transfer(props.tl.address, amount);
        await tx.wait()
        console.log(tx)

        props.getTls()
        props.setSelectedTimelock(-1)
        toast(values[i] + ' of ' + erc20.symbol + ' has been sent.')
    }

    return (
        <div>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open
            //onClick={(e) => {e.stopPropagation(); props.setSelectedTimelock(-1)}}
            >
                <ClickAwayListener onClickAway={() => props.setSelectedTimelock(-1)}>
                    <Paper onClick={(e) => e.preventDefault()} key={props.tl.address} sx={{ userSelect: 'none', borderRadius: '10px', maxWidth: '350px', minWidth: '100px', padding: '10px' }}>
                        <Stack direction='column' alignItems='center'>
                            <Typography variant='h6'> {dayjs.unix(props.tl.timestamp) < dayjs() ? 'Unlocked!' : 'Unlocks:'} </Typography>
                            <p style={{ margin: '2px 0 10px 0' }}>at: {dayjs.unix(props.tl.timestamp).format('DD/MM/YY HH:mm')}</p>
                            <Typography variant='h6'> Values: </Typography>
                            <Stack direction='column'>
                                <Stack spacing={1} direction='row' alignItems='center' justifyContent='space-between' width='xl'>
                                    <p style={{ margin: '0' }}>{ethers.utils.formatEther(props.tl.ethBalance)}</p>
                                    <Typography variant='h6'>ETH</Typography>
                                    <TextField error={wrongEth} helperText={wrongEth && 'Wrong Amount'} variant="outlined" label='ETH' type='number' value={eth} onChange={e => { setEth(e.target.value); setWrongEth(false) }}></TextField>
                                    <Button variant='outlined' onClick={sendEth}>Add</Button>
                                </Stack>
                                {props.tl.erc20s.length > 0 &&
                                    props.tl.erc20s.map((erc20, i) => (
                                        <Stack key={erc20.symbol} spacing={1} direction='row' alignItems='center' justifyContent='space-between' width='xl'>
                                            <p style={{ margin: '0' }}>{ethers.utils.formatEther(erc20.balance)}</p>
                                            <Typography variant='h6'>{erc20.symbol}</Typography>
                                            <TextField error={wrongErc[i]} helperText={wrongErc[i] && 'Wrong amount'} variant="outlined" label={erc20.symbol} type='number' value={values[i]} onChange={e => { setWrongErc(wrongErc.map((v, x) => x == i ? false : v)); setValues(values.map((v, x) => x == i ? e.target.value : v)) }}></TextField>
                                            <Button variant='outlined' onClick={() => sendErc(erc20, i)}>Add</Button>
                                        </Stack>
                                    ))
                                }
                            </Stack>
                            <Button variant='outlined' fullWidth disabled={props.tl.timestamp > dayjs().unix()} onClick={withdrawAll}>Withdraw All</Button>
                        </Stack>
                    </Paper>
                </ClickAwayListener>
            </Backdrop>
        </div>
    )
}

export default TimelockOverlay;