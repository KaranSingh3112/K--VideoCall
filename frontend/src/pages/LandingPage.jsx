import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router'

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2>K VedioCall</h2>
        </div>
        <div className='navlist'>
          {
            !localStorage.getItem('token') ?
              <>
                <p onClick={() => navigate("/abcd")}>Join as Guests</p>
                <p onClick={() => navigate("/auth")}>Register</p>
                <div onClick={() => navigate("/auth")} role='button'>
                  Login
                </div>
              </> : <></>
          }


        </div>
      </nav>

      <div className='landingPageMainContainer'>
        <div>
          <h1><span style={{ color: "#FF9839" }}>Connect</span> with your Loved Ones</h1>
          <p>Cover a distance by K VedioCall</p>
          <div role='button'>
            <Link to="/home">Get Started</Link>
          </div>
        </div>
        <div>
          <img src="src\assets\mobile.png" alt="photo" />
        </div>
      </div>
    </div>
  )
}
