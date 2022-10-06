import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import '../assets/css/userstudyhome.css';
import Navbar from 'react-bootstrap/Navbar';
import '../assets/css/editAudioDesc.css';
import '../assets/css/notes.css';


const UserStudyHome = () => {
  
  return (
    
    <React.Fragment>
      <Navbar bg="dark" variant="dark" className='m-auto'>
      <Container>
        <Navbar.Brand href="#home" >
          Video Description User Study
        </Navbar.Brand>
      </Container>
    </Navbar>
      <div className="container home-container">     
        <div className=" text-white" >
          <h6 className="user-study-text text-center font-weight-bolder">
          Note: Please do the tutorial first. Please ensure that you attempt the video descriptions below in sequential order only. 
          </h6>
          <h6 className="user-study-text text-center font-weight-bolder">For example, complete Video 1 Before Video 2
          </h6>
          
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder"> Tutorial Video</h6>
    
         </div>
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            Video 1
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            Survey 1
          </div>
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            Video 2
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            Survey 2
          </div>
        </div>
        <hr />
        
      </div>
    </React.Fragment>
  );
};

export default UserStudyHome;
