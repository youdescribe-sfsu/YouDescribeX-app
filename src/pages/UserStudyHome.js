import React,{useState, useEffect} from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import '../assets/css/userstudyhome.css';
import Navbar from 'react-bootstrap/Navbar';
import { RiSurveyFill,RiExternalLinkLine } from 'react-icons/ri';

// import '../assets/css/editAudioDesc.css';
// import '../assets/css/notes.css';
import { useElapsedTime } from "use-elapsed-time";


// import Timer from '../components/Timer'
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

const UserStudyHome = (props) => {

  const { participantId} = useParams();
  sessionStorage.setItem("id", participantId);
  console.log(participantId)

  const [videoIdWithAi, setVideoIdWithAi] = useState('');
  const [videoIdWithoutAi, setVideoIdWithoutAi] = useState('');
  const [userIdWithAi, setuserIdWithAi] = useState('');
  const [userIdWithoutAi, setuserIdWithoutAi] = useState('');
  const [randomOrder, setRandomOrder] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const { elapsedTime } = useElapsedTime({ isPlaying });

  const fetchParticipantData = () => {
    axios
      .get(`/api/create-participant-links/get-participant/${participantId}`)
      .then((res) => {
        setVideoIdWithAi(res.data.youtube_video_id_with_AI);
        setVideoIdWithoutAi(res.data.youtube_video_id_without_AI);
        setuserIdWithAi(res.data.user_id_with_AI);
        setuserIdWithoutAi(res.data.user_id_without_AI);
      })
      .catch((err) => {
        console.error(err.response.data);
      });
  };

  function charIsLetter(char) {
    if (typeof char !== 'string') {
      return false;
    }
    return /^[a-zA-Z]+$/.test(char);
  }

  useEffect(() => {
    fetchParticipantData();
    document.addEventListener("keyup", () => {
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    });
    setRandomOrder(charIsLetter(participantId.charAt(0)));
  });


  return (
    
    <React.Fragment>
      <Navbar bg="dark" variant="dark" className='m-auto justify-content-center'>
      {/* <Container> */}
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
        
      {/* </Container> */}
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
              <h6 className="tutorial-text text-center font-weight-bolder">
                  <a href={`https://www.youtube.com/playlist?list=PLNJrbI_nyy9uzywoJfyDRoeKA1SaIEFJ7`}>
                    <img src={`http://img.youtube.com/vi/24Pmmo9wKik/0.jpg`} width="70" height="70"></img>
                    &nbsp;Audio Description Basics for beginners</a>
              </h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder"><RiExternalLinkLine/>
                  &nbsp;Tutorial Video</h6>
         </div>
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
              {randomOrder ? 
                <a href={`/videopage/${videoIdWithoutAi}`}>
                  <img src={`http://img.youtube.com/vi/${videoIdWithoutAi}/0.jpg`} width="70" height="70"></img>
                  &nbsp;
                  Play Video 1 
                </a> 
              : 
                <a href={`/videopage/${videoIdWithAi}`} >
                  <img src={`http://img.youtube.com/vi/${videoIdWithAi}/0.jpg`} width="70" height="70"></img>
                  &nbsp;
                  Play Video 1 
                </a>
              } 
            </h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
              { randomOrder ?
                <Link to={`/${videoIdWithoutAi}/${userIdWithoutAi}`}>
                  {/* <img src={`http://img.youtube.com/vi/${videoIdWithAi}/0.jpg`} width="70" height="70"></img> */}
                  <RiExternalLinkLine/>
                  &nbsp;
                  FreeStyle Interface
                </Link>
              :
                <Link to={`/${videoIdWithAi}/${userIdWithAi}`} >
                  {/* <img src={`http://img.youtube.com/vi/${videoIdWithAi}/0.jpg`} width="70" height="70"></img> */}
                  <RiExternalLinkLine/>
                  &nbsp;
                  AI Prompted Interface
                </Link>
              }
            </h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
              { randomOrder ?
                <a href={`https://docs.google.com/forms/d/e/1FAIpQLSfKgSpEspPFszXUrgwiTxWK6Qk9J9dF8EBWnqUBn8-zVu--0A/viewform?usp=pp_url&entry.851854037=${participantId}`}>
                  {/* <img src="../assets/images/survey.png" width="70" height="70"></img> */}
                  <RiSurveyFill />
                  &nbsp;
                  User Survey for Video 1</a>
              :
                <a href={`https://docs.google.com/forms/d/e/1FAIpQLScN-w1k6pS3pdgEKVoYcWLhbwikAg2vbPqBDD7A4umTStoQuA/viewform?usp=pp_url&entry.221372424=${participantId}`}>
                  {/* <img src="../assets/images/survey.png" width="70" height="70"></img> */}
                  <RiSurveyFill/>
                  &nbsp;
                  User Survey for Video 1</a>             
              }
            </h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
              { randomOrder ?
                <a href={`https://sfsu.co1.qualtrics.com/jfe/form/SV_cTR8f4CwWTomvdA?participantID=${participantId}`}> <RiSurveyFill />
                &nbsp;NASA TLX Survey for Video 1</a>
              :
                <a href={`https://sfsu.co1.qualtrics.com/jfe/form/SV_eXOXVIPvO95SlGS?participantID=${participantId}`}> <RiSurveyFill />
                &nbsp;NASA TLX Survey for Video 1</a>
              }
            </h6>
          </div>
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
              {randomOrder ? 
                <Link to={`/videopage/${videoIdWithAi}`} >
                  <img src={`http://img.youtube.com/vi/${videoIdWithAi}/0.jpg`} width="70" height="70"></img>
                  &nbsp;
                  Play Video 2 
                </Link>
              : 
                <Link to={`/videopage/${videoIdWithoutAi}`}>
                  <img src={`http://img.youtube.com/vi/${videoIdWithoutAi}/0.jpg`} width="70" height="70"></img>
                  &nbsp;
                  Play Video 2 
                </Link> 
            } 
            </h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
              { randomOrder ?
              <Link to={`/${videoIdWithAi}/${userIdWithAi}`} ><RiExternalLinkLine/>
              &nbsp;AI Prompted Interface</Link>
              :
              <Link to={`/${videoIdWithoutAi}/${userIdWithoutAi}`}><RiExternalLinkLine/>
              &nbsp;FreeStyle Interface</Link>
            }
            </h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
            { randomOrder ?
              <a href={`https://docs.google.com/forms/d/e/1FAIpQLScN-w1k6pS3pdgEKVoYcWLhbwikAg2vbPqBDD7A4umTStoQuA/viewform?usp=pp_url&entry.221372424=${participantId}`}> <RiSurveyFill />
              &nbsp;User Survey for Video 2</a>
              :
              <a href={`https://docs.google.com/forms/d/e/1FAIpQLSfKgSpEspPFszXUrgwiTxWK6Qk9J9dF8EBWnqUBn8-zVu--0A/viewform?usp=pp_url&entry.851854037=${participantId}`}> <RiSurveyFill />
              &nbsp;User Survey for Video 2</a>
            }
            </h6>
          </div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
            { randomOrder ?
              <a href={`https://sfsu.co1.qualtrics.com/jfe/form/SV_eXOXVIPvO95SlGS?participantID=${participantId}`}> <RiSurveyFill />
              &nbsp;NASA TLX Survey for Video 2</a>
              :
              <a href={`https://sfsu.co1.qualtrics.com/jfe/form/SV_cTR8f4CwWTomvdA?participantID=${participantId}`}> <RiSurveyFill />
              &nbsp;NASA TLX Survey for Video 2</a>
            }
            </h6>
          </div>
        </div>
        <hr />
        <div>
          <div className="mx-auto my-auto text-bars align-items-center border rounded">
            <h6 className="tutorial-text text-center font-weight-bolder">
              <a href={`https://docs.google.com/forms/d/e/1FAIpQLSfoIOrNWzZXK4tJ4QDIFLrM7-mSFhGtyW6opra67smrz2nbqw/viewform?usp=pp_url&entry.186159302=${participantId}`}> <RiSurveyFill />
                  &nbsp; General Survey</a>
            </h6>
         </div>
        </div>
        <hr />
        
      </div>
    </React.Fragment>
  );
};

export default UserStudyHome;
