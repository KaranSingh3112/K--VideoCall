import React from 'react'
import "../App.css"
import { Link } from 'react-router'

export default function LandingPage() {
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2>K VedioCall</h2>
        </div>
        <div className='navlist'>
          <p>Join as Guests</p>
          <p>Register</p>
          <div role='button'>
            Login
          </div>
        </div>
      </nav>

      <div className='landingPageMainContainer'>
        <div>
          <h1><span style={{color:"#FF9839"}}>Connect</span> with your Loved Ones</h1>
          <p>Cover a distance by K VedioCall</p>
          <div role='button'>
            <Link to="/auth">Get Started</Link>
          </div>
        </div>
        <div>
          <img src="src\assets\mobile.png" alt="photo" />
        </div>
      </div>
    </div>
  )
}
