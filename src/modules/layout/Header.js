import './Header.css';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import { Container, Tabs, Toolbar, Tab, Typography } from '@mui/material';
import { useContext } from 'react';
import { Signer } from '../../App';

const Header = (props) => {
    const signer = useContext(Signer);

    return (

        <AppBar position='static' sx={{backgroundColor: '#0F1539', paddingTop: '50px', zIndex: '2', userSelect: "none"}}>
            <Container maxWidth='x1'>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        TimeLocker
                    </Typography>
                    <Tabs value={props.tab} sx={{ flexGrow: 1 }}>
                        <Tab label='Create' color='white' onClick={() => props.setTab(0)}/>
                        <Tab label='My Timelocks' color='white' onClick={() => props.setTab(1)}/>
                    </Tabs>
                    {signer ? <Button variant='outlined' disableRipple disableElevation sx={{maxWidth: "100px", overflow: "hidden", textAlign: "left", justifyContent:"left", paddingLeft:'3px'}}> {props.account} </Button> : 
                    <Button variant="outlined" onClick={props.requestAccount}> Connect Wallet </Button>}
                </Toolbar>
            </Container>


        </AppBar>
    )
}

export default Header;