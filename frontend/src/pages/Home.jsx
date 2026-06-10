import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router'
import "../styles/Home.css"
import IconButton from '@mui/material/IconButton'
import RestoreIcon from "@mui/icons-material/Restore"
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { AuthContext } from '../context/AuthContext'

function Home() {
  let navigate = useNavigate()
  const [meetingCode, setMeetingCode] = useState("")
  const { addToHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    await addToHistory(meetingCode)
    navigate(`/${meetingCode}`)
  }

  return (
    <>

      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 onClick={()=>navigate("/")} style={{cursor: "pointer"}}>K VideoCall</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => navigate("/history")}>
            <RestoreIcon />
          </IconButton>
          <p>History</p>
          <Button onClick={() => {
            localStorage.removeItem("token")
            navigate("/auth")
          }}>Logout</Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h2>Providing Quality Video Call Just Like Quality Education</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <TextField onChange={e => setMeetingCode(e.target.value)} id='outlined-basic' label="Meeting Code" variant='outlined' />
              <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <img srcSet='src/assets/logo3.png' alt="img" />
        </div>
      </div>
    </>
  )
}

export default withAuth(Home)
