import React,{useState, useEffect} from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import '../assets/css/userstudyhome.css';
import Navbar from 'react-bootstrap/Navbar';
import '../assets/css/editAudioDesc.css';
import '../assets/css/notes.css';
import { useElapsedTime } from "use-elapsed-time";


// import Timer from '../components/Timer'
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';



const UserStudyHome = (props) => {

  const { participantId} = useParams();
  console.log(participantId)

  const [videoId, setVideoId] = useState('');
  const [userIdWithAi, setuserIdWithAi] = useState('');
  const [userIdWithoutAi, setuserIdWithoutAi] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);
  const { elapsedTime } = useElapsedTime({ isPlaying });

  const fetchParticipantData = () => {
    axios
      .get(`/api/create-participant-links/get-participant/${participantId}`)
      .then((res) => {
        setVideoId(res.data.youtube_video_id);
        setuserIdWithAi(res.data.user_id_with_AI);
        setuserIdWithoutAi(res.data.user_id_without_AI);
      })
      .catch((err) => {
        console.error(err.response.data);
      });
  };


  useEffect(() => {
    fetchParticipantData();
    document.addEventListener("keyup", () => {
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    });
  });

  const navigate = useNavigate();

  return (
    
    <React.Fragment>
      <Navbar bg="dark" variant="dark" className='m-auto justify-content-center'>
      <Container>
        <Navbar.Brand href="#home" >
        <h6 className="tutorial-text text-center font-weight-bolder"> Video Description User Study</h6>
        {/* <div className="app">
          <h1>use-elapsed-time demo</h1>
          <p>Press any key to play/pause time</p>
          <div style={{ fontSize: 56 }}>{elapsedTime.toFixed(2)}</div>
        </div> */}
        {/* <Timer/> */}
        {/* <div>
          <img 
          src='../assets/images/pause_white.png'
          ></img> 
        </div> */}
        {/* <img
          id="btn-timer"
          src="../assets/images/pause_white.png"
          style="height: 20px; width: 20px; color: white; margin-right: 10px"
        />
        <b
          ><span style="color: white">Time Elapsed:&nbsp;</span>
          <span style="color: white" id="txt-timeElaspsed">00:00</span></b
        > */}
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
            <h6 className="tutorial-text text-center font-weight-bolder"><Link to={`/${videoId}/${userIdWithoutAi}`}>Video 1 : Without AI support</Link></h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">User Survey for Video 1</h6>
          </div>
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder"><Link to={`/${videoId}/${userIdWithAi}`}>Video 2 : With AI support</Link></h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">User Survey for Video 2</h6>
          </div>
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder"> General Survey</h6>
         </div>
        </div>
        <hr />
        
      </div>
    </React.Fragment>
  );
};

export default UserStudyHome;
