import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home'

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext)
    const [meetings, setMeetings] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                console.log(history);
                console.log(typeof history);
                setMeetings(history);
            } catch (e) {
                console.log(e);
            }
        }
        fetchHistory();
    }, [])

    let formatDate = (dateString) => {
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    return (
        <div>
            <IconButton onClick={() => navigate("/home")}>
                <HomeIcon />
            </IconButton>
            {
                meetings.map((e, i) => {
                    return (
                        <>

                            <Card key={i} variant="outlined">
                                <CardContent>
                                    <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                                        Code: {e.meetingCode}
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                                        Date: {formatDate(e.date)}
                                    </Typography>

                                </CardContent>
                            </Card>
                        </>
                    )
                })
            }
        </div>
    )
}
