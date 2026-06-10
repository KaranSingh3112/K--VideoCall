import React, { useEffect, useRef, useState } from 'react'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import io from "socket.io-client";
import styles from "../styles/VideoMeet.module.css"
import IconButton from '@mui/material/IconButton';
import VideocamIcon from "@mui/icons-material/Videocam"
import VideocamOffIcon from "@mui/icons-material/VideocamOff"
import CallEndIcon from "@mui/icons-material/CallEnd"
import MicIcon from "@mui/icons-material/Mic"
import MicOffIcon from "@mui/icons-material/MicOff"
import ScreenShareIcon from "@mui/icons-material/ScreenShare"
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare"
import ChatIcon from "@mui/icons-material/Chat"
import Badge from '@mui/material/Badge';
import { useNavigate } from 'react-router';
import server from '../environment';


const server_url = server;

var connections = {};
var pendingCandidates = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeet() {
    let routeTo = useNavigate();
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localvideoRef = useRef();
    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState([])
    let [audio, setAudio] = useState()
    let [screen, setScreen] = useState()
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState()
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    const videoRef = useRef([])
    let [videos, setVideos] = useState([]);
    

    // TODO
    // if(isChrome === false){

    // }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true })
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false)
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true)
            } else {
                setAudioAvailable(false)
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true)
            } else {
                setScreenAvailable(false)
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable })
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localvideoRef.current) {
                        localvideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (err) {
            console.log(err);

        }
    }

    useEffect(() => {
        getPermissions();
    }, [])

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) {
            console.log(e);
        }
        window.localStream = stream;
        localvideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            addTracksToConnection(connections[id], window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }
        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false)
            setAudio(false);

            try {
                let tracks = localvideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e);
            }
            //TODO blackSilence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence();
            localvideoRef.current.srcObject = window.localStream;


            for (let id in connections) {
                addTracksToConnection(connections[id], window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                        }).catch(e => console.log(e))
                })
            }
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let addTracksToConnection = (connection, stream) => {
        if (!stream) return;
        // Add video tracks first, then audio tracks (deterministic order for m-line matching)
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        videoTracks.forEach(track => {
            try {
                connection.addTrack(track, stream);
            } catch (e) {
                console.log('Error adding video track:', e);
            }
        });
        audioTracks.forEach(track => {
            try {
                connection.addTrack(track, stream);
            } catch (e) {
                console.log('Error adding audio track:', e);
            }
        });
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))

            } else {
            try {
                let tracks = localvideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop());
            } catch (err) {
                console.log(err);
            }
        }
    }

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia()
        }
    }, [audio, video])

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)
        if (fromId !== socketIdRef.current) {
            // ensure connection object exists for this peer
            if (!connections[fromId]) {
                connections[fromId] = new RTCPeerConnection(peerConfigConnections)
                connections[fromId].onicecandidate = function (event) {
                    if (event.candidate != null) {
                        socketRef.current.emit("signal", fromId, JSON.stringify({ 'ice': event.candidate }))
                    }
                }
                connections[fromId].onaddstream = (event) => {
                    let videoExists = videoRef.current.find(video => video.socketId === fromId);
                    if (videoExists) {
                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === fromId ? { ...video, stream: event.stream } : video
                            );
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        })
                    } else {
                        let newVideo = {
                            socketId: fromId,
                            stream: event.stream,
                            autoPlay: true,
                            playsinline: true
                        }
                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo]
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    }
                };

                // add local stream (or a silent/video placeholder) so m-lines match
                if (window.localStream !== undefined && window.localStream !== null) {
                    try { addTracksToConnection(connections[fromId], window.localStream) } catch (e) { console.log(e) }
                } else {
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                    window.localStream = blackSilence();
                    try { addTracksToConnection(connections[fromId], window.localStream) } catch (e) { console.log(e) }
                }
                pendingCandidates[fromId] = pendingCandidates[fromId] || []
            }
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    // flush any queued ICE candidates now remote description is set
                    if (pendingCandidates[fromId] && pendingCandidates[fromId].length) {
                        pendingCandidates[fromId].forEach(c => {
                            connections[fromId].addIceCandidate(new RTCIceCandidate(c)).catch(err => console.log('addIceCandidate error:', err))
                        })
                        pendingCandidates[fromId] = []
                    }
                    if (signal.sdp.type === "offer") {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
                            }).catch((e) => console.log(e))
                        }).catch((e) => console.log(e))
                    }
                }).catch((e) => console.log(e))
            }
            if (signal.ice) {
                // if remoteDescription is not yet set, queue the candidate
                if (!connections[fromId].remoteDescription || connections[fromId].remoteDescription.type === null) {
                    pendingCandidates[fromId] = pendingCandidates[fromId] || []
                    pendingCandidates[fromId].push(signal.ice)
                } else {
                    connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
                }
            }
        }
    }

    //TODO
    let addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevMessages) => prevMessages + 1)
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })
        socketRef.current.on('signal', gotMessageFromServer)
        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on("chat-message", addMessage)
            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })
            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo]
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        addTracksToConnection(connections[socketListId], window.localStream)
                    } else {
                        // TODO blackSilence
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence();
                        addTracksToConnection(connections[socketListId], window.localStream);
                    }
                })
                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue
                        try {
                            addTracksToConnection(connections[id2], window.localStream)
                        } catch (e) {
                            console.log(e);

                        }
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e)
                                )
                        })
                    }
                }
            })
        })
    }

    let getMedia = () => {
        setVideo(videoAvailable)
        setAudio(audioAvailable)
        connectToSocketServer();
    }

    let connect = () => {
        setAskForUsername(false)
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) {
            console.log(e);
        }
        window.localStream = stream;
        localvideoRef.current.srcObject = stream;
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            addTracksToConnection(connections[id], window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                    })
                    .catch((e) => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localvideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e);
            }
            //TODO blackSilence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence();
            localvideoRef.current.srcObject = window.localStream;


            getUserMedia();
        })
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((err) => console.log(err))
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen])

    let handleScreen = () => {
        setScreen(!screen)
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }

    let handleEndCall = () => {
        try {
            let tracks = localvideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop())
        } catch (e) {
            console.log(e);
        }

        routeTo("/home")
    }

    return (
        <div>
            {
                askForUsername === true ?
                    <div className={styles.lobbyContainer}>
                        <h2 className={styles.lobbyTitle}>Enter into Lobby</h2>
                        <div className={styles.lobbyControls}>
                            <TextField className={styles.lobbyInput} id="outlined-basic" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} variant="outlined" />
                            <Button className={styles.lobbyButton} variant="contained" onClick={connect}>Connect</Button>
                        </div>

                        <div className={styles.lobbyPreviewWrap}>
                            <video className={styles.lobbyPreview} ref={localvideoRef} autoPlay muted ></video>
                        </div>

                    </div> :
                    <div className={styles.meetVideoContainer}>

                        {
                            showModal ?
                                <div className={styles.chatRoom}>
                                    <div className={styles.chatContainer}>
                                        <h1>Chat</h1>

                                        <div className={styles.chattingDisplay}>
                                            {messages.length > 0 ? messages.map((item, index) => {
                                                return (
                                                    <div style={{marginBottom:"20px"}} key={index}>
                                                        <p style={{fontWeight:"bold"}}>{item.sender}</p>
                                                        <p>{item.data}</p>
                                                    </div>
                                                )
                                            }):<p>No Messages yet</p>}
                                        </div>

                                        <div className={styles.chattingArea}>
                                            <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter your chat" variant="outlined" />
                                            <Button variant='contained' onClick={sendMessage}>Send</Button>
                                        </div>
                                    </div>
                                </div> :
                                <></>
                        }

                        <div className={styles.buttonContainers}>
                            <IconButton style={{ color: "white" }} onClick={handleVideo}>
                                {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>

                            <IconButton style={{ color: "white" }} onClick={handleAudio}>
                                {(audio === true) ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>

                            {
                                screenAvailable === true ?
                                    <IconButton onClick={handleScreen} style={{ color: "white" }} >
                                        {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                                    </IconButton> : <></>
                            }

                            <Badge badgeContent={newMessages} max={999} color='secondary'>
                                <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>

                            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                                <CallEndIcon />
                            </IconButton>
                        </div>


                        {videos.length === 0 ? (
                            <div className={styles.soloView}>
                                <video className={styles.soloUserVideo} ref={localvideoRef} autoPlay muted></video>
                                <p className={styles.waitingText}>Waiting for participants to join...</p>
                            </div>
                        ) : (
                            <>
                                <video className={styles.meetUserVideo} ref={localvideoRef} autoPlay muted></video>
                                <div className={`${styles.conferenceView} ${videos.length === 1 ? styles.conferenceViewSingle : ""}`}>
                                    {
                                        videos.map((video, idx) => (
                                            <div key={`${video.socketId}-${idx}`}>
                                                <video
                                                    data-socket={video.socketId}
                                                                ref={ref => {
                                                                    if (ref && video.stream) {
                                                                        try {
                                                                            ref.srcObject = video.stream;
                                                                        } catch (e) { console.log(e) }
                                                                        // defer play slightly to avoid interrupted play/load race
                                                                        setTimeout(() => {
                                                                            ref.play().catch(err => {/* ignore play interruption */})
                                                                        }, 150)
                                                                    }
                                                                }}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                >

                                                </video>
                                            </div>
                                        ))
                                    }
                                </div>
                            </>
                        )}
                    </div>
            }
        </div>
    )
}
